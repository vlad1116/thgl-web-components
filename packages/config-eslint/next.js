const baseConfig = require("./base.js");
const nextPlugin = require("@next/eslint-plugin-next");

/**
 * Flat config for the Next.js `games-web` app. Migrated from the previous
 * `next.js` eslintrc. `@next/eslint-plugin-next` v16 ships flat configs; we
 * extend its `core-web-vitals` set (which includes `recommended`).
 *
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = [
  ...baseConfig,
  nextPlugin.flatConfig
    ? nextPlugin.flatConfig.coreWebVitals
    : nextPlugin.configs["core-web-vitals"],
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "error",
    },
  },
];
