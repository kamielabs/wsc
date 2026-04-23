/**
 * @module ConfigOrchestrator
 * @version 1.4
 * @description
 *  Business logic layer for global wsc configuration management.
 *  Handles parsing, validation, and update logic for `config.json`.
 *  Extends {@link ConfigManager} to add higher-level operations such as schema validation,
 *  array manipulations, and CLI-specific option handling.
 *
 * @author Kame
 * @created 2025-11-09
 * @modified 2025-11-09
 *
 * @remarks
 *  - Acts as the middleware between CLI commands and low-level data managers.
 *  - All configuration persistence is handled by {@link ConfigManager} (which extends {@link JsonManager}).
 *  - Provides validation through Zod schemas defined in `schemas/configSchemas.ts`.
 *  - Returns unified results as `{ success: boolean, message: string }` for CLI feedback.
 *  - Never writes directly to console.
 *  - Implements intelligent value parsing for CLI input (`string → boolean | number | object`).
 *  - Future services (e.g. WorkspacesService, TemplatesService) will follow the same structure.
 *
 * @example
 * ```ts
 * import { ConfigOrchestrator } from "@services";
 * import { RuntimeManager } from "@core";
 *
 * const runtime = RuntimeManager.getInstance().all();
 * const service = new ConfigService(runtime);
 *
 * // Display configuration
 * service.show();
 *
 * // Modify configuration
 * service.set("console.mode", "pretty");
 *
 * // Append to an array key
 * service.set("logging.test", "debug", { append: true });
 *
 * // Deep modification with schema validation
 * service.set("logging", '{ "enabled": true, "level": "info" }', { deep: true });
 * ```
 *
 * @see ConfigManager
 * @see JsonManager
 * @see RuntimeManager
 */
import { ConfigAdapter } from "@adapters";
import { defaultConfig } from "@defaults";
import { Config } from "@schemas";
import { ManagerResultType, ManagerRuntimeContextType, ServiceConfigSetOptionType } from "@interfaces";

/**
 * @class ConfigOrchestrator
 * @extends ConfigAdapter
 * @classdesc
 *  Adds business-level logic and validation rules to {@link ConfigAdapter}.
 *  Responsible for applying configuration changes safely through validated operations.
 */
export class ConfigOrchestrator extends ConfigAdapter {
  // private schema
  // or method to extend schema (addPersistentConfig) for example

  constructor(runtimeCtx?: Partial<ManagerRuntimeContextType>) {
    super(runtimeCtx);
  }

  // ---------------------------------------------------------------------
  // 🧾 READ
  // ---------------------------------------------------------------------

  /**
   * Display the current configuration or a specific key.
   *
   * @param key - Optional key path (e.g., `"console"` or `"logging.level"`)
   * @returns void
   *
   * @example
   * service.show(); // show full config
   * service.show("console"); // show console section only
   */
  public show(key?: string): ManagerResultType {
    const value = key ? super.get(key) : super.getAll();
    if(value != undefined) {
      return { success: true, message:value }
    } else {
      return { success: false, message:"No Config Found !" }
    }
  }

  // ---------------------------------------------------------------------
  // ✏️ WRITE / UPDATE
  // ---------------------------------------------------------------------

  /**
   * Modify a configuration key or branch.
   * Supports multiple operation modes:
   * - Simple key update
   * - Array append/remove
   * - Deep object overwrite (with optional Zod validation)
   *
   * @param key - Configuration key path (e.g., `"logging.level"`)
   * @param value - Value to set (stringified if JSON)
   * @param opts - CLI flags (`--append`, `--remove`, `--deep`)
   * @returns {JsonResult} Result of the operation (success + message)
   *
   * @example
   * service.set("console.quiet", "false");
   * service.set("logging.test", "debug", { append: true });
   * service.set("logging", '{ "enabled": true, "level": "info" }', { deep: true });
   */
  public set(key: string, value: any, opts: ServiceConfigSetOptionType = {}): ManagerResultType {
    const target = this.get(key);

    // 1️⃣ Prevent conflicting flags
    if (opts.append && opts.remove) {
      return { success: false, message: "--append and --remove cannot be used together." };
    }

    // 2️⃣ Parse CLI string into proper type
    const parsed = this.parseValue(value);

    // 3️⃣ Disallow complex updates without --deep
    if (typeof parsed === "object" && !opts.deep) {
      return {
        success: false,
        message: "Detected object or array value. Use --deep to safely update structured keys.",
      };
    }

    // 4️⃣ Handle deep updates with optional Zod validation
    if (opts.deep) {
      const schema = (Config as any)[key];
      if (schema) {
        const parsedSchema = schema.safeParse(parsed);
        if (!parsedSchema.success) {
          const msg = parsedSchema.error.issues
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");
          return { success: false, message: `Invalid structure for '${key}': ${msg}` };
        }
      } else {
        return { success: false, message:`No schema defined for '${key}', skipping validation.`};
      }

      const result = super.set(key, parsed, { deep: true });
      return result.success
        ? { success: true, message: `Deep update validated and applied to '${key}'.` }
        : result;
    }

    // 5️⃣ Handle array operations (append/remove)
    if (opts.append || opts.remove) {
      if (!Array.isArray(target)) {
        return { success: false, message: `'${key}' is not an array. Use normal set instead.` };
      }

      if (opts.append) {
        return super.addTo(key, parsed);
      } else {
        return super.delFrom(key, parsed);
      }
    }

    // 6️⃣ Handle normal scalar updates
    if (Array.isArray(target)) {
      return {
        success: false,
        message: `'${key}' is an array. Use --append or --remove instead of set.`,
      };
    }

    return super.set(key, parsed);
  }

  // ---------------------------------------------------------------------
  // 🔄 RESET
  // ---------------------------------------------------------------------

  /**
   * Reset configuration to default values.
   *
   * @returns {JsonResult} Result of the reset operation.
   *
   * @example
   * service.reset();
   */
  public reset(): ManagerResultType {
    return super.reset(defaultConfig);
  }

  // ---------------------------------------------------------------------
  // 🧩 INTERNAL HELPERS
  // ---------------------------------------------------------------------

  /**
   * Convert a raw CLI string value into its logical type.
   * Supports boolean, number, JSON object/array, and string.
   *
   * @param value - Raw CLI argument
   * @returns {any} Parsed logical value
   *
   * @example
   * parseValue("true")  → true
   * parseValue("42")    → 42
   * parseValue("{\"a\":1}") → { a: 1 }
   */
  private parseValue(value: string): any {
    const trimmed = value.trim();

    // JSON object / array
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new Error("Invalid JSON syntax. Use proper JSON like '{\"key\":value}'.");
      }
    }

    // Boolean
    if (["true", "false"].includes(trimmed.toLowerCase())) {
      return trimmed.toLowerCase() === "true";
    }

    // Number
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }

    // String fallback
    return value;
  }
}
