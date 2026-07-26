// eslint.config.js

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.config.*",
      "**/jest.config.*",
      "**/apps/web/nextEnv.d.ts",
      "**/packages/scripts/**",
      "**/packages/db/seed.ts",
      "**/scripts/test-auth.js",
      "**/tests/k6/**",
      "**/.eslintignore",
    ],
  },
  {
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/ban-ts-comment": "off",
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal"],
          "newlines-between": "always",
        },
      ],
    },
  },
];
