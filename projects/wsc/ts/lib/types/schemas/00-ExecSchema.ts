import { z } from "zod";


export const ScriptMode = z.enum(["dev", "build", "release"]);

export const EnvMode = z.enum(["dev",  "prod"]);

export const ExecContext = z.object({
    scriptMode: ScriptMode,
    envMode: EnvMode,

    runtimeExe: z.string(),
    cliRoot: z.string(), // racine du projet CLI (detectCliRoot)
    physicalWsRoot: z.string(), // workspace réel (detectWsRoot)
    execWsRoot: z.string(), // workspace utilisé (sandbox ou réel)
    execCwd: z.string(), // cwd réel important pour les daemons
    cwd: z.string(), // cwd simulé ou réel

    wscFile: z.string(), // chemin complet vers .wsc
    wscVars: z.record(z.string(), z.string().optional()) // var record key,value
});