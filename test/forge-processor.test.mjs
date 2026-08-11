import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import { runForgePhaseInSandbox } from "../dist/src/forge-processor.js";

const execFileAsync = promisify(execFile);
const repoRoot = new URL("..", import.meta.url).pathname;

test("runForgePhaseInSandbox uses the named sandbox for cp, exec, and rm", async (t) => {
	const worktree = join(tmpdir(), `forge-processor-worktree-${Date.now()}-${Math.random()}`);
	await execFileAsync("git", ["worktree", "add", "--detach", worktree, "HEAD"], { cwd: repoRoot });
	t.after(() => execFileAsync("git", ["worktree", "remove", "--force", worktree], { cwd: repoRoot }));

	const binDir = join(tmpdir(), `forge-processor-sbx-${Date.now()}-${Math.random()}`);
	await mkdir(binDir, { recursive: true });
	const callsPath = join(binDir, "calls.jsonl");
	await writeFile(join(binDir, "sbx"), String.raw`#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const callsPath = ${JSON.stringify(callsPath)};
const args = process.argv.slice(2);
appendFileSync(callsPath, JSON.stringify({ args, cwd: process.cwd() }) + "\n");
if (args[0] === "create") process.stdout.write("container-id\n");
else if (args[0] === "exec") {
  const command = args.at(-1);
  if (command === "git rev-parse HEAD") process.stdout.write("deadbeef\n");
  else if (command === "git diff") process.stdout.write("");
  else if (command === "git diff --name-only") process.stdout.write("");
  else process.stdout.write("FORGE_PHASE_RESULT:{\"phase\":\"red\",\"status\":\"succeeded\",\"parentDigest\":{\"summary\":\"ok\"},\"focusedCommand\":{\"command\":\"test\",\"exitCode\":0,\"outcome\":\"pass\",\"excerpt\":\"\"},\"changedFiles\":[],\"scopeOk\":true,\"commitCountDelta\":0,\"patch\":\"\"}\n");
}
`, { mode: 0o755 });
	const oldPath = process.env.PATH;
	process.env.PATH = `${binDir}:${oldPath ?? ""}`;
	t.after(async () => {
		process.env.PATH = oldPath;
		await rm(binDir, { recursive: true, force: true });
	});

	await runForgePhaseInSandbox({
		phase: "red",
		cwd: worktree,
		prompt: "prompt",
		allowedPaths: [],
		focusedCommand: "test",
		packageSource: "package.tgz",
		timeoutMs: 5_000,
	});

	const calls = (await readFile(callsPath, "utf8"))
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line));
	const createCall = calls.find(({ args }) => args[0] === "create");
	assert.equal(createCall.args[0], "create");
	assert.equal(createCall.args[1], "--name");
	assert.match(createCall.args[2], /^forge-forge-processor-[A-Za-z0-9]+$/);
	assert.deepEqual(createCall.args.slice(3), ["--clone", "shell", repoRoot.replace(/\/$/, "")]);
	assert.equal(createCall.cwd, repoRoot.replace(/\/$/, ""));
	const sandboxName = createCall.args[2];
	const promptCopyCall = calls.find(({ args }) => args[0] === "cp" && args[2]?.includes("forge-prompt.txt"));
	assert.deepEqual(promptCopyCall.args.slice(0, 3), ["cp", promptCopyCall.args[1], `${sandboxName}:/tmp/forge-prompt.txt`]);
	const execCalls = calls.filter(({ args }) => args[0] === "exec");
	assert.ok(execCalls.length > 0);
	assert.ok(execCalls.every(({ args }) => args[2] === sandboxName));

	const removeCall = calls.find(({ args }) => args[0] === "rm");
	assert.deepEqual(removeCall.args, ["rm", sandboxName]);
});


test("runForgePhaseInSandbox keeps a package from another worktree in the cloned workspace", async (t) => {
	const worktree = join(tmpdir(), `forge-processor-same-package-${Date.now()}-${Math.random()}`);
	const packageWorktree = join(tmpdir(), `forge-processor-same-package-source-${Date.now()}-${Math.random()}`);
	await execFileAsync("git", ["worktree", "add", "--detach", worktree, "HEAD"], { cwd: repoRoot });
	await execFileAsync("git", ["worktree", "add", "--detach", packageWorktree, "HEAD"], { cwd: repoRoot });
	t.after(async () => {
		await execFileAsync("git", ["worktree", "remove", "--force", worktree], { cwd: repoRoot });
		await execFileAsync("git", ["worktree", "remove", "--force", packageWorktree], { cwd: repoRoot });
	});
	const binDir = join(tmpdir(), `forge-processor-same-package-sbx-${Date.now()}-${Math.random()}`);
	await mkdir(binDir, { recursive: true });
	const callsPath = join(binDir, "calls.jsonl");
	await writeFile(join(binDir, "sbx"), String.raw`#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const callsPath = ${JSON.stringify(callsPath)};
const args = process.argv.slice(2);
appendFileSync(callsPath, JSON.stringify({ args, cwd: process.cwd() }) + "\n");
if (args[0] === "create") process.stdout.write("container-id\n");
else if (args[0] === "exec") {
  const command = args.at(-1);
  if (command === "git rev-parse HEAD") process.stdout.write("deadbeef\n");
  else if (command === "git diff" || command === "git diff --name-only") process.stdout.write("");
  else process.stdout.write("FORGE_PHASE_RESULT:{\"phase\":\"red\",\"status\":\"succeeded\",\"parentDigest\":{\"summary\":\"ok\"},\"focusedCommand\":{\"command\":\"test\",\"exitCode\":0,\"outcome\":\"pass\",\"excerpt\":\"\"},\"changedFiles\":[],\"scopeOk\":true,\"commitCountDelta\":0,\"patch\":\"\"}\n");
}
`, { mode: 0o755 });
	const oldPath = process.env.PATH;
	process.env.PATH = `${binDir}:${oldPath ?? ""}`;
	t.after(async () => { process.env.PATH = oldPath; await rm(binDir, { recursive: true, force: true }); });
	await runForgePhaseInSandbox({ phase: "red", cwd: worktree, prompt: "prompt", allowedPaths: [], focusedCommand: "test", packageSource: packageWorktree, timeoutMs: 5_000 });
	const calls = (await readFile(callsPath, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
	const createCall = calls.find(({ args }) => args[0] === "create");
	assert.deepEqual(createCall.args.slice(3, 6), ["--clone", "shell", repoRoot.replace(/\/$/, "")]);
	const packageMount = createCall.args.find((arg) => arg.endsWith(":ro"));
	assert.ok(packageMount);
	assert.notEqual(packageMount.slice(0, -3), packageWorktree);
	const workerCall = calls.find(({ args }) => args[0] === "exec" && args.at(-1).includes("FORGE_PHASE_RESULT") === false && args.at(-1).includes("git rev-parse HEAD") === false && args.at(-1).includes("git diff") === false);
	assert.match(workerCall.args.at(-1), /node .*package-source.*pi-coding-agent/);
	assert.match(workerCall.args.at(-1), /dist\/extensions\/forge\.js/);
});


test("runForgePhaseInSandbox aliases a distinct package nested under the clone", async (t) => {
	const worktree = join(tmpdir(), `forge-processor-nested-package-${Date.now()}-${Math.random()}`);
	await execFileAsync("git", ["worktree", "add", "--detach", worktree, "HEAD"], { cwd: repoRoot });
	t.after(() => execFileAsync("git", ["worktree", "remove", "--force", worktree], { cwd: repoRoot }));
	const packageSource = join(repoRoot, `.forge-nested-package-${Date.now()}-${Math.random()}`);
	await mkdir(packageSource, { recursive: true });
	await execFileAsync("git", ["init", "-q"], { cwd: packageSource });
	t.after(() => rm(packageSource, { recursive: true, force: true }));
	const binDir = join(tmpdir(), `forge-processor-nested-sbx-${Date.now()}-${Math.random()}`);
	await mkdir(binDir, { recursive: true });
	const callsPath = join(binDir, "calls.jsonl");
	await writeFile(join(binDir, "sbx"), String.raw`#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const callsPath = ${JSON.stringify(callsPath)};
const args = process.argv.slice(2);
appendFileSync(callsPath, JSON.stringify({ args, cwd: process.cwd() }) + "\n");
if (args[0] === "create") process.stdout.write("container-id\n");
else if (args[0] === "exec") {
  const command = args.at(-1);
  if (command === "git rev-parse HEAD") process.stdout.write("deadbeef\n");
  else if (command === "git diff" || command === "git diff --name-only") process.stdout.write("");
  else process.stdout.write("FORGE_PHASE_RESULT:{\"phase\":\"red\",\"status\":\"succeeded\",\"parentDigest\":{\"summary\":\"ok\"},\"focusedCommand\":{\"command\":\"test\",\"exitCode\":0,\"outcome\":\"pass\",\"excerpt\":\"\"},\"changedFiles\":[],\"scopeOk\":true,\"commitCountDelta\":0,\"patch\":\"\"}\n");
}
`, { mode: 0o755 });
	const oldPath = process.env.PATH;
	process.env.PATH = `${binDir}:${oldPath ?? ""}`;
	t.after(async () => { process.env.PATH = oldPath; await rm(binDir, { recursive: true, force: true }); });
	await runForgePhaseInSandbox({ phase: "red", cwd: worktree, prompt: "prompt", allowedPaths: [], focusedCommand: "test", packageSource, timeoutMs: 5_000 });
	const calls = (await readFile(callsPath, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
	const createCall = calls.find(({ args }) => args[0] === "create");
	const aliasMount = createCall.args.find((arg) => arg.endsWith(":ro"));
	assert.ok(aliasMount);
	const alias = aliasMount.slice(0, -3);
	assert.notEqual(alias, packageSource);
	assert.ok(alias.startsWith(tmpdir()));
	assert.ok(alias.includes("package-source"));
	const workerCall = calls.find(({ args }) => args[0] === "exec" && args.at(-1)?.includes("FORGE_PHASE_RESULT") === false && args.at(-1)?.includes("git rev-parse HEAD") === false && args.at(-1)?.includes("git diff") === false);
	assert.ok(workerCall);
	assert.ok(workerCall.args.at(-1).includes(alias));
	assert.ok(!workerCall.args.at(-1).includes(packageSource));
});


test("runForgePhaseInSandbox keeps a same-repository package in the sandbox workspace", async (t) => {
	const bareRepo = join(tmpdir(), `forge-processor-bare-${Date.now()}-${Math.random()}`);
	await execFileAsync("git", ["clone", "--bare", repoRoot, bareRepo], { cwd: repoRoot });
	t.after(() => rm(bareRepo, { recursive: true, force: true }));

	const binDir = join(tmpdir(), `forge-processor-sbx-${Date.now()}-${Math.random()}`);
	await mkdir(binDir, { recursive: true });
	const callsPath = join(binDir, "calls.jsonl");
	await writeFile(join(binDir, "sbx"), String.raw`#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const callsPath = ${JSON.stringify(callsPath)};
const args = process.argv.slice(2);
appendFileSync(callsPath, JSON.stringify({ args, cwd: process.cwd() }) + "\n");
if (args[0] === "create") process.stdout.write("container-id\n");
else if (args[0] === "exec") {
  const command = args.at(-1);
  if (command === "git rev-parse HEAD") process.stdout.write("deadbeef\n");
  else if (command === "git diff") process.stdout.write("");
  else if (command === "git diff --name-only") process.stdout.write("");
  else process.stdout.write("FORGE_PHASE_RESULT:{\"phase\":\"red\",\"status\":\"succeeded\",\"parentDigest\":{\"summary\":\"ok\"},\"focusedCommand\":{\"command\":\"test\",\"exitCode\":0,\"outcome\":\"pass\",\"excerpt\":\"\"},\"changedFiles\":[],\"scopeOk\":true,\"commitCountDelta\":0,\"patch\":\"\"}\n");
}
`, { mode: 0o755 });
	const oldPath = process.env.PATH;
	process.env.PATH = `${binDir}:${oldPath ?? ""}`;
	t.after(async () => {
		process.env.PATH = oldPath;
		await rm(binDir, { recursive: true, force: true });
	});

	await runForgePhaseInSandbox({
		phase: "red",
		cwd: bareRepo,
		prompt: "prompt",
		allowedPaths: [],
		focusedCommand: "test",
		packageSource: bareRepo,
		timeoutMs: 5_000,
	});

	const calls = (await readFile(callsPath, "utf8"))
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line));
	const createCall = calls.find(({ args }) => args[0] === "create");
	assert.ok(createCall);
	assert.equal(createCall.args[0], "create");
	assert.ok(!createCall.args.some((arg) => arg === `${bareRepo}:ro`));

	const workerCall = calls.find(({ args }) => args[0] === "exec" && args.at(-1)?.includes("FORGE_PHASE_RESULT") === false && args.at(-1)?.includes("pi install"));
	assert.ok(workerCall);
	const workerCommand = workerCall.args.at(-1);
	assert.ok(workerCommand.includes("package-source"));
	assert.match(workerCommand, /node '[^']*package-source\/node_modules\/@earendil-works\/pi-coding-agent\/dist\/cli\.js'/);
	assert.match(workerCommand, /-e '[^']*package-source\/dist\/extensions\/forge\.js'/);
	assert.ok(!workerCommand.includes(bareRepo));
});
