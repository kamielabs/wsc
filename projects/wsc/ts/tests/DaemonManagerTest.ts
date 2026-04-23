import { DaemonManager } from "@core";   // ton fichier DaemonManager.ts
import { ExecContextType } from "@interfaces";
import path from "path";

// ------------------------------------------------------------
// 1) Fake ExecContext FOR TEST ONLY
// ------------------------------------------------------------
const fakeCtx: ExecContextType = {
    scriptMode: "dev",
    envMode: "dev",

    runtimeExe: "tsx", // Node actuel → parfait pour tests
    cliRoot: process.cwd(),
    physicalWsRoot: process.cwd(),
    execWsRoot: process.cwd(),
    execCwd: process.cwd(),
    cwd: process.cwd(),

    wscFile: "",
    wscVars: {}
};


// ------------------------------------------------------------
// 2) Préparer un PIDFILE TEMP
// ------------------------------------------------------------
const PID_FILE = path.join(process.cwd(), "test-daemon.pid");

//try { fs.unlinkSync(PID_FILE); } catch {}


// ------------------------------------------------------------
// 3) Déclaration du DAEMON
// ------------------------------------------------------------

const manager = DaemonManager.getInstance("testDaemon",
    {
        pidFile: PID_FILE,
        envVar: "CLI_TEST_DAEMON",
        command: () => setInterval(() => {}, 1000), // juste un placeholder
    },
    fakeCtx // <-- IMPORTANT : on injecte, donc aucun ExecManager utilisé
);


// ------------------------------------------------------------
// 4) TESTS MANUELS
// ------------------------------------------------------------

console.log("\n=== STATUS INIT ===");
console.log("status:", manager.status());  // → "stopped"

console.log("\n=== START ===");
manager.start();   // si pas daemon → spawnSelf() → exit process !!!

console.log("\n=== STOP ===");
manager.stop();   // si pas daemon → spawnSelf() → exit process !!!

console.log("\n=== CE MESSAGE NE S'AFFICHE PAS ===");
