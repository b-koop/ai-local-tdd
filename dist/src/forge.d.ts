import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { type ForgeSettings, type ForgeSettingsWarning } from "./forge-config.js";
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
export default function (pi: ExtensionAPI): void;
export {};
