import { z } from "zod";
import { WatcherBaseSchema } from "@schemas";

// uniquement pour validation simple
export type WatcherBase = z.infer<typeof WatcherBaseSchema>;

/** 🌱 Leaf watcher — exécute une callback sur chaque événement */
export interface LeafWatcher extends WatcherBase {
  onEvent: (event: string, file: string) => void;
}

/** 🌳 Composite watcher avec 1 enfant */
export interface CompositeOneWatcher extends WatcherBase {
  children: () => Watcher; // ⚠️ retourne une CONFIG, pas un FSWatcher
}

/** 🌲🌲 Composite watcher avec plusieurs enfants */
export interface CompositeManyWatcher extends WatcherBase {
  children: () => Watcher[];
}

/** 🌐 Union */
export type Watcher =
  | LeafWatcher
  | CompositeOneWatcher
  | CompositeManyWatcher;