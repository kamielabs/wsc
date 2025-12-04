// ts/lib/services/watchers/engines/IndexEngine.ts
import path from "path";
import { BaseEngine } from "./00-BaseEngine";

import { PathsScannerService } from "@services/projects";
import { AliasScannerService } from "@services/projects";

import { AliasScan, PathsScan } from "@interfaces";
import { ConsoleManager, ExecManager } from "@core";
import { TSCONFIGPATHS_FILE } from "@constants";

/**
 * 🔍 IndexEngine
 * - Surveille tous les .ts concernés par les alias "plats"
 * - Ne génère rien → renvoie seulement un AliasScan
 */
export class IndexEngine extends BaseEngine {

  private console = ConsoleManager.getInstance();

  /**
   * 🎯 match()
   * On surveille :
   *  - tout fichier .ts dans un dossier ts/
   *  - sauf :
   *      - index.ts
   *      - *.d.ts
   *      - dossiers générés (ts/lib/generated)
   */
  match(file: string): boolean {
    if (!file.endsWith(".ts")) return false;
    if (file.endsWith(".d.ts")) return false;
    if (file.endsWith("index.ts")) return false;

    // On ne s’occupe que des fichiers dans ts/
    return file.includes("/ts/");
  }

  /**
   * 🚀 handle()
   * 1. Retrouver le tsconfig.paths.json du package
   * 2. Construire un PathsScan
   * 3. Construire un AliasScan
   * 4. Retourner AliasScan au Router
   */
  handle(event: string, file: string): AliasScan | void {
    if (!this.exists(file)) return;
    try {
      // 1️⃣ pkgRoot = racine du package
      const pkgRoot = this.findPackageRoot(file);
      this.console.trace(`[IndexEngine.handle] pkgRoot : ${pkgRoot}`);
      if (!pkgRoot) return;

      // 2️⃣ tsconfig.paths.json
      const tsconfig = path.join(pkgRoot, "tsconfig.paths.json");
      if (!this.exists(tsconfig)) return;

      // 3️⃣ PathsScan
      const pathsScan: PathsScan =
        PathsScannerService.getInstance().scan(tsconfig);

      // 4️⃣ AliasScan
      const aliasScan: AliasScan =
        AliasScannerService.getInstance().scan(pkgRoot, pathsScan);

      return aliasScan;

    } catch (err) {
      this.console.error(`[IndexEngine] Erreur traitement fichier : ${file}`);
      this.console.error(err as any);
      return;
    }
  }


  /**
   * 📦 Trouver le dossier racine du package
   * On remonte jusqu'à trouver un tsconfig.paths.json , 
   * On ignore si le fichier ne fait pas partie d'un dossier ts
   * On return null si on va plus loin que le dossier root du workspace qu'on surveille
   */
  private findPackageRoot(file: string): string | null {
    let dir = path.dirname(file);
    if(!dir.includes('/ts/')) return null;

    while (dir.startsWith(ExecManager.getInstance().context.execWsRoot)) {
        const test = path.join(dir, TSCONFIGPATHS_FILE);
        if (this.exists(test)) return dir;
        dir = path.dirname(dir);
    }

    return null;
  }
}
