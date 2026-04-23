import { z } from "zod";

/** Runtime context controlling user confirmation prompts. */
export const ManagerRuntimeContext = z.object({
  /** Disable confirmation prompts (script/automation mode). */
  script: z.boolean().optional()
})
