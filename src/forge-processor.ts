import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ForgeProcessorPhase = "red" | "verifyRed" | "green";
export type ForgeProcessorRequest = {
  phase: ForgeProcessorPhase;
  cwd: string;
  prompt: string;
  allowedPaths: string[];
  focusedCommand: string;
  packageSource: string;
  inputPatch?: string;
  timeoutMs?: number;
};

export type ForgeProcessorResult = {
  phase: ForgeProcessorPhase;
  status: "succeeded" | "retryable" | "blocked" | "contract_violation" | "infra_failed";
  parentDigest: { summary: string; testName?: string | null; failureExcerpt?: string | null; broaderChecks?: Array<{ command: string; status: "pass" | "fail" }> };
  focusedCommand: { command: string; exitCode: number | null; outcome: "pass" | "fail" | "not_run" | "error"; excerpt: string };
  changedFiles: string[];
  scopeOk: boolean;
  commitCountDelta: number;
  patch: string;
};

function quote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export async function sandboxCloneSource(cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--git-common-dir"], { cwd, timeout: 10_000 });
    const commonGitDir = resolve(cwd, String(stdout).trim());
    // Normal repositories report `<root>/.git`; bare repositories used as
    // worktree bases report the repository root itself.
    return basename(commonGitDir) === ".git" ? dirname(commonGitDir) : commonGitDir;
  } catch {
    return cwd;
  }
}

async function prepareSandboxCloneSource(cwd: string, outputDir: string): Promise<string> {
  const source = await sandboxCloneSource(cwd);
  let isBare = false;
  try {
    const { stdout } = await execFileAsync("git", ["-C", source, "rev-parse", "--is-bare-repository"], { cwd, timeout: 10_000 });
    isBare = String(stdout).trim() === "true";
  } catch {
    return source;
  }
  if (!isBare) return source;
  const staged = join(outputDir, "forge-base-clone");
  await execFileAsync("git", ["clone", "--shared", "--no-checkout", source, staged], { cwd, timeout: 120_000 });
  const { stdout: head } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd, timeout: 10_000 });
  await execFileAsync("git", ["-C", staged, "checkout", "--detach", String(head).trim()], { cwd, timeout: 10_000 });
  return staged;
}

function parseResult(output: string, phase: ForgeProcessorPhase): ForgeProcessorResult {
  const marker = output.match(/FORGE_PHASE_RESULT:(\{[^\n]+\})/);
  if (!marker) throw new Error(`Forge ${phase} worker did not return FORGE_PHASE_RESULT`);
  const parsed = JSON.parse(marker[1]) as ForgeProcessorResult;
  if (parsed.phase !== phase) throw new Error(`Forge worker returned ${parsed.phase}, expected ${phase}`);
  return parsed;
}

export async function runForgePhaseInSandbox(request: ForgeProcessorRequest): Promise<ForgeProcessorResult> {
  const timeoutMs = request.timeoutMs ?? 120_000;
  const outputDir = await mkdtemp(join(tmpdir(), "forge-processor-"));
  const promptPath = join(outputDir, "prompt.txt");
  const patchPath = join(outputDir, "phase.patch");
  const { writeFile, readFile } = await import("node:fs/promises");
  await writeFile(promptPath, request.prompt, "utf8");
  let sandbox = "";
  let sandboxName = "";
  let sandboxCwd = request.cwd;
  try {
    const originalCloneSource = await sandboxCloneSource(request.cwd);
    const cloneSource = await prepareSandboxCloneSource(request.cwd, outputDir);
    sandboxCwd = cloneSource;
    const packageSourceRepository = isAbsolute(request.packageSource) && existsSync(request.packageSource)
      ? await sandboxCloneSource(request.packageSource)
      : undefined;
    const sameRepository = packageSourceRepository !== undefined
      && packageSourceRepository === originalCloneSource;
    // Creating a container and cloning a large repository can exceed the
    // focused test command timeout; keep sandbox startup independently generous.
    const sandboxStartupTimeoutMs = Math.max(timeoutMs, 600_000);
    const stagedClone = cloneSource.startsWith(outputDir);
    sandboxName = `forge-${basename(outputDir)}`;
    const packageIsNestedInClone = isAbsolute(request.packageSource) && existsSync(request.packageSource)
      && request.packageSource !== originalCloneSource
      && (!relative(originalCloneSource, request.packageSource).startsWith("..")
        || !relative(request.cwd, request.packageSource).startsWith(".."));
    // A package mount nested inside the clone mount is otherwise shadowed by
    // the clone. Put a symlink outside the clone root so the runtime can mount
    // and address the package independently.
    const packageAlias = packageIsNestedInClone && !sameRepository
      ? join(outputDir, "package-source")
      : undefined;
    if (packageAlias) await symlink(request.packageSource, packageAlias, "dir");
    const mountedPackageSource = packageAlias ?? request.packageSource;
    const packageMount = isAbsolute(request.packageSource) && existsSync(request.packageSource) && !sameRepository
      ? `${mountedPackageSource}:ro`
      : undefined;
    const hostAgentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
    let agentDir = hostAgentDir;
    if (stagedClone && existsSync(hostAgentDir)) {
      agentDir = join(cloneSource, ".forge-agent-config");
      await mkdir(agentDir, { recursive: true });
      for (const file of ["settings.json", "auth.json", "models.json", "trust.json"]) {
        const source = join(hostAgentDir, file);
        if (existsSync(source)) await copyFile(source, join(agentDir, file));
      }
    }
    const mounts = packageMount ? [packageMount] : [];
    const createArgs = stagedClone
      ? ["create", "--name", sandboxName, "shell", cloneSource, ...mounts]
      : ["create", "--name", sandboxName, "--clone", "shell", cloneSource, ...mounts];
    await execFileAsync("sbx", createArgs, { cwd: sandboxCwd, timeout: sandboxStartupTimeoutMs });
    // --name makes the workspace identity deterministic; sbx stdout may be a
    // container id, which cannot be used with subsequent cp/exec/rm commands.
    sandbox = sandboxName;
    await execFileAsync("sbx", ["cp", promptPath, `${sandbox}:/tmp/forge-prompt.txt`], { cwd: sandboxCwd, timeout: timeoutMs });
    if (request.inputPatch) {
      const inputPath = join(outputDir, "input.patch");
      await writeFile(inputPath, request.inputPatch, "utf8");
      await execFileAsync("sbx", ["cp", inputPath, `${sandbox}:/tmp/forge-input.patch`], { cwd: sandboxCwd, timeout: timeoutMs });
      await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git apply /tmp/forge-input.patch"], { cwd: sandboxCwd, timeout: timeoutMs });
    }
    const before = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git rev-parse HEAD"], { cwd: sandboxCwd, timeout: timeoutMs });
    const packagePath = sameRepository ? "." : quote(mountedPackageSource);
    const cliPath = sameRepository
      ? "./node_modules/@earendil-works/pi-coding-agent/dist/cli.js"
      : join(mountedPackageSource, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
    const extensionPath = sameRepository ? "./dist/extensions/forge.js" : join(mountedPackageSource, "dist", "extensions", "forge.js");
    const promptCommand = `--no-session -p "$(cat /tmp/forge-prompt.txt)"`;
    const configEnv = `PI_CODING_AGENT_DIR=${quote(agentDir)}`;
    const cliShellPath = sameRepository ? cliPath : quote(cliPath);
    const extensionShellPath = sameRepository ? extensionPath : quote(extensionPath);
    const script = `if [ -f ${cliShellPath} ]; then ${configEnv} node ${cliShellPath} -e ${extensionShellPath} ${promptCommand}; elif command -v pi >/dev/null 2>&1; then ${configEnv} pi install ${packagePath} && ${configEnv} pi ${promptCommand}; else echo "Forge worker CLI is unavailable in the sandbox" >&2; exit 127; fi`;
    const worker = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", script], { cwd: sandboxCwd, timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 });
    const after = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git rev-parse HEAD"], { cwd: sandboxCwd, timeout: timeoutMs });
    const changed = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git diff --name-only"], { cwd: sandboxCwd, timeout: timeoutMs });
    const patch = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git diff"], { cwd: sandboxCwd, timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 });
    await writeFile(patchPath, String(patch.stdout), "utf8");
    const result = parseResult(`${worker.stdout}\n${worker.stderr}`, request.phase);
    result.changedFiles = String(changed.stdout).trim().split(/\n/).filter(Boolean);
    result.scopeOk = result.changedFiles.every((path) => request.allowedPaths.some((allowed) => path === allowed || path.startsWith(`${allowed}/`)));
    result.commitCountDelta = 0;
    result.patch = await readFile(patchPath, "utf8");
    if (String(before.stdout).trim() !== String(after.stdout).trim()) throw new Error("sandbox HEAD changed unexpectedly");
    return result;
  } catch (error) {
    const stderr = typeof (error as { stderr?: unknown }).stderr === "string"
      ? String((error as { stderr: string }).stderr).trim()
      : "";
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(stderr ? `${message}\n${stderr}` : message, { cause: error });
  } finally {
    const cleanupTarget = sandbox || sandboxName;
    if (cleanupTarget) { try { await execFileAsync("sbx", ["rm", cleanupTarget], { cwd: sandboxCwd, timeout: timeoutMs }); } catch {} }
    await rm(outputDir, { recursive: true, force: true });
  }
}
