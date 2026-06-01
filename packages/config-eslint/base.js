const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const turboConfigImport = require("eslint-config-turbo/flat");
const turboConfig = turboConfigImport.default ?? turboConfigImport;
const onlyWarn = require("eslint-plugin-only-warn");
const eslintConfigPrettier = require("eslint-config-prettier");
const reactHooks = require("eslint-plugin-react-hooks");
const globals = require("globals");

/**
 * Shared ESLint flat config (ESLint 10 dropped the legacy `.eslintrc`
 * format). Migrated from the previous `index.js` eslintrc. The old
 * `import/*` rules and resolver are intentionally dropped: their plugin
 * (`eslint-plugin-import`) was never installed, so those rules never ran.
 *
 * `eslint-plugin-only-warn` downgrades every rule to a warning, preserving
 * the previous "advisory" linting behaviour.
 *
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = [
  {
    ignores: ["node_modules/**", "dist/**", ".next/**", "**/*.css"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...turboConfig,
  eslintConfigPrettier,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: { "only-warn": onlyWarn, "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.node, React: true, JSX: true },
    },
    // Keep the two classic hook rules that `next lint` provided; v7's full
    // recommended set adds many opinionated React-Compiler rules we don't
    // opt into here.
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
