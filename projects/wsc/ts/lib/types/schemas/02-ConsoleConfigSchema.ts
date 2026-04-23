import { z } from "zod";
import { DisplayMode } from "./01-DisplayModeSchema";

export const ConsoleConfig = z.object({
    quiet: z.boolean(),
    mode: DisplayMode
});