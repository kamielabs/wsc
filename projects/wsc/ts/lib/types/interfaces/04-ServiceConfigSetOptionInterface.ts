import { ServicesConfigSetOptions } from "@schemas";
import { z } from "zod";

export type ServiceConfigSetOptionType = z.infer<typeof ServicesConfigSetOptions>;