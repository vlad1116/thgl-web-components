/**
 * Vite `define` entries for the `process.env.NEXT_PUBLIC_*` reads in
 * src/config.ts. Vite doesn't shim `process` in the browser, so every
 * Vite app consuming @repo/lib must register this in its vite.config.ts:
 *
 *   import { thglEnvDefine } from "@repo/lib/vite-define";
 *   export default defineConfig({ define: thglEnvDefine(), ... });
 *
 * Without it the config module throws "process is not defined" at startup.
 * Unset vars are replaced with `null`, so the prod URL fallbacks apply.
 * NEXT_PUBLIC_FORGE_DEV_PROXY is intentionally NOT forwarded — the
 * same-origin proxy paths only work when served by games-web's dev server.
 */
export function thglEnvDefine() {
  const keys = [
    "NEXT_PUBLIC_TH_GL_URL",
    "NEXT_PUBLIC_API_FORGE_URL",
    "NEXT_PUBLIC_DATA_FORGE_URL",
    "NEXT_PUBLIC_DATA_FORGE_CDN_URL",
  ];
  return Object.fromEntries([
    ...keys.map((key) => [
      `process.env.${key}`,
      JSON.stringify(process.env[key] ?? null),
    ]),
    ["process.env.NEXT_PUBLIC_FORGE_DEV_PROXY", "null"],
  ]);
}
