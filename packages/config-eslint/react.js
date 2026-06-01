const baseConfig = require("./base.js");
const reactRefreshImport = require("eslint-plugin-react-refresh");
const reactRefresh = reactRefreshImport.default ?? reactRefreshImport;

/**
 * Flat config for React libraries / Vite (Overwolf) apps. Migrated from the
 * previous `react.js` eslintrc.
 *
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = [
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
