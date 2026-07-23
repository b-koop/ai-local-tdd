import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
type ExtensionCommandContext = {
	cwd: string;
	ui: {
		notify(message: string, level?: "info" | "warning" | "error"): void;
		setStatus(key: string, value: string | undefined): void;
	};
};

type ExtensionAPI = {
	on(
		event: "session_start",
		handler: (event: unknown, ctx: ExtensionCommandContext) => void,
	): void;
	registerCommand(
		name: string,
		command: {
			description: string;
			handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>;
		},
	): void;
};

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 120_000;
const IN_PROGRESS_STATUS = "In Progress";
const ISSUE_TREE_QUERY =
	"query($id:String!){ issue(id:$id){ identifier title description state{name type} assignee{id name displayName email} children { nodes { identifier title description state{name type} assignee{id name displayName email} } } } }";

type CommandStatus = {
	phase: "idle" | "working" | "blocked";
	target: string;
	progress: string;
};

export type ParsedTicketMasterArgs = {
	parentTicketId: string;
	baseBranch?: string;
	packageSource?: string;
	extraContext: string;
};

export type TicketSummary = {
	id: string;
	title: string;
	description?: string;
	status?: string;
	assignee?: { id?: string; name?: string } | string | null;
	blockedBy?: string[];
	blocking?: string[];
};

type CurrentUser = { id: string; name?: string };

type WorkerPromptInput = {
	parent: TicketSummary;
	child: TicketSummary;
	position: number;
	total: number;
	branchBase: string;
	childBranch: string;
	prTarget: string;
	packageSource: string;
	extraContext?: string;
	previous?: { id: string; branch: string; prUrl?: string };
};

type WorkerResult = {
	branch: string;
	commit?: string;
	validation?: string[];
	risks?: string;
	summary?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeStringList(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.map(asString).filter((item): item is string => Boolean(item));
}

export function parseTicketMasterArgs(args: string): ParsedTicketMasterArgs {
	const tokens = args.trim().split(/\s+/).filter(Boolean);
	let parentTicketId = "";
	let baseBranch: string | undefined;
	let packageSource: string | undefined;
	const extra: string[] = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (token === "--base" || token === "--origin") {
			baseBranch = tokens[index + 1];
			index += 1;
			continue;
		}
		if (token === "--package") {
			packageSource = tokens[index + 1];
			index += 1;
			continue;
		}
		if (!parentTicketId) {
			parentTicketId = token;
			continue;
		}
		extra.push(token);
	}

	return {
		parentTicketId,
		baseBranch,
		packageSource,
		extraContext: extra.join(" "),
	};
}

function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

export function buildChildBranchName(ticketId: string, title: string): string {
	const id = slugify(ticketId);
	const titleSlug = slugify(title).slice(0, 80).replace(/-+$/g, "");
	return `feature/${id}${titleSlug ? `-${titleSlug}` : ""}`;
}

function isTodo(status: string | undefined): boolean {
	return (status ?? "").toLowerCase() === "todo";
}

function isAssignedToOther(
	ticket: TicketSummary,
	currentUser: CurrentUser,
): boolean {
	if (!ticket.assignee) return false;
	if (typeof ticket.assignee === "string") {
		return (
			ticket.assignee !== currentUser.id && ticket.assignee !== currentUser.name
		);
	}
	return Boolean(ticket.assignee.id && ticket.assignee.id !== currentUser.id);
}

function createQueueGraph(todoChildren: TicketSummary[]) {
	const byId = new Map(todoChildren.map((child) => [child.id, child]));
	const edges = new Map<string, Set<string>>();
	const incoming = new Map<string, number>();
	for (const child of todoChildren) {
		edges.set(child.id, new Set());
		incoming.set(child.id, 0);
	}
	const addEdge = (from: string, to: string) => {
		if (!byId.has(from) || !byId.has(to)) return;
		edges.get(from)?.add(to);
		incoming.set(to, (incoming.get(to) ?? 0) + 1);
	};
	for (const child of todoChildren) {
		for (const blocker of child.blockedBy ?? []) addEdge(blocker, child.id);
		for (const blocked of child.blocking ?? []) addEdge(child.id, blocked);
	}
	return { byId, edges, incoming };
}

function sortReadyQueue(
	ready: TicketSummary[],
	originalIndex: Map<string, number>,
): void {
	ready.sort(
		(a, b) => (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0),
	);
}

export function sortChildrenForQueue(
	children: TicketSummary[],
): TicketSummary[] {
	const todoChildren = children.filter((child) => isTodo(child.status));
	const originalIndex = new Map(
		todoChildren.map((child, index) => [child.id, index]),
	);
	const { byId, edges, incoming } = createQueueGraph(todoChildren);
	const ready = todoChildren.filter(
		(child) => (incoming.get(child.id) ?? 0) === 0,
	);
	sortReadyQueue(ready, originalIndex);
	const result: TicketSummary[] = [];
	while (ready.length > 0) {
		const next = ready.shift();
		if (!next) break;
		result.push(next);
		for (const blocked of edges.get(next.id) ?? []) {
			incoming.set(blocked, (incoming.get(blocked) ?? 0) - 1);
			if ((incoming.get(blocked) ?? 0) !== 0) continue;
			const blockedTicket = byId.get(blocked);
			if (!blockedTicket) continue;
			ready.push(blockedTicket);
			sortReadyQueue(ready, originalIndex);
		}
	}
	if (result.length !== todoChildren.length) {
		throw new Error("Child ticket queue contains a blocker cycle.");
	}
	return result;
}

async function run(
	command: string,
	args: string[],
	cwd: string,
): Promise<string> {
	const { stdout } = await execFileAsync(command, args, {
		cwd,
		maxBuffer: 10 * 1024 * 1024,
		timeout: COMMAND_TIMEOUT_MS,
	});
	return String(stdout).trim();
}

function parseJsonObject(source: string): unknown {
	try {
		return JSON.parse(source || "null");
	} catch {
		return null;
	}
}

function parseTicket(value: unknown, fallbackId = ""): TicketSummary {
	if (!isRecord(value)) return { id: fallbackId, title: fallbackId };
	return {
		id: asString(value.id) ?? asString(value.identifier) ?? fallbackId,
		title: asString(value.title) ?? asString(value.name) ?? fallbackId,
		description: asString(value.description) ?? asString(value.body),
		status:
			asString(value.status) ??
			(isRecord(value.state) ? asString(value.state.name) : undefined),
		assignee: isRecord(value.assignee)
			? {
					id:
						asString(value.assignee.displayName) ??
						asString(value.assignee.name) ??
						asString(value.assignee.id),
					name:
						asString(value.assignee.name) ??
						asString(value.assignee.displayName),
				}
			: (asString(value.assignee) ?? null),
		blockedBy: normalizeStringList(value.blockedBy),
		blocking: normalizeStringList(value.blocking),
	};
}

async function currentBranch(cwd: string): Promise<string> {
	return run("git", ["branch", "--show-current"], cwd);
}

function parseLinearWhoamiText(output: string): CurrentUser | undefined {
	const displayName = output.match(/^\s*Display name:\s*(.+)$/m)?.[1]?.trim();
	const email = output.match(/^\s*Email:\s*(.+)$/m)?.[1]?.trim();
	const user = output.match(/^User:\s*(.+)$/m)?.[1]?.trim();
	const id = displayName || email || user;
	return id ? { id, name: user || displayName || email } : undefined;
}

async function currentLinearUser(cwd: string): Promise<CurrentUser> {
	const textOutput = await run("linear", ["auth", "whoami"], cwd);
	const textUser = parseLinearWhoamiText(textOutput);
	if (textUser) return textUser;

	const parsed = parseJsonObject(textOutput);
	if (isRecord(parsed)) {
		const id =
			asString(parsed.id) ?? asString(parsed.email) ?? asString(parsed.name);
		if (id) return { id, name: asString(parsed.name) };
	}
	throw new Error("Could not determine current Linear user id.");
}

async function loadParentAndChildren(
	parentTicketId: string,
	cwd: string,
): Promise<{ parent: TicketSummary; children: TicketSummary[] }> {
	const output = await run(
		"linear",
		["api", ISSUE_TREE_QUERY, "--variable", `id=${parentTicketId}`],
		cwd,
	);
	const parsed = parseJsonObject(output);
	const issue =
		isRecord(parsed) && isRecord(parsed.data) ? parsed.data.issue : undefined;
	if (!isRecord(issue)) {
		throw new Error(`Could not load Linear parent ticket ${parentTicketId}.`);
	}
	const childrenRaw =
		isRecord(issue.children) && Array.isArray(issue.children.nodes)
			? issue.children.nodes
			: [];
	return {
		parent: parseTicket(issue, parentTicketId),
		children: childrenRaw.map((child) => parseTicket(child)),
	};
}

async function addLinearComment(
	issueId: string,
	body: string,
	cwd: string,
): Promise<void> {
	const dir = await fs.mkdtemp(join(tmpdir(), "ticket-master-comment-"));
	const file = join(dir, "comment.md");
	await fs.writeFile(file, body, "utf8");
	await run(
		"linear",
		["issue", "comment", "add", issueId, "--body-file", file],
		cwd,
	);
}

async function postTicketMasterLog(
	issueId: string,
	state: string,
	message: string,
	cwd: string,
): Promise<void> {
	await addLinearComment(
		issueId,
		`Ticket Master log\n\nState: ${state}\n\n${message}`,
		cwd,
	);
}

async function assignTicket(
	issueId: string,
	user: CurrentUser,
	cwd: string,
): Promise<void> {
	await run("linear", ["issue", "update", issueId, "--assignee", user.id], cwd);
}

async function moveTicketInProgress(
	issueId: string,
	cwd: string,
): Promise<void> {
	await run(
		"linear",
		["issue", "update", issueId, "--state", IN_PROGRESS_STATUS],
		cwd,
	);
}

export function buildForgeWorkerPrompt(input: WorkerPromptInput): string {
	let previous = "none";
	if (input.previous) {
		const prSuffix = input.previous.prUrl ? `, ${input.previous.prUrl}` : "";
		previous = `${input.previous.id} (${input.previous.branch}${prSuffix})`;
	}
	let cumulativeNote = "";
	if (input.position > 1) {
		cumulativeNote = `\nThis PR intentionally builds on ${input.branchBase} but targets ${input.prTarget}. Its diff is cumulative until earlier PRs are merged. Review order should follow the parent ticket chain.\n`;
	}
	return `/forge --local ${input.child.id} ${input.extraContext ?? ""}

Ticket Master worker contract:
- You are a sandboxed Pi worker for exactly one child ticket.
- Install or verify Pi package source before Forge: ${input.packageSource}
- Parent ticket: ${input.parent.id} — ${input.parent.title}
- Child ticket ${input.position} of ${input.total}: ${input.child.id} — ${input.child.title}
- Child description/acceptance criteria:\n${input.child.description ?? "<none>"}
- Previous child: ${previous}
- Branch base: ${input.branchBase}
- Child branch: ${input.childBranch}
- PR target: ${input.prTarget}
- Extra user context: ${input.extraContext || "<none>"}

Create your branch from ${input.branchBase}.
Open your PR against ${input.prTarget}.
Do not open your PR against ${input.branchBase} unless ${input.branchBase} is ${input.prTarget}.
The branch chain is stacked. The PR targets are flat.

Required setup:
git fetch origin
if git rev-parse --verify ${input.branchBase}; then git checkout ${input.branchBase}; else git checkout -b ${input.branchBase} origin/${input.branchBase}; fi
git pull --ff-only origin ${input.branchBase} || true
git checkout -b ${input.childBranch}

Use Forge/TDD for this child only. Create commits on ${input.childBranch}, push it, but do not create the PR. The orchestrator creates a draft PR.

At the end, print one line exactly like:
TICKET_MASTER_RESULT:{"branch":"${input.childBranch}","commit":"<head-sha>","validation":["<commands run>"],"risks":"<known risks or none>","summary":"<short summary>"}
${cumulativeNote}`;
}

function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'"'"'`)}'`;
}

async function createSandbox(cwd: string): Promise<string> {
	const output = await run("sbx", ["create", "--clone", "shell", "."], cwd);
	return output.split(/\s+/).find(Boolean) ?? "ticket-master-sandbox";
}

function parseWorkerResult(output: string): WorkerResult | undefined {
	const marker = output.match(/TICKET_MASTER_RESULT:(\{[^\n]+\})/);
	if (!marker) return undefined;
	const parsed = parseJsonObject(marker[1]);
	if (!isRecord(parsed)) return undefined;
	const branch = asString(parsed.branch);
	if (!branch) return undefined;
	return {
		branch,
		commit: asString(parsed.commit),
		validation: normalizeStringList(parsed.validation),
		risks: asString(parsed.risks),
		summary: asString(parsed.summary),
	};
}

async function runWorkerOnce(
	input: WorkerPromptInput,
	cwd: string,
): Promise<WorkerResult> {
	const sandbox = await createSandbox(cwd);
	const prompt = buildForgeWorkerPrompt(input);
	const script = [
		`pi install ${shellQuote(input.packageSource)}`,
		`pi -p ${shellQuote(prompt)}`,
	].join(" && ");
	const output = await run(
		"sbx",
		["exec", "-it", sandbox, "bash", "-lc", script],
		cwd,
	);
	const result = parseWorkerResult(output);
	if (!result)
		throw new Error(
			`Worker did not report ticket-master evidence. Output:\n${output}`,
		);
	if (result.branch !== input.childBranch) {
		throw new Error(
			`Worker reported branch ${result.branch}, expected ${input.childBranch}.`,
		);
	}
	return result;
}

async function runWorkerWithRetry(
	input: WorkerPromptInput,
	cwd: string,
): Promise<WorkerResult> {
	let firstError: unknown;
	try {
		return await runWorkerOnce(input, cwd);
	} catch (error) {
		firstError = error;
	}
	try {
		return await runWorkerOnce(input, cwd);
	} catch (secondError) {
		const firstMessage =
			firstError instanceof Error ? firstError.message : String(firstError);
		const secondMessage =
			secondError instanceof Error ? secondError.message : String(secondError);
		throw new Error(
			`Worker failed twice. First: ${firstMessage}\nSecond: ${secondMessage}`,
		);
	}
}

function prBody(input: WorkerPromptInput, result: WorkerResult): string {
	const cumulative =
		input.position > 1
			? `\n\nThis PR intentionally builds on ${input.branchBase} but targets ${input.prTarget}. Its diff is cumulative until earlier PRs are merged. Review order should follow the parent ticket chain.`
			: "";
	return `Ticket ID: ${input.child.id}

What changed and why:
${result.summary ?? `Implemented ${input.child.title}.`}

Tests added or updated / validation commands run:
${(result.validation ?? []).map((item) => `- ${item}`).join("\n") || "- Not reported"}

Known risks:
${result.risks ?? "Not reported"}

Branch base: ${input.branchBase}
PR target: ${input.prTarget}
Previous child PR: ${input.previous?.prUrl ?? "none"}
Head commit: ${result.commit ?? "not reported"}${cumulative}`;
}

async function createDraftPr(
	input: WorkerPromptInput,
	result: WorkerResult,
	cwd: string,
): Promise<string> {
	const dir = await fs.mkdtemp(join(tmpdir(), "ticket-master-pr-"));
	const bodyPath = join(dir, "body.md");
	await fs.writeFile(bodyPath, prBody(input, result), "utf8");
	const title = `${input.child.id}: ${input.child.title}`;
	return run(
		"gh",
		[
			"pr",
			"create",
			"--draft",
			"--base",
			input.prTarget,
			"--head",
			input.childBranch,
			"--title",
			title,
			"--body-file",
			bodyPath,
		],
		cwd,
	);
}

async function prepareRunnableChildren(
	queue: TicketSummary[],
	user: CurrentUser,
	cwd: string,
): Promise<TicketSummary[]> {
	const runnable: TicketSummary[] = [];
	for (const child of queue) {
		if (isAssignedToOther(child, user)) {
			await postTicketMasterLog(
				child.id,
				"skipped-assignee-conflict",
				`Skipped because this Todo child is already assigned to ${typeof child.assignee === "string" ? child.assignee : (child.assignee?.name ?? child.assignee?.id ?? "another user")}.`,
				cwd,
			);
			continue;
		}
		await assignTicket(child.id, user, cwd);
		await postTicketMasterLog(
			child.id,
			"assigned",
			`Assigned to ${user.name ?? user.id}; waiting for launch turn in the sequential queue.`,
			cwd,
		);
		runnable.push(child);
	}
	return runnable;
}

function renderStatus(status: CommandStatus | undefined): string {
	if (!status) return "ticket-master idle";
	return `/ticket-master ${status.phase} (${status.progress}) ${status.target}`;
}

async function runTicketMaster(
	parsed: ParsedTicketMasterArgs,
	ctx: ExtensionCommandContext,
	onStatus: (status: CommandStatus) => void,
): Promise<void> {
	if (!parsed.parentTicketId)
		throw new Error(
			"Usage: /ticket-master <parent-ticket-id> --base <core-branch> --package <pi-package-source> [extra context]",
		);
	if (!parsed.packageSource)
		throw new Error("Missing required --package <pi-package-source>.");
	const baseBranch = parsed.baseBranch || (await currentBranch(ctx.cwd));
	ctx.ui.notify(
		`/ticket-master loading ${parsed.parentTicketId} from Linear`,
		"info",
	);
	const [user, issueTree] = await Promise.all([
		currentLinearUser(ctx.cwd),
		loadParentAndChildren(parsed.parentTicketId, ctx.cwd),
	]);
	const { parent, children } = issueTree;
	await postTicketMasterLog(
		parent.id,
		"loaded",
		`Loaded parent ticket and ${children.length} direct child ticket(s). Base branch: ${baseBranch}. Package source: ${parsed.packageSource}.`,
		ctx.cwd,
	);
	const queue = sortChildrenForQueue(children);
	if (queue.length === 0) {
		onStatus({
			phase: "idle",
			target: parsed.parentTicketId,
			progress: "no Todo children",
		});
		ctx.ui.notify("/ticket-master found no Todo child tickets", "info");
		await postTicketMasterLog(
			parent.id,
			"complete",
			"No Todo child tickets were found; no sandbox workers launched.",
			ctx.cwd,
		);
		return;
	}

	await postTicketMasterLog(
		parent.id,
		"queue-ready",
		`Queued Todo children in order: ${queue.map((child) => child.id).join(", ")}.`,
		ctx.cwd,
	);
	const runnable = await prepareRunnableChildren(queue, user, ctx.cwd);

	let previous: { id: string; branch: string; prUrl?: string } | undefined;
	let branchBase = baseBranch;
	for (let index = 0; index < runnable.length; index += 1) {
		const child = runnable[index];
		const childBranch = buildChildBranchName(child.id, child.title);
		onStatus({
			phase: "working",
			target: child.id,
			progress: `worker ${index + 1}/${runnable.length}`,
		});
		ctx.ui.notify(
			`/ticket-master launching ${child.id} (${index + 1}/${runnable.length})`,
			"info",
		);
		await moveTicketInProgress(child.id, ctx.cwd);
		await postTicketMasterLog(
			child.id,
			"worker-launching",
			`Launching sandbox worker ${index + 1}/${runnable.length}. Branch base: ${branchBase}. Child branch: ${childBranch}. PR target: ${baseBranch}.`,
			ctx.cwd,
		);
		const input: WorkerPromptInput = {
			parent,
			child,
			position: index + 1,
			total: runnable.length,
			branchBase,
			childBranch,
			prTarget: baseBranch,
			packageSource: parsed.packageSource,
			extraContext: parsed.extraContext,
			previous,
		};
		let result: WorkerResult;
		try {
			result = await runWorkerWithRetry(input, ctx.cwd);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await postTicketMasterLog(
				child.id,
				"blocked-worker-failed-twice",
				`Stopped after two failed sandbox worker attempts.\n\n${message}`,
				ctx.cwd,
			);
			onStatus({
				phase: "blocked",
				target: child.id,
				progress: "worker failed twice",
			});
			return;
		}
		await postTicketMasterLog(
			child.id,
			"worker-complete",
			`Worker reported branch ${result.branch} at commit ${result.commit ?? "<not reported>"}. Creating draft PR next.`,
			ctx.cwd,
		);
		const prUrl = await createDraftPr(input, result, ctx.cwd);
		await postTicketMasterLog(
			child.id,
			"draft-pr-created",
			`Created draft PR: ${prUrl || childBranch}`,
			ctx.cwd,
		);
		previous = { id: child.id, branch: childBranch, prUrl };
		branchBase = childBranch;
	}
	onStatus({
		phase: "idle",
		target: parsed.parentTicketId,
		progress: "complete",
	});
	await postTicketMasterLog(
		parent.id,
		"complete",
		`Completed Ticket Master queue for ${parsed.parentTicketId}. Final branch base for future work: ${branchBase}.`,
		ctx.cwd,
	);
	ctx.ui.notify(`/ticket-master complete for ${parsed.parentTicketId}`, "info");
}

export default function (pi: ExtensionAPI) {
	let currentStatus: CommandStatus | undefined;
	function publishStatus(ctx: Pick<ExtensionCommandContext, "ui">): void {
		ctx.ui.setStatus("ticket-master", renderStatus(currentStatus));
	}
	pi.on("session_start", (_event, ctx) => publishStatus(ctx));

	const command = {
		description:
			"Run Todo child tickets through sandboxed local Forge workers and create stacked draft PRs.",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const parsed = parseTicketMasterArgs(args);
			const target = parsed.parentTicketId || "<missing parent>";
			currentStatus = { phase: "working", target, progress: "loading Linear" };
			publishStatus(ctx);
			try {
				await runTicketMaster(parsed, ctx, (status) => {
					currentStatus = status;
					publishStatus(ctx);
				});
			} catch (error) {
				currentStatus = { phase: "blocked", target, progress: "error" };
				publishStatus(ctx);
				ctx.ui.notify(
					error instanceof Error ? error.message : String(error),
					"error",
				);
			}
		},
	};

	pi.registerCommand("ticket-master", command);
	pi.registerCommand("tm", command);
}
