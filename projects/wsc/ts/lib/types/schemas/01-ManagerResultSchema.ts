import { z } from "zod";

/** ✅ Generic operation result object */
export const ManagerResult = z.object({
  success: z.boolean(),
  message: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.any())
  ])
});