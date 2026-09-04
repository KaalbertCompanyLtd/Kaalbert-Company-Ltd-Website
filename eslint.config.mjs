import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    rules: {
      // ADR 0001: no product owns the admin UI/data model/routes — flag any accidental
      // dependency on a CMS/admin-kit package before it lands.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next-cms", message: "No CMS product — see ADR 0001." },
            { name: "payload", message: "No CMS product — see ADR 0001." },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "public/**",
    "ui/mockups/**",
    "next-env.d.ts",
    "generated/**",
  ]),
]);

export default eslintConfig;
