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
    parentDigest: {
        summary: string;
        testName?: string | null;
        failureExcerpt?: string | null;
        broaderChecks?: Array<{
            command: string;
            status: "pass" | "fail";
        }>;
    };
    focusedCommand: {
        command: string;
        exitCode: number | null;
        outcome: "pass" | "fail" | "not_run" | "error";
        excerpt: string;
    };
    changedFiles: string[];
    scopeOk: boolean;
    commitCountDelta: number;
    patch: string;
};
export declare function runForgePhaseInSandbox(request: ForgeProcessorRequest): Promise<ForgeProcessorResult>;
