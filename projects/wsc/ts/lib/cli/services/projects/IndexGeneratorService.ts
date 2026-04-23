// ts/lib/services/tools/IndexGeneratorService.ts
import fs from "fs";
import path from "path";
import { computeHash } from "@tools";
import { ConsoleManager } from "@core";

export class IndexGeneratorService {
  private static instance: IndexGeneratorService | null = null;
  private console = ConsoleManager.getInstance();

  private constructor() {
    this.console.trace(`[init] IndexGeneratorService constructed`);
  }

  public static getInstance(): IndexGeneratorService {
    if (!this.instance) {
      this.instance = new IndexGeneratorService();
    }
    return this.instance;
  }

  public static clearInstance(): void {
    this.instance = null;
  }

  /**
   * 🔄 Génère OU supprime index.ts en fonction du contenu.
   */
  public generate(dir: string): void {
    try {
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;

      const indexPath = path.join(dir, "index.ts");
      const hashPath  = path.join(dir, ".index.hash");

      // -----------------------------------------
      // 1) Scanner les .ts exportables
      // -----------------------------------------
      const files = fs
        .readdirSync(dir)
        .filter((f) =>
          f.endsWith(".ts") &&
          f !== "index.ts" &&
          !f.endsWith(".d.ts") &&
          !f.startsWith("_")
        );

      // -----------------------------------------
      // 2) Cas dossier VIDE -> supprimer index.ts
      // -----------------------------------------
      if (files.length === 0) {
        this.deleteIndex(indexPath, hashPath);
        return;
      }

      // -----------------------------------------
      // 3) Générer contenu
      // -----------------------------------------
      const sorted = files.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );

      const exportLines = sorted.map(
        (f) => `export * from "./${f.replace(/\.ts$/, "")}";`
      );

      const content =
        "// ⚙️ Auto-generated file — DO NOT EDIT\n\n" +
        exportLines.join("\n") +
        "\n";

      const newHash = computeHash(content);

      // Lire ancien hash
      const oldHash =
        fs.existsSync(hashPath) && fs.existsSync(indexPath)
          ? fs.readFileSync(hashPath, "utf-8").trim()
          : "";

      if (newHash === oldHash) {
        // Rien à faire
        return;
      }

      // Écriture
      fs.writeFileSync(indexPath, content, "utf-8");
      fs.writeFileSync(hashPath, newHash, "utf-8");

      this.console.info(`📦 index.ts mis à jour → ${dir}`);

    } catch (err) {
      this.console.error(`⚠️ Erreur génération index.ts pour ${dir}`);
      this.console.error(err as any);
    }
  }

  /**
   * 🧹 Suppression propre d'un index vide
   */
  private deleteIndex(indexPath: string, hashPath: string): void {
    try {
      let removed = false;

      if (fs.existsSync(indexPath)) {
        fs.unlinkSync(indexPath);
        removed = true;
      }

      if (fs.existsSync(hashPath)) {
        fs.unlinkSync(hashPath);
        removed = true;
      }

      if (removed) {
        this.console.info(`🗑️ index.ts supprimé (dossier vide)`);
      }
    } catch (err) {
      this.console.error(`⚠️ Impossible de supprimer index.ts / hash`);
      this.console.error(err as any);
    }
  }
}
