import path from "path";
import os from "os";
import fs from "fs";
import { ExecContextType, OptionInterface } from "@interfaces";

/**
 * @module cli-utils
 * @version 1.3
 * @description
 *  Utility helpers for the pmgr CLI core runtime.
 *  Provides safe path resolution, configuration loading,
 *  and generic JSON/object manipulation helpers.
 *
 * @author Kame
 * @created 2025-10-26
 * @modified 2025-11-08
 */

/* -------------------------------------------------------
 * 🧩 Log Level Resolver
 * ----------------------------------------------------- */

/**
 * Resolves the active log level from CLI options.
 * Ensures that only one log flag is provided.
 *
 * @param opts          CLI options object
 * @param defaultLevel  Default log level if no flag is set
 * @returns             The resolved log level
 *
 * @example
 * ```ts
 * const level = resolveLogLevel(cliOpts, "info");
 * ```
 */
export function resolveLogLevel(opts: Record<string, any>, defaultLevel: string): string {
  const levels = ["info", "debug", "warn", "error"] as const;
  const active = levels.filter((lvl) => opts[lvl]);
  if (active.length > 1) {
    console.error("❌ Conflicting log level options. Use only one of --info, --debug, --warn, or --error.");
    process.exit(1);
  }
  return active[0] || defaultLevel;
}

export function resolveLogPath(
  inputPath: string | undefined,
  exec: ExecContextType,
  createDir: boolean = true
): string {
  const wsRoot = exec.execWsRoot;

  let p = inputPath?.trim();

  // 1️⃣ fallback si vide
  if (!p) {
    p = ".ws/logs/wsc.log";
  }

  // 2️⃣ Expansion du "~"
  if (p.startsWith("~")) {
    p = p.replace(/^~($|\/|\\)/, `${os.homedir()}$1`);
    // peut être absolu ou relatif selon l'utilisateur
  }

  // 3️⃣ Path absolu → on respecte
  if (path.isAbsolute(p)) {
    if (createDir) ensureParentDir(p);
    return p;
  }

  // 4️⃣ Path relatif → basé sur .ws/
  const resolved = path.join(wsRoot, ".ws", p);
  if (createDir) ensureParentDir(resolved);
  return resolved;
}

function ensureParentDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* -------------------------------------------------------
 * ⚙️ JSON Config Reader
 * ----------------------------------------------------- */

/**
 * Reads and parses a JSON configuration file safely.
 * Returns the provided default object if the file does not exist
 * or cannot be parsed.
 *
 * @param filePath     Full path to the JSON config file
 * @param defaultData  Object to return if read or parse fails
 * @returns            Parsed configuration object
 *
 * @example
 * ```ts
 * const cfg = readJsonConfigFile(GLOBAL_CONFIG_FILE, defaultConfig);
 * ```
 */
export function readJsonConfigFile(filePath: string, defaultData: any = {}): any {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return defaultData;
  }
}

/* -------------------------------------------------------
 * 🧹 Metadata Cleaner
 * ----------------------------------------------------- */

/**
 * Recursively removes all object keys that start with a given prefix.
 *
 * Typical usage: remove private or meta fields (e.g., "_meta", "_comment")
 * before exposing JSON data to the user.
 *
 * @param obj   Input object or array
 * @param mark  Key prefix to remove (default: "_")
 * @returns     A deep-cloned, cleaned structure
 *
 * @example
 * ```ts
 * const clean = removeMetaKeys(data, "_");
 * ```
 */
export function removeMetaKeys(obj: any, mark: string = "_"): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeMetaKeys(item, mark));
  }

  if (obj !== null && typeof obj === "object") {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!key.startsWith(mark)) {
        clean[key] = removeMetaKeys(value, mark);
      }
    }
    return clean;
  }

  return obj; // primitives
}

/**
 * Extracts only meta fields (keys starting with a given prefix).
 */
export function extractMetaKeys(obj: any, mark: string = "_"): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => extractMetaKeys(item, mark));
  }

  if (obj !== null && typeof obj === "object") {
    const meta: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith(mark)) {
        meta[key] = value;
      }
    }
    return meta;
  }

  return null;
}


export function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}


function toCamelCase(name: string): string {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function parseOptionFlags(flags: string, description: string): OptionInterface {
    const parts = flags.split(",").map(f => f.trim());

    const shortRaw = parts.find(f => f.startsWith("-") && !f.startsWith("--"));
    let longRaw = parts.find(f => f.startsWith("--"));

    const expectsValue = /<[^>]+>/.test(flags);
    const valueOptional = /\[[^\]]+\]/.test(flags);

    let negated = false;
    let longName: string | undefined;

    if (longRaw) {
        longName = longRaw.replace(/^--/, "");
        if (longName.startsWith("no-")) {
            negated = true;
            longName = longName.slice(3); // "no-logfile" -> "logfile"
        }
    }

    const short = shortRaw?.replace(/^-/, "");
    const base = longName || short || "";
    const key = toCamelCase(base);
    
    const parsed = {
        name: key,
        short,
        long: longName,
        description,
        expectsValue,
        valueOptional,
        negated
    } as OptionInterface;

    return parsed;
}

export function parseOptionToken(token: string): {
    type: "short" | "long";
    names: string[]; // e.g. ['q','v'] for -qv
} {
    if (token.startsWith("--")) {
        return {
            type: "long",
            names: [ token.slice(2) ] // ex: "quiet"
        };
    }

    if (token.startsWith("-")) {
        return {
            type: "short",
            names: token.slice(1).split("") // "-qv" => ['q','v']
        };
    }

    throw new Error(`Invalid option token '${token}'`);
}

export function tokenize(argv: string[]): string[] {
    return argv.slice(2); // remove node + script
}


// export function tokenize(argv: string[]): string[] {
//     const tokens: string[] = [];

//     for (const arg of argv) {
//         if (arg.startsWith("--")) {
//             tokens.push(arg);
//         }
//         else if (arg.startsWith("-") && arg.length > 2) {
//             // court groupé : "-lop"
//             const chars = arg.slice(1).split("");
//             for (const c of chars) tokens.push("-" + c);
//         }
//         else {
//             tokens.push(arg);
//         }
//     }

//     return tokens;
// }
