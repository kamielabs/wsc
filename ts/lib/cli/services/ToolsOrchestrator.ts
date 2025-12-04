import path from "path";

import { WorkspaceScannerService } from "@services/workspace";
import { PathsScannerService } from "@services/projects";
import { AliasScannerService } from "@services/projects";

import { PathsGeneratorService } from "@services/projects";
import { IndexGeneratorService } from "@services/projects";

import { WorkspaceScan, PathsScan, AliasScan } from "@interfaces";

export class ToolsOrchestrator {


  constructor() {}


  /* -------------------------------------------------------------
   * 🟦 PATHS ONLY
   * ------------------------------------------------------------- */

  /**
   * Génère tous les paths.ts pour le workspace.
   * - Scan workspace (pnpm-workspace.yaml)
   * - Pour chaque tsconfig.paths.json → PathsScanner → PathsGenerator
   */
  public generatePaths(): void {
    const wsScan: WorkspaceScan = WorkspaceScannerService.getInstance().scan();

    for (const tsconfigFile of wsScan.tsconfigs) {
      const pkgRoot = path.dirname(tsconfigFile);
      const pathsScan: PathsScan = PathsScannerService.getInstance().scan(tsconfigFile);     
      PathsGeneratorService.getInstance().generate(pkgRoot, pathsScan);
    }
  }


  /* -------------------------------------------------------------
   * 🟩 INDEXES ONLY
   * ------------------------------------------------------------- */

  /**
   * Génère tous les index.ts pour le workspace.
   * - Scan workspace
   * - Pour chaque tsconfig.paths.json :
   *    - PathsScanner → AliasScanner → IndexGenerator sur chaque aliasDir
   */
  public generateIndexes(): void {
    const wsScan: WorkspaceScan = WorkspaceScannerService.getInstance().scan();

    for (const tsconfigFile of wsScan.tsconfigs) {
      const pkgRoot = path.dirname(tsconfigFile);

      const pathsScan: PathsScan = PathsScannerService.getInstance().scan(tsconfigFile);
      const aliasScan: AliasScan = AliasScannerService.getInstance().scan(pkgRoot, pathsScan);


      for (const dir of aliasScan.resolvedDirs) {
        IndexGeneratorService.getInstance().generate(dir);
      }
    }
  }


  /* -------------------------------------------------------------
   * 🟨 ALL (paths + index)
   * ------------------------------------------------------------- */

  /**
   * Génère :
   *  1) tous les paths.ts
   *  2) tous les index.ts
   *
   * NB: On factorise le scan workspace pour éviter de relire pnpm-workspace.yaml.
   */
  public generateAll(): void {

    const wsScan: WorkspaceScan = WorkspaceScannerService.getInstance().scan();

    for (const tsconfigFile of wsScan.tsconfigs) {
      const pkgRoot = path.dirname(tsconfigFile);
      const pathsScan: PathsScan = PathsScannerService.getInstance().scan(tsconfigFile);
      const aliasScan: AliasScan = AliasScannerService.getInstance().scan(pkgRoot, pathsScan);
      // 1) paths.ts
      PathsGeneratorService.getInstance().generate(pkgRoot, pathsScan);

      // 2) index.ts pour chaque aliasDir
      for (const dir of aliasScan.resolvedDirs) {
        IndexGeneratorService.getInstance().generate(dir);
      }
    }
  }
}
