// ts/lib/services/tools/WorkspaceScannerService.ts
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { globSync } from "glob";
import { PNPM_WORKSPACE_YAML, TSCONFIGPATHS_FILE } from "@constants";
import { WorkspaceScan } from "@interfaces";
import { ConsoleManager, ExecManager } from "@core";

export class WorkspaceScannerService {
  private static instance: WorkspaceScannerService | null = null;
  private console = ConsoleManager.getInstance();

  /** 🛑 On interdit new */
  private constructor() {
    this.console.trace(`[init] WorkspaceScannerService constructed`);
  }

  /** 🔹 Accès unique */
  public static getInstance(): WorkspaceScannerService {
    if (!this.instance) {
      this.instance = new WorkspaceScannerService();
    }
    return this.instance;
  }

  /** 🔹 Reset (rarement utile, mais indispensable si tu reload des modules dynamiquement un jour) */
  public static clearInstance(): void {
    this.instance = null;
  }

  /** 🔍 Scan complet du workspace */
  public scan(): WorkspaceScan {
    const ExecContext = ExecManager.getInstance().context;
    const wsRoot = ExecContext.execWsRoot;

    const yamlPath = path.join(wsRoot, PNPM_WORKSPACE_YAML);

    if (!fs.existsSync(yamlPath)) {
      throw new Error(`❌ ${PNPM_WORKSPACE_YAML} introuvable : ${yamlPath}`);
    }

    const raw = fs.readFileSync(yamlPath, "utf-8");
    const data = yaml.load(raw) as any;

    const entries: string[] = Array.isArray(data?.packages)
      ? data.packages
      : [];

    const tsconfigs: string[] = [];
    const wsWatchPaths: string[] = [yamlPath];

    for (const entry of entries) {
      const hasWildcard = entry.includes("*");

      const matches = globSync(entry, {
        cwd: wsRoot,
        absolute: true
      });

      // --- Watcher parent -------------------------------------------------
      if (hasWildcard) {
        const parent = entry.split("*")[0]!;
        const parentDir = path.resolve(wsRoot, parent);

        if (fs.existsSync(parentDir)) wsWatchPaths.push(parentDir);
      } else {
        const directDir = path.resolve(wsRoot, entry);
        if (fs.existsSync(directDir)) wsWatchPaths.push(directDir);
      }

      // --- tsconfig.paths.json --------------------------------------------
      for (const abs of matches) {
        if (!fs.existsSync(abs)) continue;
        if (!fs.statSync(abs).isDirectory()) continue;

        const file = path.join(abs, TSCONFIGPATHS_FILE);

        if (fs.existsSync(file)) tsconfigs.push(file);
      }
    }

    return {
      wsRoot,
      entries,
      tsconfigs,
      wsWatchPaths
    };
  }
}
