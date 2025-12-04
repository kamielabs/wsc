import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["ts/wsc.ts"],
  outDir: "release",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: true,
  minify: false,
  external: [],
  skipNodeModulesBundle: false,
  noExternal: [
    "@shared/core"
  ],
  define: {
    "process.env.WSC_SCRIPT_MODE": JSON.stringify("release")
  }
});
