import { z } from "zod";

export const ServicesConfigSetOptions = z.object({
    append: z.boolean().optional(),
    remove: z.boolean().optional(),
    deep: z.boolean().optional()
})