import { z } from "zod";
import { LogLevel } from "@schemas";

/**
 * Configuration options for a LogManager instance.
 * The `path` field now represents the **full absolute log file path**.
 */
export const LogOptions = z.object({
  /** Full absolute path to the log file (e.g., "/home/user/.logs/pmgr/pmgr.log") */
  path: z.string().optional(),
  /** Minimum log level to record (default: "info") */
  level: LogLevel.optional(),
  /** Root logical scope (e.g., "main", "core/runtime") */
  rootScope: z.string().optional(),
  /** Display timestamp for each line */
  showTS: z.boolean().optional(),
  /** Timestamp format string (default "YYYY-MM-DD HH:mm:ssZ") */
  formatTS: z.string().optional(),
  /** Display log level */
  showLvl: z.boolean().optional(),
  /** Enable colored output using chalk */
  showColors: z.boolean().optional(),
});

export const LogCallOverrides = LogOptions.partial().extend({
    scope: z.string().optional()
});