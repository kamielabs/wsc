import { z } from "zod";
import { EnvMode, ScriptMode, ExecContext } from "@schemas";

export type EnvModeEnum = z.infer<typeof EnvMode>;
export type ScriptModeEnum = z.infer<typeof ScriptMode>;
export type ExecContextType = z.infer<typeof ExecContext>;