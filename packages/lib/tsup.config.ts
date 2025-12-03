import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entryPoints: [
    "src/index.ts",
    "src/server/index.ts",
    "src/overwolf/index.ts",
    "src/thgl-app/index.ts",
  ],
  dts: true,
  format: ["esm"],
  target: "es2022", // ES2022 for top-level await support
  external: ["next"],
  ...options,
}));
