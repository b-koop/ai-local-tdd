import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import registerTicketMasterExtension, {
	buildChildBranchName,
	buildForgeWorkerPrompt,
	parseTicketMasterArgs,
	sortChildrenForQueue,
} from "../dist/extensions/ticket-master.js";

const repoRoot = new URL("..", import.meta.url).pathname;

function issueTreeFixture(parent, children) {
	return JSON.stringify({
		data: {
			issue: {
				identifier: parent.id,
				title: parent.title,
				description: parent.description,
				state: { name: parent.status ?? "Todo", type: "unstarted" },
				assignee: parent.assignee ?? null,
				children: {
					nodes: children.map((child) => ({
						identifier: child.id,
						title: child.title,
						description: child.description,
						state: { name: child.status ?? "Todo", type: "unstarted" },
						assignee: child.assignee ?? null,
					})),
				},
			},
		},
	});
}

async function withFakeCommands(t, handlers) {
	const binDir = await mkdir(
		join(tmpdir(), `ticket-master-bin-${Date.now()}-${Math.random()}`),
		{ recursive: true },
	);
	const callsPath = join(binDir, "calls.jsonl");
	const script = `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const { basename } = require("node:path");
const handlers = ${JSON.stringify(handlers)};
const name = basename(process.argv[1]);
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(callsPath)}, JSON.stringify({ name, args }) + "\\n");
const key = name + " " + args.join(" ");
const countsPath = ${JSON.stringify(callsPath + ".counts")};
const prefixKey = name + " " + (args[0] || "");
let handler = handlers[key] || handlers[prefixKey] || handlers[name] || { stdout: "" };
let counts = {};
try { counts = JSON.parse(require("node:fs").readFileSync(countsPath, "utf8")); } catch {}
const countKey = "__count_" + (handlers[key] ? key : handlers[prefixKey] ? prefixKey : name);
const count = counts[countKey] || 0;
counts[countKey] = count + 1;
require("node:fs").writeFileSync(countsPath, JSON.stringify(counts));
if (Array.isArray(handler)) handler = handler[Math.min(count, handler.length - 1)] || { stdout: "" };
if (handler.stderr) process.stderr.write(handler.stderr);
if (handler.stdout) process.stdout.write(handler.stdout);
process.exit(handler.exitCode || 0);
`;
	await Promise.all(
		["linear", "git", "sbx", "gh", "pi"].map((name) =>
			writeFile(join(binDir, name), script, { mode: 0o755 }),
		),
	);
	const oldPath = process.env.PATH;
	process.env.PATH = `${binDir}:${oldPath ?? ""}`;
	t.after(async () => {
		process.env.PATH = oldPath;
		await rm(binDir, { recursive: true, force: true });
	});
	return {
		async calls() {
			try {
				const source = await readFile(callsPath, "utf8");
				return source
					.trim()
					.split("\n")
					.filter(Boolean)
					.map((line) => JSON.parse(line));
			} catch {
				return [];
			}
		},
	};
}

test("/ticket-master parses parent, base, package, and extra context", () => {
	assert.deepEqual(
		parseTicketMasterArgs(
			"DELTA-1 --base release/core --package npm:@ai-local/tdd preserve this",
		),
		{
			parentTicketId: "DELTA-1",
			baseBranch: "release/core",
			packageSource: "npm:@ai-local/tdd",
			extraContext: "preserve this",
		},
	);
	assert.equal(
		parseTicketMasterArgs(
			"DELTA-1 --origin feature/ghee --package /run/sandbox/source",
		).baseBranch,
		"feature/ghee",
	);
});

test("ticket-master branch names are deterministic and safe", () => {
	assert.equal(
		buildChildBranchName(
			"DELTA-6144",
			"Add shared revision metadata & lineage fields!",
		),
		"feature/delta-6144-add-shared-revision-metadata-lineage-fields",
	);
});

test("ticket-master queue preserves child order while respecting blockers", () => {
	const ordered = sortChildrenForQueue([
		{ id: "B", title: "Second", status: "Todo", blockedBy: ["A"] },
		{ id: "A", title: "First", status: "Todo", blockedBy: [] },
		{ id: "C", title: "Third", status: "Done", blockedBy: [] },
	]);
	assert.deepEqual(
		ordered.map((ticket) => ticket.id),
		["A", "B"],
	);
});

test("ticket-master worker prompt runs local Forge and includes package install context", () => {
	const prompt = buildForgeWorkerPrompt({
		parent: { id: "PARENT-1", title: "Parent" },
		child: {
			id: "CHILD-1",
			title: "Child",
			description: "Do it",
			status: "Todo",
		},
		position: 1,
		total: 2,
		branchBase: "main",
		childBranch: "feature/child-1-child",
		prTarget: "main",
		packageSource: "npm:@ai-local/tdd",
		extraContext: "extra user context",
		previous: undefined,
	});
	assert.match(prompt, /\/forge --local/);
	assert.match(
		prompt,
		/Install or verify Pi package source before Forge: npm:@ai-local\/tdd/,
	);
	assert.match(prompt, /Create your branch from main/);
	assert.match(prompt, /Open your PR against main/);
	assert.match(prompt, /feature\/child-1-child/);
});

test("/tm runs Todo children through sbx, installs package, invokes Forge local, and creates draft PRs", async (t) => {
	const fake = await withFakeCommands(t, {
		"git branch --show-current": { stdout: "main\n" },
		"linear auth whoami": {
			stdout:
				"Workspace: Test\nUser: BK\n  Display name: user-1\n  Email: bk@example.test\n",
		},
		"linear api": {
			stdout: issueTreeFixture(
				{ id: "PARENT-1", title: "Parent ticket", description: "Parent body" },
				[
					{
						id: "CHILD-1",
						title: "First child",
						description: "First body",
						status: "Todo",
						assignee: null,
					},
					{
						id: "CHILD-2",
						title: "Second child",
						description: "Second body",
						status: "Todo",
						assignee: { displayName: "user-1", name: "BK" },
					},
				],
			),
		},
		linear: { stdout: "{}" },
		"sbx create --clone shell .": { stdout: "tm-sandbox\n" },
		sbx: [
			{
				stdout:
					'TICKET_MASTER_RESULT:{"branch":"feature/child-1-first-child","commit":"abc123","validation":["pnpm test"],"risks":"none"}\n',
			},
			{
				stdout:
					'TICKET_MASTER_RESULT:{"branch":"feature/child-2-second-child","commit":"def456","validation":["pnpm test"],"risks":"none"}\n',
			},
		],
		gh: { stdout: "https://github.test/pr/1\n" },
	});

	const commands = new Map();
	const notifications = [];
	registerTicketMasterExtension({
		on() {},
		registerCommand(name, command) {
			commands.set(name, command);
		},
	});

	await commands
		.get("tm")
		.handler("PARENT-1 --base main --package /tmp/the-forge keep context", {
			cwd: repoRoot,
			isIdle: () => true,
			ui: {
				notify(message, level) {
					notifications.push({ message, level });
				},
				setStatus() {},
			},
		});

	const calls = await fake.calls();
	assert.ok(
		calls.some(
			(call) =>
				call.name === "linear" &&
				call.args.includes("--assignee") &&
				call.args.includes("user-1"),
		),
	);
	assert.ok(
		calls.some(
			(call) =>
				call.name === "linear" &&
				call.args.includes("--state") &&
				call.args.includes("In Progress"),
		),
	);
	const sbxExec = calls.filter(
		(call) => call.name === "sbx" && call.args[0] === "exec",
	);
	assert.equal(sbxExec.length, 2);
	assert.ok(
		sbxExec.every((call) =>
			/pi install ['"]?\/tmp\/the-forge/.test(call.args.join(" ")),
		),
	);
	assert.ok(
		sbxExec.every((call) => call.args.join(" ").includes("/forge --local")),
	);
	const prCalls = calls.filter(
		(call) =>
			call.name === "gh" &&
			call.args.slice(0, 3).join(" ") === "pr create --draft",
	);
	assert.equal(prCalls.length, 2);
	assert.ok(
		prCalls.every(
			(call) => call.args.includes("--base") && call.args.includes("main"),
		),
	);
	assert.ok(
		notifications.some((notification) => /complete/.test(notification.message)),
	);
	const commentBodies = await Promise.all(
		calls
			.filter(
				(call) =>
					call.name === "linear" &&
					call.args.slice(0, 3).join(" ") === "issue comment add" &&
					call.args.includes("--body-file"),
			)
			.map((call) =>
				readFile(call.args[call.args.indexOf("--body-file") + 1], "utf8"),
			),
	);
	const logs = commentBodies.join("\n---\n");
	assert.match(logs, /State: loaded/);
	assert.match(logs, /State: queue-ready/);
	assert.match(logs, /State: worker-launching/);
	assert.match(logs, /State: worker-complete/);
	assert.match(logs, /State: draft-pr-created/);
});

test("ticket-master reads linear auth whoami without requiring json support", async (t) => {
	const fake = await withFakeCommands(t, {
		"git branch --show-current": { stdout: "main\n" },
		"linear auth whoami --json": {
			stderr: 'error: Unknown option "--json"',
			exitCode: 1,
		},
		"linear auth whoami": {
			stdout:
				"Workspace: G2i AI\nUser: Brie Koop\n  Display name: briekoop\n  Email: brie.koop@g2i.ai\n",
		},
		"linear api": {
			stdout: issueTreeFixture({ id: "PARENT-1", title: "Parent" }, [
				{
					id: "CHILD-1",
					title: "First child",
					description: "First",
					status: "Todo",
				},
			]),
		},
		linear: { stdout: "{}" },
		"sbx create --clone shell .": { stdout: "tm-sandbox\n" },
		sbx: {
			stdout:
				'TICKET_MASTER_RESULT:{"branch":"feature/child-1-first-child","commit":"abc123","validation":["pnpm test"],"risks":"none"}\n',
		},
		gh: { stdout: "https://github.test/pr/1\n" },
	});
	const commands = new Map();
	registerTicketMasterExtension({
		on() {},
		registerCommand(name, command) {
			commands.set(name, command);
		},
	});

	await commands
		.get("tm")
		.handler("PARENT-1 --origin main --package /tmp/the-forge", {
			cwd: repoRoot,
			isIdle: () => true,
			ui: { notify() {}, setStatus() {} },
		});

	const calls = await fake.calls();
	assert.ok(
		calls.some(
			(call) => call.name === "linear" && call.args.join(" ") === "auth whoami",
		),
	);
	assert.equal(
		calls.some(
			(call) =>
				call.name === "linear" && call.args.join(" ") === "auth whoami --json",
		),
		false,
	);
	assert.ok(
		calls.some(
			(call) =>
				call.name === "linear" &&
				call.args.includes("--assignee") &&
				call.args.includes("briekoop"),
		),
	);
});

test("ticket-master retries a failed worker once and stops before advancing branch ancestry", async (t) => {
	const fake = await withFakeCommands(t, {
		"git branch --show-current": { stdout: "main\n" },
		"linear auth whoami": {
			stdout:
				"Workspace: Test\nUser: BK\n  Display name: user-1\n  Email: bk@example.test\n",
		},
		"linear api": {
			stdout: issueTreeFixture({ id: "PARENT-1", title: "Parent" }, [
				{
					id: "CHILD-1",
					title: "First child",
					description: "First",
					status: "Todo",
				},
			]),
		},
		linear: { stdout: "{}" },
		"sbx create --clone shell .": { stdout: "tm-sandbox\n" },
		sbx: { stdout: "worker failed\n", exitCode: 1 },
	});
	const commands = new Map();
	registerTicketMasterExtension({
		on() {},
		registerCommand(name, command) {
			commands.set(name, command);
		},
	});

	await commands
		.get("ticket-master")
		.handler("PARENT-1 --package /tmp/the-forge", {
			cwd: repoRoot,
			isIdle: () => true,
			ui: { notify() {}, setStatus() {} },
		});

	const calls = await fake.calls();
	assert.equal(
		calls.filter((call) => call.name === "sbx" && call.args[0] === "exec")
			.length,
		2,
	);
	assert.equal(
		calls.filter((call) => call.name === "gh" && call.args[0] === "pr").length,
		0,
	);
	assert.ok(
		calls.some(
			(call) =>
				call.name === "linear" &&
				call.args.includes("comment") &&
				call.args.includes("add"),
		),
	);
});
