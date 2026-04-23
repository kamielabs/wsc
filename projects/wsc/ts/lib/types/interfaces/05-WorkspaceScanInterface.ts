export interface WorkspaceScan {
  wsRoot: string;
  tsconfigs: string[];     // fichiers tsconfig.paths.json trouvés
  wsWatchPaths: string[];    // N1 utilise ça
  entries: string[];         // les valeurs brutes du YAML (utile pour debug / évolutions)
}
