// ts/lib/services/watchers/ToolsEventRouter.ts
import path from "path";
import { ConsoleManager } from "@core";
import { WorkspaceScan, PathsScan, AliasScan } from "@interfaces";
import { WorkspaceEngine, PathsEngine, IndexEngine } from "@services/watcher/engines";
import { AliasScannerService, PathsGeneratorService, PathsScannerService, IndexGeneratorService } from "@services/projects";

export class WatcherEventRouter {
  private static instance: WatcherEventRouter;

  private readonly workspaceEngine = new WorkspaceEngine();
  private readonly pathsEngine = new PathsEngine();
  private readonly indexEngine = new IndexEngine();

  private console = ConsoleManager.getInstance();

  private constructor() {}

  public static getInstance(): WatcherEventRouter {
    if (!this.instance) this.instance = new WatcherEventRouter();
    return this.instance;
  }

  /**
   * 🔀 Route un événement détecté par le watcher du workspace.
   * On ne génère rien ici : on orchestre.
   */
  public route(event: string, file: string): void {


    // console.log(`Route Called for event : ${event} on ${file}`)
    // 1) Workspace-level changes (pnpm-workspace.yaml, folders added/removed)
    if (this.workspaceEngine.match(file)) {
        this.console.trace(`Workspace YAML modified`);
        const wsScan: WorkspaceScan | void = this.workspaceEngine.handle(event, file);
        if (wsScan) this.handleWorkspace(wsScan);
        return;
    }

    // 2) paths.tsconfig.* → should regenerate generated/paths.ts
    if (this.pathsEngine.match(file)) {
        this.console.trace(`TSCONFIG paths file modified (${file})`);
        const scan: PathsScan | void = this.pathsEngine.handle(event, file);
        if (scan) this.handlePaths(scan);
        return;
    }

    // 3) Any .ts touched inside alias dirs → regenerate index.ts
    if (this.indexEngine.match(file)) {
        this.console.trace(`Indexed dir modified (${file})`);
        const scan: AliasScan | void = this.indexEngine.handle(event, file);
        if (scan) this.handleAlias(scan);
        return;
    }
  }

  /* ============================================================
   * 🟦 N1 — Workspace modifications
   * ============================================================ */
  private handleWorkspace(scan: WorkspaceScan): void {
    this.console.trace(`🔄 Workspace modifié → rescan complet`);
    this.console.trace(` → ${scan.tsconfigs.length} fichiers tsconfig.paths.json détectés`);

    scan.tsconfigs.length > 0 && scan.tsconfigs.forEach(tsfile => {
        const pathsScan = PathsScannerService.getInstance().scan(tsfile)
        this.handlePaths(pathsScan);
    });
  }

  /* ============================================================
   * 🟩 N2a — PathsScan → regenerate paths.ts
   * ============================================================ */
  private handlePaths(scan: PathsScan): void {
    this.console.trace(`🔄 Mise à jour paths.ts → ${scan.file}`);

    const pkgRoot = path.dirname(scan.file);

    // 1) regenerate paths.ts
    PathsGeneratorService.getInstance().generate(pkgRoot, scan);

    // 2) cascade: regénérer les indexes dépendants
    const aliasScan = AliasScannerService
        .getInstance()
        .scan(pkgRoot, scan);

    this.handleAlias(aliasScan);
    }

  /* ============================================================
   * 🟨 N2b — AliasScan → regenerate index.ts
   * ============================================================ */
  private handleAlias(scan: AliasScan): void {
    for (const dir of scan.resolvedDirs) {
      this.console.trace(`🔄 Regénération index.ts → ${dir}`);
      IndexGeneratorService.getInstance().generate(dir);
    }
  }
}
