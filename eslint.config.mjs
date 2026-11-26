import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import culua from "./eslint-rules/index.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    files: ["app/**/*.{ts,tsx,mjs}", "context/**/*.{ts,tsx}", "utils/**/*.{ts,tsx,mjs}"],
    plugins: { culua },
    rules: {
      "culua/no-new-effects": "error",
      "culua/no-new-timers": "error",
      "culua/no-player-key": "error",
      "culua/no-direct-storage": "error",
      "culua/no-server-import-in-client": "error",
      "culua/no-changelog-comments": "error",
      "culua/disable-needs-reason": "error",
    },
  },
  {
    files: ["tests/**/*.mjs"],
    rules: {
      "react-hooks/globals": "off",
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/workbox-*.js",
    "artifacts/**",
  ]),
]);

export default eslintConfig;
