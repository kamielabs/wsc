import { z } from "zod";
import { ConsoleConfig } from "./02-ConsoleConfigSchema";
import { LoggingConfig } from "./02-LoggingConfigSchema";

export const Config = z.object({
    console: ConsoleConfig,
    logging: LoggingConfig
});