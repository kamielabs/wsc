import { LogCallOverrides, LogOptions } from "@schemas";
import { z } from "zod";

/** Types */
export type LogOptionsType = z.infer<typeof LogOptions>;
export type LogCallOverridesType = z.infer<typeof LogCallOverrides>;