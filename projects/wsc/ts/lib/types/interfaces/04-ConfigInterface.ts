import { Config } from "@schemas";
import { z } from "zod";


export type ConfigType = z.infer<typeof Config>;