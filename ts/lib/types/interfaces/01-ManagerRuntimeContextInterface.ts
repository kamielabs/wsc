import { z } from "zod";
import { ManagerRuntimeContext } from "@schemas";

export type ManagerRuntimeContextType = z.infer<typeof ManagerRuntimeContext>;