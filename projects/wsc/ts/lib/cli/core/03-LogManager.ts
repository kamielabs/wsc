
import fs from "fs";
import path from "path";
import os from "os";
import chalk, { type ChalkInstance } from "chalk";
import { LogCallOverrides, LogOptions } from "@schemas";
import { LogLevelType, LogCallOverridesType, LogOptionsType } from "@interfaces";
import { defaultLogOptions } from "@defaults";

/** Log level hierarchy for filtering */
const LOG_LEVEL_ORDER: LogLevelType[] = ["trace", "debug", "info", "warn", "error", "fatal"];

/**
 * @module LogManager
 * @version 1.3
 * @description
 *  Internal logging manager for the pmgr CLI.
 *  Provides synchronous, multi-scope log writing with customizable levels, formatting, and colors.
 *  Replaces external dependencies like Pino with a fully self-contained implementation.
 *
 * @author Kame
 * @created 2025-10-29
 * @modified 2025-11-08
 *
 * @remarks
 *  - Supports per-scope log instances (e.g., "runtime", "console", "stacks").
 *  - Logs are written synchronously to file for ordered output.
 *  - Colored and timestamped lines using chalk.
 *  - Minimum log level filtering (trace < debug < info < warn < error < fatal).
 *  - Returns formatted log line or `null` when filtered out.
 *  - Automatically creates directories and provides a /tmp fallback on write error.
 *
 * @example
 * ```ts
 * import { LogManager } from "./LogManager.js";
 *
 * const log = LogManager.getInstance("runtime", {
 *   path: "/home/user/.logs/pmgr/pmgr.log",
 *   level: "debug",
 *   showColors: true,
 * });
 *
 * log.info("Runtime initialized.");
 * log.debug({ status: "ok" });
 * ```
 *
 * @see ConsoleManager
 * @see RuntimeManager
 */
export class LogManager {
  private static instances: Record<string, LogManager> = {};
  private static scopeColors: Record<string, ChalkInstance> = {};

  /** Soft color palette for scope identification */
  private static readonly COLOR_PALETTE: ChalkInstance[] = [
    chalk.blueBright,
    chalk.magentaBright,
    chalk.cyanBright,
    chalk.greenBright,
    chalk.yellowBright,
    chalk.hex("#FFA500"), // orange
    chalk.hex("#FF69B4"), // pink
    chalk.hex("#00CED1"), // turquoise
  ];

  private options: LogOptionsType;

  private constructor(options?: Partial<LogOptionsType>) {
    this.options = LogOptions.parse({ 
      ...defaultLogOptions, 
      ...(options || {}) 
    });
  }

  /** Retrieve or create a scoped instance */
  public static getInstance(name: string = "main", opts?: Partial<LogOptionsType>): LogManager {
    if (!this.instances[name]) {
      this.instances[name] = new LogManager({ rootScope: name, ...opts });
    }
    return this.instances[name];
  }

  /** Generic log entry writer */
  public log(level: LogLevelType, msg: any, opts?: LogCallOverridesType): string | null {
    // 2️⃣ validation via le schéma LogCallOverrides
    const merged = LogCallOverrides.parse({
      ...this.options,
      ...(opts || {})
    });

    if (opts?.scope) merged.scope = opts.scope;

    const currentIndex = LOG_LEVEL_ORDER.indexOf(level);
    const minIndex = LOG_LEVEL_ORDER.indexOf(merged.level!);

    if (currentIndex < minIndex) return null;

    const line = this._formatLine(level, msg, merged);

    try {
      const filePath = this._normalizePath(merged.path!);
      this._ensureDirExists(path.dirname(filePath));
      fs.appendFileSync(filePath, line + "\n", "utf8");
    } catch {
      try {
        const fallback = path.join(os.tmpdir(), "pmgr-fallback.log");
        fs.appendFileSync(fallback, `[FALLBACK][${level}] ${String(msg)}\n`, "utf8");
      } catch {}
    }
    return line;
  }


  // === Shortcut wrappers ===
  public trace(msg: any, opts?: LogCallOverridesType): string | null { return this.log("trace", msg, opts); }
  public debug(msg: any, opts?: LogCallOverridesType): string | null { return this.log("debug", msg, opts); }
  public info (msg: any, opts?: LogCallOverridesType): string | null { return this.log("info" , msg, opts); }
  public warn (msg: any, opts?: LogCallOverridesType): string | null { return this.log("warn" , msg, opts); }
  public error(msg: any, opts?: LogCallOverridesType): string | null { return this.log("error", msg, opts); }
  public fatal(msg: any, opts?: LogCallOverridesType): string | null { return this.log("fatal", msg, opts); }

  /** Format a full log line */
  private _formatLine(level: LogLevelType, msg: any, opts: LogCallOverridesType): string {
    const parts: string[] = [];
    const baseScope = opts.rootScope || "main";
    const scope = opts.scope ? `${baseScope}/${opts.scope}` : baseScope;

    if (opts.showTS) {
      const ts = this._formatTimestamp(opts.formatTS!);
      parts.push(`[${this._colorizePart("date", ts, level, scope, opts.showColors!)}]`);
    }
    if (opts.showLvl) {
      const lvl = this._colorizePart("level", level.toUpperCase(), level, scope, opts.showColors!);
      parts.push(`::[${lvl}]`);
    }

    parts.push(`::[${this._colorizePart("scope", scope, level, scope, opts.showColors!)}]`);

    const content = this._serializeMessage(msg);
    parts.push(`::${this._colorizePart("message", content, level, scope, opts.showColors!)}`);

    return parts.join("");
  }

  /** Assigns a consistent color per scope */
    private _getScopeColor(scope: string): ChalkInstance {
        if (scope === "main") return chalk.cyanBright;

        let color = LogManager.scopeColors[scope];
        if (!color) {
            const idx = Object.keys(LogManager.scopeColors).length % LogManager.COLOR_PALETTE.length;
            color = LogManager.COLOR_PALETTE[idx]!;
            LogManager.scopeColors[scope] = color;
        }
        return color;
    }

  /** Colorize line components */
  private _colorizePart(
    part: "date" | "level" | "scope" | "message",
    text: string,
    level: LogLevelType,
    scope: string,
    enable: boolean
  ): string {
    if (!enable) return text;
    switch (part) {
      case "date": return chalk.dim(text);
      case "level":
        switch (level) {
          case "trace": return chalk.gray(text);
          case "debug": return chalk.cyan(text);
          case "info":  return chalk.green(text);
          case "warn":  return chalk.hex("#FFA500")(text);
          case "error": return chalk.redBright(text);
          case "fatal": return chalk.bgRed.white.bold(text);
        }
        return text;
      case "scope": return this._getScopeColor(scope)(text);
      case "message":
        if (level === "error" || level === "fatal") return chalk.red(text);
        return chalk.cyanBright(text);
      default: return text;
    }
  }

  /** Manual timestamp formatter */
  private _formatTimestamp(format: string): string {
    const d = new Date();
    return format
      .replace("YYYY", String(d.getFullYear()))
      .replace("MM", String(d.getMonth() + 1).padStart(2, "0"))
      .replace("DD", String(d.getDate()).padStart(2, "0"))
      .replace("HH", String(d.getHours()).padStart(2, "0"))
      .replace("mm", String(d.getMinutes()).padStart(2, "0"))
      .replace("ss", String(d.getSeconds()).padStart(2, "0"))
      .replace("Z", "Z");
  }

  /** Serialize any value safely */
  private _serializeMessage(value: any): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    try { return JSON.stringify(value, null, 2); }
    catch { return String(value); }
  }

  /** Normalize the path: expand `~` and resolve absolute */
  private _normalizePath(p: string): string {
    if (!p) return path.join(os.tmpdir(), "pmgr.log");
    const expanded = p.replace(/^~\//, os.homedir() + "/");
    return path.resolve(expanded);
  }

  /** Ensure parent directory exists */
  private _ensureDirExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }
}
