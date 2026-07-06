import { z } from "zod";
export declare const DEFAULT_COMMAND_TIMEOUT_MS = 30000;
export declare const FORGE_AI_STEPS: readonly ["intake", "decompose", "red", "verifyRed", "green", "refactor", "finalVerify"];
export type ForgeAiStep = (typeof FORGE_AI_STEPS)[number];
export declare const DEFAULT_FORGE_SKILLS: Record<ForgeAiStep, string[]>;
export declare const DEFAULT_TEST_COMMANDS: string[];
export declare const forgeSettingsSchema: z.ZodObject<{
    retries: z.ZodDefault<z.ZodNumber>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
    testCommands: z.ZodDefault<z.ZodArray<z.ZodString>>;
    skills: z.ZodDefault<z.ZodRecord<z.ZodEnum<{
        intake: "intake";
        decompose: "decompose";
        red: "red";
        verifyRed: "verifyRed";
        green: "green";
        refactor: "refactor";
        finalVerify: "finalVerify";
    }>, z.ZodArray<z.ZodString>>>;
    agentInstallTarget: z.ZodDefault<z.ZodEnum<{
        project: "project";
        global: "global";
    }>>;
}, z.core.$strip>;
export declare const forgeSettingsFileSchema: z.ZodObject<{
    forge: z.ZodObject<{
        retries: z.ZodDefault<z.ZodNumber>;
        timeoutMs: z.ZodDefault<z.ZodNumber>;
        testCommands: z.ZodDefault<z.ZodArray<z.ZodString>>;
        skills: z.ZodDefault<z.ZodRecord<z.ZodEnum<{
            intake: "intake";
            decompose: "decompose";
            red: "red";
            verifyRed: "verifyRed";
            green: "green";
            refactor: "refactor";
            finalVerify: "finalVerify";
        }>, z.ZodArray<z.ZodString>>>;
        agentInstallTarget: z.ZodDefault<z.ZodEnum<{
            project: "project";
            global: "global";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const rawForgeSettingsSchema: z.ZodObject<{
    retries: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>>;
    timeoutMs: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>>;
    timeout: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>>;
    testCommands: z.ZodPreprocess<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    testCommand: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
    skills: z.ZodPreprocess<z.ZodOptional<z.ZodRecord<z.ZodEnum<{
        intake: "intake";
        decompose: "decompose";
        red: "red";
        verifyRed: "verifyRed";
        green: "green";
        refactor: "refactor";
        finalVerify: "finalVerify";
    }> & z.core.$partial, z.ZodArray<z.ZodString>>>>;
    agentInstallTarget: z.ZodPreprocess<z.ZodOptional<z.ZodEnum<{
        project: "project";
        global: "global";
    }>>>;
}, z.core.$loose>;
export type ForgeSettings = z.infer<typeof forgeSettingsSchema>;
export type RawForgeSettings = z.infer<typeof rawForgeSettingsSchema>;
export type ForgeSettingsWarning = {
    source: string;
    path: string;
    key: string;
    problem: string;
    outcome: string;
    fix: string;
};
export type RawForgeSettingsParseResult = {
    settings: RawForgeSettings | undefined;
    warnings: ForgeSettingsWarning[];
};
export declare const DEFAULT_FORGE_SETTINGS: ForgeSettings;
export declare function parseRawForgeSettingsWithWarnings(value: unknown, source?: string): RawForgeSettingsParseResult;
export declare function parseRawForgeSettings(value: unknown): RawForgeSettings | undefined;
export declare function mergeForgeSettingsWithWarnings(base: ForgeSettings, override: unknown, source?: string): {
    settings: ForgeSettings;
    warnings: ForgeSettingsWarning[];
};
export declare function mergeForgeSettings(base: ForgeSettings, override: unknown): ForgeSettings;
export declare function generateForgeSettingsSample(): ForgeSettings;
export declare function generateForgeSettingsFileSample(): z.infer<typeof forgeSettingsFileSchema>;
