// ts/lib/services/tools/PathsScannerService.ts
import fs from "fs";
import { PathsScan } from "@interfaces";
import { ConsoleManager } from "@core";

export class PathsScannerService {
  private static instance: PathsScannerService | null = null;
  private console = ConsoleManager.getInstance();

  /** 🛑 Interdit new */
  private constructor() {
    this.console.trace(`[init] PathsScannerService constructed`);
  }

  /** 🔹 Singleton */
  public static getInstance(): PathsScannerService {
    if (!this.instance) {
      this.instance = new PathsScannerService();
    }
    return this.instance;
  }

  /** 🔹 Permet un reset si nécessaire */
  public static clearInstance(): void {
    this.instance = null;
  }

  /**
   * 🔍 Analyse tsconfig.paths.json (N2a)
   * - ignore @root*
   * - retourne file + paths propres
   */
  public scan(file: string): PathsScan {
    if (!fs.existsSync(file)) {
      return { file, paths: {} };
    }

    let raw: string;
    try {
      raw = fs.readFileSync(file, "utf-8");
    } catch {
      return { file, paths: {} };
    }

    let json: any;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      this.console.error(`⚠️ Fichier JSON invalide : ${file}\n${e}`);
      return { file, paths: {} };
    }

    const compiler = json.compilerOptions || {};
    const tsPaths = compiler.paths || {};

    const cleaned: Record<string, string[]> = {};

    for (const [alias, rels] of Object.entries(tsPaths)) {
      // ❌ ignorer @root/*
      if (alias.startsWith("@root")) continue;

      cleaned[alias] = Array.isArray(rels) ? rels : [];
    }

    return { file, paths: cleaned };
  }
}
