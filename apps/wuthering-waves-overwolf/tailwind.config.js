import sharedConfig from "@repo/tailwind-config";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  presets: [sharedConfig],
  plugins: [],
};
