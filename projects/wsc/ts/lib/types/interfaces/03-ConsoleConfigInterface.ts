import { ConsoleConfig } from "@schemas";
import { z } from "zod";


export type ConsoleConfigType = z.infer<typeof ConsoleConfig>;