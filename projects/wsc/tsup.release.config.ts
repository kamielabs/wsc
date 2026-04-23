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
    "@projects/core"
  ],
  define: {
    "process.env._NODE_CLI_STAGE": JSON.stringify("release")
  }
});
