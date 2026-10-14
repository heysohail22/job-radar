import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["mobile/**/*.{ts,tsx,cjs}"],
    rules: {
      // Metro requires static require() calls for bundled assets and config.
      "@typescript-eslint/no-require-imports": "off",
      // Native event callbacks are passed through render helpers; these refs
      // are read only when the event runs, never during rendering.
      "react-hooks/refs": "off",
      // Feed loading deliberately resets loading/data at an external API boundary.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "website/.next/**",
    "website/next-env.d.ts",
    "website/node_modules/**",
    "next-env.d.ts",
    "mobile/node_modules/**",
    "mobile/.expo/**",
    "mobile/dist/**",
  ]),
]);
