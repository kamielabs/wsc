import { WATCHER_PID_FILE, WS_DIR } from "@constants";
import { ConsoleManager, DaemonManager, ExecManager } from "@core";
import path from "path";
import { WorkspaceWatcherService } from "./watcher";

export class WatcherOrchestrator {
  private Console = ConsoleManager.getInstance();
  private Exec = ExecManager.getInstance();
  private watcherDaemon = DaemonManager.getInstance("watcher", {
    envVar: "CLI_WATCHER_DAEMON",
    pidFile: path.join(this.Exec.context.execWsRoot, WS_DIR, WATCHER_PID_FILE),
    command: () => WorkspaceWatcherService.getInstance().start()
  });

  constructor() {
    this.Console.trace(`[init] ${this.constructor.name} ready`);
  }

  start() {
    this.watcherDaemon.start();
  }

  stop() {
    if (!this.watcherDaemon.isRunning()) {
      this.Console.warn("ℹ️ Aucun watcher actif.");
      return;
    }
    this.watcherDaemon.stop();
  }

  status() {
    this.Console.info(
      this.watcherDaemon.isRunning()
        ? "🟢 Watcher actif."
        : "🔴 Watcher désactivé."
    );
  }

  restart() {
    this.stop();
    this.start();
  }
}
