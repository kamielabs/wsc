import { LoggingConfig } from "@schemas";
import { z } from "zod";


export type LoggingConfigType = z.infer<typeof LoggingConfig>;