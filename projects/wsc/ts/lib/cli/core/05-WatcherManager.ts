// ts/lib/core/WatcherManager.ts
import { ConsoleManager, WatcherEngine, WatcherEngineOptions } from "@core";

export class WatcherManager {
  private static instance: WatcherManager;
  private watchers = new Map<string, WatcherEngine>();
  private console = ConsoleManager.getInstance();

  private constructor() {
    this.console.trace(`[init] WatcherManager constructed`);
  }

  public static getInstance(): WatcherManager {
    if (!this.instance) this.instance = new WatcherManager();
    return this.instance;
  }

  // ------------------------------------------------------------
  //  CRUD watchers
  // ------------------------------------------------------------
  public create(name: string, opts: WatcherEngineOptions): WatcherEngine {
    if (this.watchers.has(name)) return this.watchers.get(name)!;

    const engine = WatcherEngine.getInstance(name, opts);
    this.watchers.set(name, engine);
    return engine;
  }

  public start(name: string): void {
    const engine = this.watchers.get(name);
    if (!engine) throw new Error(`Watcher "${name}" introuvable`);
    engine.start();
  }

  public stop(name: string): void {
    const engine = this.watchers.get(name);
    if (!engine) return;
    engine.stop();
  }

  public destroy(name: string): void {
    const engine = this.watchers.get(name);
    if (!engine) return;

    engine.stop();
    this.watchers.delete(name);
  }

  public stopAll(): void {
    for (const w of this.watchers.values()) w.stop();
  }
}
