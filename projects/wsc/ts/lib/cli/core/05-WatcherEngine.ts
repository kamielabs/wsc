// ts/lib/core/WatcherEngine.ts
import chokidar, { FSWatcher, ChokidarOptions } from "chokidar";
import { ConsoleManager } from "@core";

export interface WatcherEngineOptions {
  paths: string | string[];
  chokidar?: ChokidarOptions;   // 🔥 uniquement les opts valides chokidar ici
  onEvent?: (event: string, file: string) => void;
  onReady?: () => void;
}

export class WatcherEngine {
  private static instances = new Map<string, WatcherEngine>();
  private watcher: FSWatcher | null = null;

  private console = ConsoleManager.getInstance();

  private constructor(
    private readonly name: string,
    private readonly opts: WatcherEngineOptions
  ) {
    this.console.trace(`[init] WatcherEngine "${name}" created`);
  }

  // ------------------------------------------------------------
  //  Singleton multi-instance (1 watcher = 1 name)
  // ------------------------------------------------------------
  public static getInstance(name: string, opts?: WatcherEngineOptions): WatcherEngine {
    const existing = this.instances.get(name);
    if (existing) return existing;

    if (!opts)
      throw new Error(`WatcherEngine "${name}" created without opts !`);

    const inst = new WatcherEngine(name, opts);
    this.instances.set(name, inst);
    return inst;
  }

  public static clearInstance(name?: string): void {
    if (!name) {
      for (const inst of this.instances.values()) inst.stop();
      this.instances.clear();
      return;
    }
    const inst = this.instances.get(name);
    if (inst) inst.stop();
    this.instances.delete(name);
  }

  // ------------------------------------------------------------
  //  Start / Stop
  // ------------------------------------------------------------
  public start(): void {
    if (this.watcher) return;

    /** 🔥 NE PASSER À CHOKIDAR QUE des opts validés */
    const chokidarOpts: ChokidarOptions = {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: false,
      ...(this.opts.chokidar || {}),
    };

    this.console.trace(chokidarOpts);

    this.watcher = chokidar.watch(this.opts.paths, chokidarOpts);

    /** 🔥 Brancher l’unique handler ALL */
    if (this.opts.onEvent) {
      this.watcher.on("all", (event, file) => {
        try {
          this.opts.onEvent!(event, file);
        } catch (err) {
          this.console.error(`❌ WatcherEngine "${this.name}" callback error :\n${err}`);
        }
      });
    }

    /** 🔥 ready */
    if (this.opts.onReady) {
      this.watcher.on("ready", this.opts.onReady!);
    }

    this.console.info(`👁️ WatcherEngine "${this.name}" started`);
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.console.info(`🛑 WatcherEngine "${this.name}" stopped`);
    }
  }

  public isRunning(): boolean {
    return this.watcher !== null;
  }
}
