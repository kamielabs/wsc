import { z } from "zod";
import { LogLevel } from "./01-LogLevelSchema";

export const LoggingConfig = z.object({
    enabled: z.boolean(),
    level: LogLevel,
    path: z.string()
})