export interface PathsScan {
  file: string; // chemin du tsconfig.paths.json
  paths: Record<string, string[]>; // Alias -> valeurs brutes du tsconfig
}
