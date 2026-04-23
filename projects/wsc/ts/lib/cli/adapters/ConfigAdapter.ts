/**
 * @module ConfigAdapter
 * @version 1.4
 * @description
 *  Low-level configuration manager for pmgr.
 *  Extends {@link JsonManager} to handle persistent read/write operations
 *  on the global configuration file (`conf/config.json`).
 *
 *  This class provides **no business logic** — it only ensures correct
 *  initialization and access to configuration data, and exposes a clean
 *  interface for {@link ConfigService} to build upon.
 *
 * @author Kame
 * @created 2025-11-09
 * @modified 2025-11-09
 *
 * @remarks
 *  - Automatically initializes the configuration file if missing or empty.
 *  - Uses default values defined in `cli/defaults.ts`.
 *  - Relies on {@link JsonManager} for all JSON file operations.
 *  - Never interacts directly with {@link ConsoleManager}.
 *  - This is a pure data layer class: it manipulates files, not logic.
 *
 * @example
 * ```ts
 * import { ConfigManager } from "../managers/ConfigManager.js";
 *
 * const manager = new ConfigManager();
 * const config = manager.getAll();
 *
 * console.log(config.logging.level); // "info"
 * manager.set("console.mode", "pretty");
 * manager.save();
 * ```
 *
 * @see JsonManager
 * @see ConfigService
 * @see RuntimeManager
 */

import { GLOBAL_CONFIG_FILE } from "@constants";
import { ExecManager, JsonManager } from "@core";
import { defaultConfig } from "@defaults";
import { ConfigType, ManagerRuntimeContextType } from "@interfaces";
import { removeMetaKeys } from "@tools";

/**
 * @class ConfigAdapter
 * @extends JsonManager
 * @classdesc
 *  Handles direct access and persistence for the global pmgr configuration.
 *  Automatically loads defaults on first run or when the file is empty.
 */
export class ConfigAdapter extends JsonManager<ConfigType> {
  private static instance: ConfigAdapter;
  /**
   * @constructor
   * @param runtimeCtx - Optional runtime context (propagated by {@link RuntimeManager})
   * @example
   * const manager = new ConfigAdapter({ script: true });
   */
  constructor(runtimeCtx?: Partial<ManagerRuntimeContextType>) {

    // 👉 le path du config se construit ***dans le workspace courant***
    const exec = ExecManager.getInstance();
    const configFilePath = exec.resolveWsFile(GLOBAL_CONFIG_FILE);
    super(configFilePath, runtimeCtx);

    // Initialize configuration with defaults if empty
    if (!this.data || Object.keys(this.data).length === 0) {
      this.reset(defaultConfig);
    }
  }

  /** 🧹 Récupération propre sans clés meta/commentaires */
  public getClean(): Record<string, any> {
    return removeMetaKeys(this.data);
  }

  /**
   * 🔹 Retourne l'instance singleton du CoreManager.
   */
  static getInstance(): ConfigAdapter {
    if (!ConfigAdapter.instance) {
      ConfigAdapter.instance = new ConfigAdapter();
    }
    return ConfigAdapter.instance;
  }
}
