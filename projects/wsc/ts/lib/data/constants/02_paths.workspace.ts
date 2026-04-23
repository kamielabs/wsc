// ts/lib/constants/paths.workspace.ts
import path from "path";
import { ExecContextType } from "@interfaces";
import { WS_DIR } from "@constants";

/** 📁 Racine du .ws */
export const getConfigPath = (exec: ExecContextType): string =>
  path.join(exec.execWsRoot, WS_DIR);

/** 📁 Dossier templates du workspace */
export const getTemplatesPath = (exec: ExecContextType): string =>
  path.join(getConfigPath(exec), "templates");

/** 📁 Dossier logs du workspace */
export const getLogsPath = (exec: ExecContextType): string =>
  path.join(getConfigPath(exec), "logs");

/** 📁 Dossier tmp du workspace */
export const getTmpPath = (exec: ExecContextType): string =>
  path.join(getConfigPath(exec), "tmp");
