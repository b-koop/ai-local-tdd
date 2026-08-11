import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  try {
    const created = await execFileAsync("sbx", ["create", "--clone", "shell", "."], { cwd: request.cwd, timeout: timeoutMs });
    sandbox = String(created.stdout).trim().split(/\s+/)[0];
    await execFileAsync("sbx", ["cp", promptPath, `${sandbox}:/tmp/forge-prompt.txt`], { cwd: request.cwd, timeout: timeoutMs });
    if (request.inputPatch) {
      const inputPath = join(outputDir, "input.patch");
      await writeFile(inputPath, request.inputPatch, "utf8");
      await execFileAsync("sbx", ["cp", inputPath, `${sandbox}:/tmp/forge-input.patch`], { cwd: request.cwd, timeout: timeoutMs });
      await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git apply /tmp/forge-input.patch"], { cwd: request.cwd, timeout: timeoutMs });
    }
    const before = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git rev-parse HEAD"], { cwd: request.cwd, timeout: timeoutMs });
    const script = `pi install ${quote(request.packageSource)} && pi -p "$(cat /tmp/forge-prompt.txt)"`;
    const worker = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", script], { cwd: request.cwd, timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 });
    const after = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git rev-parse HEAD"], { cwd: request.cwd, timeout: timeoutMs });
    const changed = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git diff --name-only"], { cwd: request.cwd, timeout: timeoutMs });
    const patch = await execFileAsync("sbx", ["exec", "-it", sandbox, "bash", "-lc", "git diff"], { cwd: request.cwd, timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 });
    await writeFile(patchPath, String(patch.stdout), "utf8");
    const result = parseResult(`${worker.stdout}\n${worker.stderr}`, request.phase);
    result.changedFiles = String(changed.stdout).trim().split(/\n/).filter(Boolean);
    result.scopeOk = result.changedFiles.every((path) => request.allowedPaths.some((allowed) => path === allowed || path.startsWith(`${allowed}/`)));
    result.commitCountDelta = 0;
    result.patch = await readFile(patchPath, "utf8");
    if (String(before.stdout).trim() !== String(after.stdout).trim()) throw new Error("sandbox HEAD changed unexpectedly");
    return result;
  } finally {
    if (sandbox) { try { await execFileAsync("sbx", ["rm", sandbox], { cwd: request.cwd, timeout: timeoutMs }); } catch {} }
    await rm(outputDir, { recursive: true, force: true });
  }
}
