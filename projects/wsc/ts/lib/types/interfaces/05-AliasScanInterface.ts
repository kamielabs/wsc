export interface AliasScan {
  file: string;                       // tsconfig.paths.json utilisé
  allAliases: Record<string, string[]>; // Tous les alias (sauf @root)
  flatAliases: Record<string, string[]>; // Alias sans wildcard
  resolvedDirs: string[];             // Résolution brute: pkgRoot + value[0]
}