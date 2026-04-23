// ts/lib/core/ExecManager.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { EnvModeEnum, ExecContextType, ScriptModeEnum } from "@interfaces";
import { ExecContext } from "@schemas";
import { WSCENV_FILE, WS_DIR } from "@constants";
import { detectCliRoot, detectWsRoot } from "@tools";

/* -----------------------------------------------------------
   EXEC MANAGER V4
   - scriptMode : dev | build | release
   - envMode    : dev | prod
----------------------------------------------------------- */

export class ExecManager {
  private static instance: ExecManager;

  public readonly context: ExecContextType;

  constructor() {

    /* -------------------------------------------------------
       1) Déterminer scriptMode
    ------------------------------------------------------- */
    const rawScriptMode = process.env.WSC_SCRIPT_MODE;

    let scriptMode: ScriptModeEnum;
    if (rawScriptMode === "build") scriptMode = "build";
    else if (rawScriptMode === "release") scriptMode = "release";
    else scriptMode = "dev"; // défaut → dev


    /* -------------------------------------------------------
       2) Déterminer envMode (dev | prod)
    ------------------------------------------------------- */

    // override complet pour mode dev (prod binaire → dev via env)
    const overrideDevMode =
      process.env.NODE_ENV === "dev" &&
      process.env.NODE_DEV_SANDBOX_PATH &&
      process.env.NODE_DEV_CWD;

    let envMode: EnvModeEnum;
    if (overrideDevMode) envMode = "dev";
    else if (scriptMode === "dev") envMode = "dev";
    else if (scriptMode === "build") envMode = "dev"; // build = JS + env dev
    else envMode = "prod"; // release sans override → prod


    /* -------------------------------------------------------
       3) Récupération du root CLI & du workspace physique
    ------------------------------------------------------- */
    const cliRoot = detectCliRoot();
    const physicalWsRoot = detectWsRoot();


    /* -------------------------------------------------------
       4) Lecture du fichier .wsc (UNIQUEMENT si envMode=dev)
          ⚠️ release / prod → jamais lu
    ------------------------------------------------------- */
    const wscFile = path.join(physicalWsRoot, WSCENV_FILE);
    const wscVars =
      envMode === "dev" && fs.existsSync(wscFile)
        ? dotenv.parse(fs.readFileSync(wscFile))
        : {};


    /* -------------------------------------------------------
       5) Résolution des paths exécutés
    ------------------------------------------------------- */
    const execCwd = process.cwd();
    let execWsRoot = physicalWsRoot;
    let cwd = execCwd;
    let runtimeExe = scriptMode === "dev" ? "tsx" : "node";

    if (envMode === "dev") {
      // Mode DEV → sandbox obligatoire
      const sb = process.env.NODE_DEV_SANDBOX_PATH || wscVars["NODE_DEV_SANDBOX_PATH"];
      const devCwd = process.env.NODE_DEV_CWD || wscVars["NODE_DEV_CWD"];

      if (!sb || !devCwd) {
        throw new Error(
`❌ Mode DEV requis mais variables manquantes :
  NODE_DEV_SANDBOX_PATH=${sb}
  NODE_DEV_CWD=${devCwd}

Tu dois fournir :
  NODE_ENV=dev
  NODE_DEV_SANDBOX_PATH=<path>
  NODE_DEV_CWD=<cwd> wsc <cmd>`
        );
      }

      execWsRoot = sb;
      cwd = devCwd;
    }

    /* -------------------------------------------------------
       6) Validation finale par Zod
    ------------------------------------------------------- */
    this.context = ExecContext.parse({
      scriptMode,
      envMode,
      runtimeExe,
      cliRoot,
      physicalWsRoot,
      execWsRoot,
      execCwd,
      cwd,
      wscFile,
      wscVars,
    });
  }

  /* ---------------------------
     .ws directory helpers
  --------------------------- */

  getWsPath(): string {
    return path.join(this.context.execWsRoot, WS_DIR);
  }

  resolveWsFile(...parts: string[]): string {
    return path.join(this.getWsPath(), ...parts);
  }

  /* ---------------------------
     Singleton
  --------------------------- */

  public static getInstance(): ExecManager {
    if (!ExecManager.instance) {
      ExecManager.instance = new ExecManager();
    }
    return ExecManager.instance;
  }
}
