import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["ts/wsc.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: true,
  minify: false,
  external: ["chalk", "fs-extra"],
  skipNodeModulesBundle: false,
  noExternal: [
    "@projects/core"
  ]
});
