import { z } from "zod";
import { RuntimeOptions } from "@schemas";

export type RuntimeOptionsType = z.infer<typeof RuntimeOptions>;

