// ts/lib/services/tools/AliasScannerService.ts
import path from "path";
import { AliasScan, PathsScan } from "@interfaces";
import { ConsoleManager } from "@core";

export class AliasScannerService {
  private static instance: AliasScannerService | null = null;
  private console = ConsoleManager.getInstance();

  /** 🛑 Interdit new */
  private constructor() {
    this.console.trace(`[init] AliasScannerService constructed`);
  }

  /** 🔹 Singleton */
  public static getInstance(): AliasScannerService {
    if (!this.instance) {
      this.instance = new AliasScannerService();
    }
    return this.instance;
  }

  /** 🔹 Optionnel : reset */
  public static clearInstance(): void {
    this.instance = null;
  }

  /**
   * 🔍 N2b — Construit la structure alias :
   * - allAliases
   * - flatAliases
   * - resolvedDirs
   */
  public scan(pkgRoot: string, scan: PathsScan): AliasScan {
    const allAliases = scan.paths; // déjà propre (sans @root)
    const flatAliases: Record<string, string[]> = {};
    const resolvedDirs: string[] = [];

    for (const [alias, values] of Object.entries(allAliases)) {
      if (!Array.isArray(values) || values.length === 0) continue;

      const first = values[0];
      if (!first) continue;

      // ❌ ignorons les wildcards
      if (alias.endsWith("/*")) continue;

      // ❌ ignore chemins externes
      if (
        !(first.startsWith("ts/") ||
          first.startsWith("./ts/") ||
          first === "ts")
      ) {
        continue;
      }

      // OK → on inclut l’alias
      flatAliases[alias] = values;

      // Résolution local → absolute
      const resolved = path.resolve(pkgRoot, first);
      resolvedDirs.push(resolved);
    }

    return {
      file: scan.file,
      allAliases,
      flatAliases,
      resolvedDirs
    };
  }
}
