// ts/lib/services/tools/PathsGeneratorService.ts
import fs from "fs";
import path from "path";
import { computeHash } from "@tools";
import { PathsScan } from "@interfaces";
import { ConsoleManager } from "@core";

export class PathsGeneratorService {
  private static instance: PathsGeneratorService | null = null;
  private console = ConsoleManager.getInstance();

  private constructor() {
    this.console.trace(`[init] PathsGeneratorService constructed`);
  }

  public static getInstance(): PathsGeneratorService {
    if (!this.instance) {
      this.instance = new PathsGeneratorService();
    }
    return this.instance;
  }

  public static clearInstance(): void {
    this.instance = null;
  }

  private readOldAliases(outFile: string): Record<string, string[]> {
    if (!fs.existsSync(outFile)) return {};

    try {
      const raw = fs.readFileSync(outFile, "utf-8");

      //
      // On isole l’objet PATHS : { ... }
      //
      const match = raw.match(/export const PATHS:.*?=\s*({[\s\S]*?});/);
      if (!match) return {};

      const objText = match[1]!; // juste le { ... }

      //
      // On parse à la main — sans eval — vraiment safe
      //
      const aliasMap: Record<string, string[]> = {};

      // On récupère chaque "key": [...]
      const entryRegex = /"([^"]+)"\s*:\s*(\[[^\]]*\])/g;
      let entry;

      while ((entry = entryRegex.exec(objText)) !== null) {
        const alias = entry[1]!;
        const arrayText = entry[2]!;

        try {
          const values: string[] = JSON.parse(arrayText);
          aliasMap[alias] = values;
        } catch {
          // en cas d’erreur de parsing d’un array (improbable dans du code auto-généré)
          aliasMap[alias] = [];
        }
      }

      return aliasMap;

    } catch (e) {
      this.console.error(`⚠️ Impossible de parser ancien paths.ts : ${outFile}`);
      this.console.error(e as any);
      return {};
    }
  }


  private removeOldIndex(dir: string) {

    const indexPath = path.join(dir, "index.ts");
    const hashPath = path.join(dir, ".index.hash");

    let removed = false;

    if (fs.existsSync(indexPath)) {
      fs.rmSync(indexPath);
      removed = true;
    }
    if (fs.existsSync(hashPath)) {
      fs.rmSync(hashPath);
      removed = true;
    }

    // supprimer dossier si vide
    if (removed) {
      const remains = fs.readdirSync(dir);
      if (remains.length === 0) {
        fs.rmdirSync(dir);
      }
      this.console.info(`🧹 index.ts supprimé du dossier ${dir} car alias retiré`);
    }
  }

  /** 🔄 Génère paths.ts et PURGE ce qui doit l’être */
  public generate(pkgRoot: string, scan: PathsScan): void {
    const outDir = path.join(pkgRoot, "ts/lib/generated");
    const outFile = path.join(outDir, "paths.ts");
    const hashFile = path.join(outDir, ".paths.hash");

    //
    // 1️⃣ Build new content
    //
    const lines = [
      "// ⚙️ Auto-generated file — DO NOT EDIT",
      "",
      "export type AliasMap = Record<string, string[]>;",
      "export const PATHS: AliasMap = {",
    ];

    for (const [alias, rels] of Object.entries(scan.paths)) {
      lines.push(`  "${alias}": ${JSON.stringify(rels)},`);
    }

    lines.push("};\n");

    const content = lines.join("\n");
    const newHash = computeHash(content);

    //
    // 2️⃣ Lire ancien hash
    //
    let oldHash = "";
    try {
      if (fs.existsSync(hashFile)) {
        oldHash = fs.readFileSync(hashFile, "utf-8").trim();
      }
    } catch {}

    //
    // 3️⃣ PURGE si hash change
    //
    if (newHash !== oldHash && fs.existsSync(outFile)) {
      const oldAliasMap = this.readOldAliases(outFile);
      const newAliasMap = scan.paths;

      // alias non wildcard
      const oldFlat = Object.keys(oldAliasMap).filter(a => !a.endsWith("/*"));
      const newFlat = Object.keys(newAliasMap).filter(a => !a.endsWith("/*"));

      // pour chaque alias supprimé, supprimer les index associés
      for (const alias of oldFlat) {
        if (!newFlat.includes(alias)) {
          const oldRelPaths = oldAliasMap[alias] || [];
          for (const rel of oldRelPaths) {
            const dir = path.join(pkgRoot, rel);
            this.removeOldIndex(dir);  // tu as déjà cette fonction
          }
        }
      }
    }

    //
    // 4️⃣ Écriture du nouveau fichier
    //
    try {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outFile, content, "utf-8");
      fs.writeFileSync(hashFile, newHash, "utf-8");

      this.console.info(`🔄 paths.ts mis à jour → ${outFile}`);
    } catch (err) {
      this.console.error(`⚠️ Impossible d’écrire ${outFile}`);
      this.console.error(err as any);
    }
  }
}
