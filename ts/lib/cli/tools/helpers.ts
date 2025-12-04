import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PATHS } from "@generated/paths";
import { PNPM_WORKSPACE_YAML, PACKAGE_JSON_FILE, ENV_FILE } from "@constants";
import crypto from "crypto";


/** ⚙️ Détection automatique du dossier racine du projet */
// ts/lib/utils/detectRoot.ts
export function detectCliRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  let current = path.dirname(__filename);

  while (true) {
    if (fs.existsSync(path.join(current, PACKAGE_JSON_FILE))) {
      return current; // ← racine du projet CLI
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return process.cwd();
}


/* -------------------------------------------------------
 * 🧭 Workspace root (pnpm-workspace.yaml)
 * ----------------------------------------------------- */
// ts/lib/utils/detectWsRoot.ts
export function detectWsRoot(): string {
  let current = process.cwd();

  while (true) {
    const wsFile = path.join(current, PNPM_WORKSPACE_YAML);
    if (fs.existsSync(wsFile)) return current;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("❌ Impossible de trouver pnpm-workspace.yaml (workspace root introuvable)");
}


/**
 * ⚙️ Charge et parse le fichier .env du projet
 * - format classique KEY=VALUE
 * - ignore les commentaires (#)
 * - renvoie un dictionnaire { [key]: value }
 */
export function readEnv(envFile = ENV_FILE): Record<string, string> {
  const root = detectCliRoot();
  const envPath = path.join(root, envFile);

  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️ Aucun fichier ${envFile} trouvé dans ${root}`);
    return {};
  }

  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  const env: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue; // ignore vides et commentaires
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
    const value = rest.join("=").trim().replace(/^['"]|['"]$/g, ""); // retire guillemets éventuels
    env[key.trim()] = value;
    process.env[key.trim()] = value; // injecte aussi dans process.env
  }

  //console.log(`✅ Fichier ${envFile} chargé (${Object.keys(env).length} variables).`);
  return env;
}


function isNonEmptyArray<T>(value: T[] | undefined): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}


/**
 * 🚀 Résout un alias défini dans PATHS vers un chemin absolu
 * Ex : resolveAlias("@conf/config.json")
 */
export function resolveAlias(aliasPath: string): string {
  const baseUrl = detectCliRoot();
  const paths = PATHS;

  if (path.isAbsolute(aliasPath)) return aliasPath;

  const aliasKey = Object.keys(paths).find(k =>
    aliasPath.startsWith(k.replace("/*", ""))
  );

  if (!aliasKey) {
    return path.resolve(baseUrl, aliasPath);
  }

  const patterns = paths[aliasKey];
  if (!isNonEmptyArray(patterns)) {
    // Cas théoriquement impossible mais TS veut un filet de sécurité
    return path.resolve(baseUrl, aliasPath);
  }

  const targetPattern = patterns[0]; // <- maintenant 100% safe

  const aliasRoot = aliasKey.replace("/*", "");
  const rest = aliasPath.replace(aliasRoot, "").replace(/^\/+/, "");

  const cleanedTarget = targetPattern.replace(/\*$/, "").replace(/\/+$/, "");
  const cleanedRest = rest.replace(/^\/+/, "");
  const realPath = path.join(cleanedTarget, cleanedRest);

  return path.resolve(baseUrl, realPath);
}

export function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}