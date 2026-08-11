import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { type Need, type Tier } from "smart-model-run";
import { type ForgeSettings, type ForgeSettingsWarning } from "./forge-config.js";
import { type ForgeProcessorResult } from "./forge-processor.js";
declare const FORGE_AGENT_NAMES: readonly ["forge-intake", "forge-decompose", "forge-red", "forge-verify-red", "forge-green", "forge-refactor", "forge-final-verify"];
type ForgeAgentName = (typeof FORGE_AGENT_NAMES)[number];
type ParsedForgeArgs = {
    selector: string;
    raw: string;
    userContext: string;
    localOnly: boolean;
};
type ForgePromptMode = "standard" | "rolling";
type ForgeGitSnapshot = {
    workingTree: string;
    branch: string | null;
    headSha: string | null;
    upstream: string | null;
};
export type ForgeEvidenceRecord = {
    source: string;
    status: TicketLookup["status"];
    detail: string;
    trust: "untrusted";
};
export type ForgePhaseProfile = {
    phase: string;
    agent: ForgeAgentName;
    budget: Tier;
    ceiling: Tier;
    thinking: "off" | "low" | "medium" | "high";
    needs: Need[];
    tools: string[];
    requiresExplicitApproval: boolean;
};
export type ForgeRunRequest = {
    target: string;
    selector: string;
    userContext: string;
    localOnly: boolean;
    git: ForgeGitSnapshot;
    gitContext: string;
    lookups: ForgeEvidenceRecord[];
    settings: ForgeSettings;
    settingsWarnings: ForgeSettingsWarning[];
    agentAvailability: ForgeAgentAvailability;
    phaseProfiles: ForgePhaseProfile[];
    mode: ForgePromptMode;
};
export type ForgeCommandResult = {
    command: string;
    exitCode: number | null;
    outcome: "pass" | "fail" | "not_run" | "error";
    excerpt: string;
};
export type ForgePhaseResult = {
    phase: "red" | "verifyRed" | "green";
    status: "succeeded" | "retryable" | "blocked" | "contract_violation" | "infra_failed";
    parentDigest: {
        summary: string;
        testName?: string | null;
        failureExcerpt?: string | null;
        broaderChecks?: Array<{
            command: string;
            status: "pass" | "fail";
        }>;
    };
    focusedCommand: ForgeCommandResult;
    changedFiles: string[];
    scopeOk: boolean;
    commitCountDelta: number;
    red?: {
        testName: string | null;
        observedFailureExcerpt: string | null;
        verifiedSingleFailure: boolean;
        alreadyGreen: boolean;
    };
    green?: {
        noTestEdits: boolean;
        behaviorSatisfied: boolean;
        broaderCommands?: ForgeCommandResult[];
    };
};
export type ForgeRunOutcome = {
    request: ForgeRunRequest;
    red: ForgePhaseResult;
    verifyRed: ForgePhaseResult;
    green: ForgePhaseResult;
    appliedPatchPath?: string;
};
type TicketLookup = {
    source: string;
    status: "found" | "missing" | "error" | "skipped";
    detail: string;
};
export declare function runForgeCommand(command: string, args: string[], cwd: string, options?: {
    timeoutMs?: number;
    retries?: number;
}): Promise<string>;
type ForgeSettingsLoadResult = {
    settings: ForgeSettings;
    warnings: ForgeSettingsWarning[];
};
export declare function loadForgeSettingsWithWarnings(cwd: string, options?: {
    projectTrusted?: boolean;
}): ForgeSettingsLoadResult;
export declare function loadForgeSettings(cwd: string, options?: {
    projectTrusted?: boolean;
}): ForgeSettings;
type ForgeAgentAvailability = {
    found: ForgeAgentName[];
    overridden: ForgeAgentName[];
    bundled: ForgeAgentName[];
    missing: ForgeAgentName[];
    overrideLocations: string[];
    bundledLocation: string;
    copiedToProject: boolean;
};
export declare function buildForgeRunRequest(parsed: ParsedForgeArgs, gitContext: string, lookups: TicketLookup[], settings: ForgeSettings, agentAvailability: ForgeAgentAvailability, settingsWarnings?: ForgeSettingsWarning[], mode?: ForgePromptMode): ForgeRunRequest;
export declare function runForgeOrchestration(request: ForgeRunRequest, cwd?: string): Promise<{
    red: ForgeProcessorResult;
    verifyRed: ForgeProcessorResult;
    green: ForgeProcessorResult;
}>;
export default function (pi: ExtensionAPI): void;
export {};
