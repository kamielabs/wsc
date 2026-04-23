// ts/watcher.ts
import chokidar, { FSWatcher } from "chokidar";
import { WatcherBaseSchema } from "@schemas";
import {
    WatcherBase,
    LeafWatcher,
    CompositeOneWatcher,
    CompositeManyWatcher,
    Watcher
} from "@interfaces";

/* -------------------------------------------------------
   📌 Surcharges
------------------------------------------------------- */
export function watcher(options: LeafWatcher): FSWatcher;
export function watcher(options: CompositeOneWatcher): FSWatcher;
export function watcher(options: CompositeManyWatcher): FSWatcher[];
export function watcher(options: Watcher): FSWatcher | FSWatcher[] {
    // 1. Validation de base Zod
    WatcherBaseSchema.parse(options);

    console.log("[watcher] creating watcher on paths=", options.paths);

    // 2. Dispatch selon le type
    if ("onEvent" in options) {
        return createLeafWatcher(options);
    }

    if ("children" in options) {
        const result = options.children();

        if (Array.isArray(result)) {
            // Ici TS SAIT que options est un CompositeManyWatcher
            const manyOptions = options as CompositeManyWatcher;
            return createCompositeManyWatcher(manyOptions, result);
        }

        // Ici TS SAIT que options est un CompositeOneWatcher
        const oneOptions = options as CompositeOneWatcher;
        return createCompositeOneWatcher(oneOptions, result);
    }


    // Fallback théorique
    throw new Error("Watcher invalide : aucune signature valide détectée.");
}

function restartChild(child: Watcher): FSWatcher | FSWatcher[] {
  if ("children" in child) {
    const result = child.children();
    if (Array.isArray(result)) {
      return createCompositeManyWatcher(child as CompositeManyWatcher, result);
    }
    return createCompositeOneWatcher(child as CompositeOneWatcher, result);
  }

  // Leaf
  return createLeafWatcher(child as LeafWatcher);
}



/* -------------------------------------------------------
   🌱 Leaf watcher — watcher final
------------------------------------------------------- */
function createLeafWatcher(options: LeafWatcher): FSWatcher {
    const {
        paths,
        when= "all",
        filters = [],
        ignore = [],
        depth = Infinity,
        debounce = 0,
        onEvent,
    } = options;

    let debounceTimer: NodeJS.Timeout | null = null;

    const w = chokidar.watch(paths, {
        persistent: true,
        ignoreInitial: true,
        depth,
        ignored: ignore,
    });

    // handler compatible avec tous les events
    const handler = (event: string, filePath: string) => {
        if (filters.length > 0) {
        const ok = filters.some((f) => filePath.endsWith(f));
        if (!ok) return;
        }

        if (debounce > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => onEvent(event, filePath), debounce);
        } else {
        onEvent(event, filePath);
        }
    };

    // TS choke ? On caste la signature proprement
    w.on(when, handler);

  return w;
}

/* -------------------------------------------------------
   🌳 Composite watcher — 1 enfant
------------------------------------------------------- */
function createCompositeOneWatcher(
  parent: CompositeOneWatcher,
  child: Watcher
): FSWatcher {
  const parentWatcher = createBaseWatcher(parent, () => {
    // 🔁 Log custom si demandé
    if (parent.restartMsg) {
      console.log(parent.restartMsg);
    }

    // Restart child watcher selon son vrai type
    restartChild(child);
  });

  // Création initiale (⚠️ sans message de restart)
  restartChild(child);

  return parentWatcher;
}



/* -------------------------------------------------------
   🌲🌲 Composite watcher — plusieurs enfants
------------------------------------------------------- */
function createCompositeManyWatcher(
  parent: CompositeManyWatcher,
  children: Watcher[]
): FSWatcher[] {
  const parentWatcher = createBaseWatcher(parent, () => {
    // 🔁 Log custom si demandé
    if (parent.restartMsg) {
      console.log(parent.restartMsg);
    }

    children.forEach((c) => restartChild(c));
  });

  // Création initiale des enfants (sans message de restart)
  const childWatchers = children.flatMap((c) => restartChild(c));

  return [parentWatcher, ...childWatchers];
}



/* -------------------------------------------------------
   🧱 Base watcher logic (commun aux Composite)
------------------------------------------------------- */
function createBaseWatcher(
  options: WatcherBase,
  handler: () => void
): FSWatcher {
    const {
        paths,
        when="all",
        filters = [],
        ignore = [],
        depth = Infinity,
        debounce = 0,
    } = options;

    let debounceTimer: NodeJS.Timeout | null = null;

    const w = chokidar.watch(paths, {
        persistent: true,
        ignoreInitial: true,
        depth,
        ignored: ignore,
    });

    // handler compatible avec tous les events
    const _handler = (event: string, filePath: string) => {
        if (filters.length > 0) {
        const ok = filters.some((f) => filePath.endsWith(f));
        if (!ok) return;
        }

        if (debounce > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(handler, debounce);
        } else {
            handler();
        }
    };

    w.on(when, _handler);

    return w;
}
