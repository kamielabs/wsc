import { z } from "zod";
import { DisplayMode } from "@schemas";

export type DisplayModeType = z.infer<typeof DisplayMode>;