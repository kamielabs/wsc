import { z } from "zod";
export const LogLevel = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);
