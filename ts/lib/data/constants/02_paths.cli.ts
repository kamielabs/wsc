// ts/lib/constants/paths.cli.ts
import path from "path";
import { detectCliRoot } from "@tools";

export const CLI_ROOT_PATH = detectCliRoot();

/** Chemin depuis la racine DU PROJET CLI (sources de wsc) */
export const fromCliRoot = (...segments: string[]): string =>
  path.resolve(CLI_ROOT_PATH, ...segments);

