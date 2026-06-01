import reactConfig from "@repo/eslint-config/react.js";

export default [
  ...reactConfig,
  {
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
