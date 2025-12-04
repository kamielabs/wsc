import { z } from "zod";
import { LogLevel } from "@schemas";
export type LogLevelType = z.infer<typeof LogLevel>;