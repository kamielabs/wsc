import path from "path";
import { ConsoleManager, ExecManager } from "@core";
import { WatcherManager } from "@core";
import { WatcherEventRouter } from "@services/watcher";

export class WorkspaceWatcherService {
  private static instance: WorkspaceWatcherService;
  private manager = WatcherManager.getInstance();
  private console = ConsoleManager.getInstance();

  private constructor() {}

  public static getInstance(): WorkspaceWatcherService {
    if (!this.instance) this.instance = new WorkspaceWatcherService();
    return this.instance;
  }

  /** Lance le watcher unique du workspace */
  public start(): void {
    const exec = ExecManager.getInstance().context;
    const name = "workspace";

    this.manager.create(name, {
      paths: exec.execWsRoot,
      chokidar: {
        ignoreInitial: false,
        persistent: true,
        depth: 50,
        ignored: (file) =>
        [
          "/node_modules/",
          "/.git/",
          "/dist/",
          "/release/",
        ].some((frag) => file.includes(frag))
      },
      onEvent: (evt, file) => {
        // console.log(`Event : ${evt} for file ${file}`);
        WatcherEventRouter.getInstance().route(evt, file);
      },
      onReady: () => {
        this.console.info(`🟢 [watcher] Workspace prêt -> ${exec.execWsRoot}`);
      }
    }).start();

  }

  /** Stoppe le watcher */
  public stop(): void {
    this.manager.stopAll();
  }
}
