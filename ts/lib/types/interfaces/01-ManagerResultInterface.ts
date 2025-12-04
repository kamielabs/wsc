import { z } from "zod";
import { ManagerResult } from "@schemas";

/** TypeScript inference */
export type ManagerResultType = z.infer<typeof ManagerResult>;