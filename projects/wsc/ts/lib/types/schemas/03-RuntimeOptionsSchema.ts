import { z } from "zod";
import { LogLevel } from "./01-LogLevelSchema";
import { DisplayMode } from "./01-DisplayModeSchema";
import { ExecContext } from "./00-ExecSchema";

export const RuntimeOptions = z.object({
    logEnabled: z.boolean(),
    logLevel: LogLevel,
    logPath: z.string(),
    displayMode: DisplayMode,
    quiet: z.boolean(),
    script: z.boolean(),
    execContext: ExecContext
});