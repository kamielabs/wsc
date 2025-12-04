import chokidar from "chokidar";
import path from "path";

const WS = "/home/kame/local/dev/sandboxes/wsc-sb";

console.log("=== TEST WATCHER CHOKIDAR ===");

const watcher = chokidar.watch(WS, {
    
    ignored: (file) => {
        const p = file.replace(/\\/g, "/");

        return (
            p.includes("/node_modules/") ||
            p.includes("/.pnpm/") ||
            p.includes("/.git/") ||
            p.includes("/dist/") ||
            p.includes("/release/")
        );
    },

    persistent: true,
    ignoreInitial: false, // très important pour voir le "add" initial

    depth: 50
});

watcher
    .on("ready", () => console.log("[ready] Watcher opérationnel"))
    .on("all", (evt, file) => console.log(`[ALL] ${evt} => ${file}`))
    .on("error", (err) => console.error("[ERR]", err));
