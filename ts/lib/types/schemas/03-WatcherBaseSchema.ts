// ts/lib/specs/WatcherBaseSchema.ts
import { z } from "zod";
/**
 * 🔹 Validation des options de base d’un watcher
 * (Zod ne valide PAS onEvent ou children – c’est le domaine de TS)
 */
export const WatcherBaseSchema = z.object({
  paths: z.array(z.string()).nonempty("paths ne peut pas être vide"),
  when: z.enum(["all", "add", "change", "addDir", "unlink", "unlinkDir"]).default("all").optional(),
  filters: z.array(z.string()).optional(),
  ignore: z.array(z.string()).optional(),
  depth: z.number().int().positive().optional(),
  debounce: z.number().int().positive().optional(),
  restartMsg: z.string().optional()
});
