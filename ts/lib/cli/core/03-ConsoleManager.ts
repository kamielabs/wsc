import chalk from "chalk";
import { LogManager } from "@core";
import { ManagerResultType, RuntimeOptionsType } from "@interfaces";

type Printable = ManagerResultType | string | string[] | Record<string, any>;

export class ConsoleManager {
  private static instance: ConsoleManager;
  private runtime: RuntimeOptionsType;
  private logger = LogManager.getInstance("console");

  private constructor(runtime: RuntimeOptionsType) {
    this.runtime = runtime;
  }

  /** 🏁 Initialize once from RuntimeManager */
  public static init(runtime: RuntimeOptionsType): ConsoleManager {
    if (!ConsoleManager.instance) {
      ConsoleManager.instance = new ConsoleManager(runtime);
    }
    return ConsoleManager.instance;
  }

  /** 🌍 Global accessor */
  public static getInstance(): ConsoleManager {
    if (!ConsoleManager.instance)
      throw new Error("ConsoleManager not initialized.");
    return ConsoleManager.instance;
  }

  /** 🧾 Allowed to display? */
  private canDisplay(): boolean {
    return !this.runtime.quiet;
  }

  // ---------------------------------------------------------------------
  // 🚦 Public API — All methods accept Printable
  // ---------------------------------------------------------------------

  /** 🪶 passthrough, no icon, no log */
  public raw(payload: Printable): void {
    if (!this.canDisplay()) return;
    const { data } = this.unwrap(payload);
    this.printData(data, /*withIcon*/ false);
  }

  /** 🪲 Tracing : Low Level Debugging */
  public trace(payload: Printable): void {
    const { data } = this.unwrap(payload);
    this.logger.trace(this.stringify(data));
    if (
      this.canDisplay() &&
      this.runtime.logEnabled &&
      (this.runtime.logLevel === "trace")
    ) {
      this.printWithIcon("🔍", chalk.gray, data);
    }
  }

  /** 🪲 Debug */
  public debug(payload: Printable): void {
    const { data } = this.unwrap(payload);
    this.logger.debug(this.stringify(data));
    if (
      this.canDisplay() &&
      this.runtime.logEnabled &&
      (this.runtime.logLevel === "debug" || this.runtime.logLevel === "trace")
    ) {
      this.printWithIcon("🔍", chalk.blueBright, data);
    }
  }

  /** ℹ️ Info */
  public info(payload: Printable): void {
    const { data } = this.unwrap(payload);
    this.logger.info(this.stringify(data));
    if (!this.canDisplay()) return;
    this.printWithIcon("ℹ️ ", chalk.cyanBright, data);
  }

  /** ✅ Success — si JsonResultType avec success=false ➜ route en error() */
  public success(payload: Printable): void {
    const un = this.unwrap(payload);
    if (un.success === false) {
      this.error(un.data);
      return;
    }
    this.logger.info(this.stringify(un.data));
    if (!this.canDisplay()) return;
    this.printWithIcon("✅ ", chalk.green, un.data);
  }

  /** ⚠️ Warning */
  public warn(payload: Printable): void {
    const { data } = this.unwrap(payload);
    this.logger.warn(this.stringify(data));
    if (!this.canDisplay()) return;
    this.printWithIcon("⚠️ ", chalk.hex("#FFA500"), data);
  }

  /** ❌ Error — accepte aussi JsonResultType */
  public error(payload: Printable): void {
    const { data } = this.unwrap(payload);
    this.logger.error(this.stringify(data));
    if (!this.canDisplay()) return;
    this.printWithIcon("❌ ", chalk.red, data);
  }

  /**
   * 📦 “Result” pour sorties neutres (listes/objets/strings)
   * Jamais loggé (UX de commande).
   */
  public result(payload: Printable): void {
    // if (!this.canDisplay()) return;
    const { data } = this.unwrap(payload);
    this.printData(data, /*withIcon*/ false);
  }

  /**
   * 🎯 Imprime un JsonResult ou une donnée brute en choisissant succès/erreur
   * (pratique pour faire `Console.print(serviceCall())`)
   */
  public print(payload: Printable): void {
    // if (!this.canDisplay()) return;
    const un = this.unwrap(payload);
    if (un.success === false) {
      this.error(un.data);
    } else {
      this.result(un.data);
    }
  }

  /** 📦 Forcer l’affichage objet (raw/pretty) */
  public printObject(obj: any, mode?: "raw" | "pretty"): void {
    const activeMode = mode || this.runtime.displayMode;
    const formatted =
      activeMode === "raw" ? JSON.stringify(obj, null, 2) : this.pretty(obj);
    // if (this.canDisplay()) console.log(formatted);
    console.log(formatted);
  }

  // ---------------------------------------------------------------------
  // 🧩 Helpers
  // ---------------------------------------------------------------------

  /** Détecte JsonResultType et en extrait (success?, data) */
  private unwrap(payload: Printable): {
    success?: boolean;
    data: string | string[] | Record<string, any>;
  } {
    if (this.isJsonResult(payload)) {
      return { success: payload.success, data: payload.message as any };
    }
    return { data: payload as any };
  }

  /** Type guard JsonResultType */
  private isJsonResult(obj: any): obj is ManagerResultType {
    return !!obj && typeof obj === "object" && "success" in obj && "message" in obj;
  }

  /** Impression avec icône (chaine → ligne unique; array/obj → header + bloc) */
  private printWithIcon(
    icon: string,
    color: (str: string) => string,
    data: string | string[] | Record<string, any>
  ): void {
    if (typeof data === "string") {
      console.log(color(`${icon} ${data}`));
      return;
    }
    // entêtes pour structures
    console.log(color(`${icon}`));
    this.printData(data, /*withIcon*/ false);
  }

  /** Impression data (sans icône) avec respect du displayMode */
  private printData(
    data: string | string[] | Record<string, any>,
    _withIcon: boolean
  ): void {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.log(chalk.gray("(empty list)"));
        return;
      }
      data.forEach((item) => console.log(`- ${item}`));
      return;
    }
    if (typeof data === "object") {
      const formatted =
        this.runtime.displayMode === "raw"
          ? JSON.stringify(data, null, 2)
          : this.pretty(data);
      console.log(formatted);
      return;
    }
    // string
    console.log(data);
  }

  /** Stringify sécurisé pour logs */
  private stringify(value: any): string {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /** Pretty recursive (indent 2) */
  private pretty(obj: any, indent = 0): string {
    const pad = " ".repeat(indent * 2);
    const keyColor = chalk.cyanBright;
    const valColor = chalk.white;

    if (obj === null) return chalk.gray("null");
    if (typeof obj !== "object") return valColor(String(obj));

    return Object.entries(obj)
      .map(([key, val]) => {
        if (typeof val === "object" && val !== null) {
          return `${pad}${keyColor.bold(key)}:\n${this.pretty(val, indent + 1)}`;
        }
        const printable =
          typeof val === "string"
            ? chalk.gray(`"${val}"`)
            : chalk.magentaBright(String(val));
        return `${pad}${keyColor(key)}: ${printable}`;
      })
      .join("\n");
  }
}
