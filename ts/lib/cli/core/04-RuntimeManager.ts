
import { GLOBAL_CONFIG_FILE } from "@constants";
import { ConsoleManager, ExecManager, LogManager } from "@core";
import { readJsonConfigFile, resolveLogPath } from "@tools";
import { defaultConfig } from "@defaults";
import { DisplayModeType, ParsedOptionValue, RuntimeOptionsType } from "@interfaces";
import { LogLevel } from "@schemas";

/**
 * @module RuntimeManager
 * @version 1.3
 * @description
 *  Core runtime initializer for the pmgr CLI.
 *  Handles configuration loading, environment setup, and bootstrapping of the ConsoleManager and LogManager.
 *  Serves as the entry point for all CLI executions.
 *
 * @author Kame
 * @created 2025-10-26
 * @modified 2025-11-08
 *
 * @remarks
 *  RuntimeManager boot sequence:
 *  1. Read base configuration with utils/cli.ts/readJsonConfigFile(GLOBAL_CONFIG_FILE, defaultConfig).
 *  2. Merge CLI options with file configuration into a unified RuntimeOptions object.
 *  3. Initialize LogManager (runtime + console scopes).
 *  4. Initialize ConsoleManager for visual output.
 *  5. Expose the global runtime context to all services.
 *
 *  ⚠️ RuntimeManager must always be initialized before any other manager.
 *  LogManager and ConsoleManager both rely on its merged runtime options.
 *
 * @example
 * ```ts
 *  const opts = thisCommand.opts();
 *  // Initialize runtime (fusion config + CLI) + LogManager + ConsoleManager
 *  const runtime = RuntimeManager.init(opts);
 *
 *  const Console = ConsoleManager.getInstance();
 *  Console.debug("🚀 pmgr initialized with runtime environment.");
 * ```
 *
 * @see LogManager
 * @see ConsoleManager
 */
export class RuntimeManager {
  private static instance: RuntimeManager;
  private runtime: RuntimeOptionsType;

  private constructor(globalOpts?: Record<string, ParsedOptionValue>) {
    const execMgr = ExecManager.getInstance();

    // 1) Lecture config fichier
    const wsConfigFile = execMgr.resolveWsFile(GLOBAL_CONFIG_FILE);
    const baseCfg = readJsonConfigFile(wsConfigFile, defaultConfig);

    const logCfg = baseCfg.logging || {};
    const consoleCfg = baseCfg.console || {};

    /* -----------------------------------------------------
     * 2) LogLevel (canonical)
     * ----------------------------------------------------- */

    // globalOpts.LogLevel contient : "trace" | "debug" | "info" | ...
    const logLevel =
      (globalOpts?.LogLevel) ??
      logCfg.level ??
      LogLevel.enum.info;

    /* -----------------------------------------------------
     * 3) Verbosity (quiet/verbose)
     * ----------------------------------------------------- */

    const v = globalOpts?.Verbosity as string | undefined;

    const quiet = 
        v === "quiet"
          ? true
          : v === "verbose"
            ? false
            : consoleCfg.quiet ?? false;

    /* -----------------------------------------------------
     * 4) Logging → activation + path
     * ----------------------------------------------------- */

    let logEnabled = true;

    if (globalOpts?.LogFile === false) {
      // Canonical flag: --no-logfile
      logEnabled = false;
    } else if (globalOpts?.LogFile === true) {
      // Should not happen, but ignore
      logEnabled = logCfg.enabled ?? true;
    }

    const logPath = resolveLogPath(
      typeof globalOpts?.LogFile === "string"
        ? globalOpts?.LogFile
        : logCfg.path || ".ws/logs/wsc.log",
      execMgr.context
    );

    /* -----------------------------------------------------
     * 5) Display Mode (raw|pretty)
     * ----------------------------------------------------- */

    const displayMode =
      (globalOpts?.PrintMode as DisplayModeType) ??
      consoleCfg.mode ??
      "raw";

    /* -----------------------------------------------------
     * 6) Script mode
     * ----------------------------------------------------- */

    const script =
      globalOpts?.Scripting ? true : false;

    /* -----------------------------------------------------
     * 7) Runtime final
     * ----------------------------------------------------- */

    this.runtime = {
      logLevel,
      logEnabled,
      logPath,
      displayMode,
      quiet,
      script,
      execContext: execMgr.context
    };

    /* -----------------------------------------------------
     * 8) Boot des managers
     * ----------------------------------------------------- */

    const logRuntime = this._initLogger("runtime");
    logRuntime.debug(`RuntimeManager Logger initialized at level ${logLevel}`);

    const logConsole = this._initLogger("console");
    logConsole.debug(`ConsoleManager Logger initialized at level ${logLevel}`);

    const Console = ConsoleManager.init(this.runtime);
    Console.debug(`ConsoleManager initialized successfully`);
  }

  private _initLogger(scope: string): LogManager {
    return LogManager.getInstance(scope, {
      path: this.runtime.logPath,
      level: this.runtime.logLevel,
      showColors: true,
    });
  }

  /* -----------------------------------------------------
   * STATIC
   * ----------------------------------------------------- */

  public static init(globalOpts?: Record<string, ParsedOptionValue>): RuntimeManager {
    if (!RuntimeManager.instance) {
      RuntimeManager.instance = new RuntimeManager(globalOpts);
    }
    return RuntimeManager.instance;
  }

  public static getInstance(): RuntimeManager {
    if (!RuntimeManager.instance)
      throw new Error("RuntimeManager not initialized.");
    return RuntimeManager.instance;
  }

  public get<K extends keyof RuntimeOptionsType>(key: K): RuntimeOptionsType[K] {
    return this.runtime[key];
  }

  public all(): RuntimeOptionsType {
    return this.runtime;
  }
}

