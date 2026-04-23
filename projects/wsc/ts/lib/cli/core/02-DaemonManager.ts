import fs from "fs";
import { ExecManager } from "@core";
import { DaemonOptions, DaemonSpec, ExecContextType } from "@interfaces";
import { spawn } from "child_process";

export class DaemonManager {
    private static instances: Record<string, DaemonManager> = {};
    private _spec: DaemonSpec
    private _devctx?:ExecContextType|undefined;
    

    private constructor(spec: DaemonSpec, devctx?: ExecContextType) {
        this._spec = spec;
        devctx ? this._devctx = devctx : this._devctx = undefined
    }

    /** Retrieve or create a scoped instance */
    public static getInstance(name: string, specs?: DaemonOptions,  devctx?: ExecContextType): DaemonManager {
        if (!this.instances[name]) {
            if(!specs) throw new Error("Daemon doesn't exists, and no specs provided")
            this.instances[name] = new DaemonManager({ name, ...specs }, devctx);
        }
        return this.instances[name];
    }

    private get isDaemon(): boolean {
        return process.env[this._spec.envVar] === "1";
    }

    private get pid(): number | undefined {
        if (!fs.existsSync(this._spec.pidFile)) return undefined;
        try {
            return parseInt(fs.readFileSync(this._spec.pidFile, "utf-8"), 10);
        } catch {
            return undefined;
        }
    }

    private spawnSelf(): never {
        const ctx = this._devctx ? this._devctx : ExecManager.getInstance().context;

        const runtime = ctx.runtimeExe;
        const entryScript = process.argv[1]!;
        const args = process.argv.slice(2);

        console.log(runtime, entryScript, args, this._spec.envVar);

        const child = spawn(
            runtime,
            [entryScript, ...args],
            {
                cwd: ctx.execCwd,
                detached: true,
                stdio: "ignore",
                env: {
                    ...process.env,
                    [this._spec.envVar]: "1",
                }
            }
        );        

        child.unref();
        process.exit(0); // parent dies instantly
    }

    isRunning(): boolean {
        const pid = this.pid;
        if (!pid) return false;
        try { return process.kill(pid, 0); }
        catch { return false; }
    }

    writePid(): void {
        fs.writeFileSync(this._spec.pidFile, `${process.pid}`);
    }

    removePid(): void {
        try { fs.unlinkSync(this._spec.pidFile); } catch {}
    }

    // -----------------------------------------------------
    // START
    // -----------------------------------------------------
    start(): void | never {
        if (!this.isDaemon) {
            if(this.isRunning()) {
                console.log('⚠️ daemon already started ');
                return
            }
            // Launch new daemon
            this.spawnSelf();
        }

        // On entre dans le daemon à partir d'ici
        this.writePid();
        console.log(`🟢 Daemon '${this._spec.name}' started (pid ${process.pid})`);

        // 💡 EXECUTE SYNC COMMAND → DOIT BLOQUER
        try {
            this._spec.command();
        } catch (err) {
            console.error(`❌ Daemon '${this._spec.name}' crashed:`, err);
        }
        // fallback keep-alive si command() rend la main
        while (true) {
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
        }

    }

    // -----------------------------------------------------
    // STOP
    // -----------------------------------------------------
    stop(): boolean {
        const pid = this.pid;
        if (!pid) return false;

        try {
            if (process.kill(pid, 0)) process.kill(pid);
            this.removePid();
            return true;
        } catch {
            return false;
        }
    }

    // -----------------------------------------------------
    // STATUS
    // -----------------------------------------------------
    status(): "running" | "stopped" {
        return this.isRunning() ? "running" : "stopped";
    }

    restart(): never {
        this.stop();
        return this.start() as never;
    }
}
