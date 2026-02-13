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
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
    },
    ignores: [
      "**/.next/**",
      "**/apps/web/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.config.*",
      "**/jest.config.*",
      "**/next-env.d.ts",
      "**/packages/scripts/**",
      "**/packages/db/seed.ts"
    ],
    rules: {
      "no-console": "off", // logs are fine in backend/scripts
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/ban-ts-comment": "off", // allow @ts-ignore
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          groups: [["builtin", "external", "internal"]],
          "newlines-between": "always",
        },
      ],
    },
    
  },
  {
    files: ["**/.next/**", "**/apps/web/.next/**", "**/tests/k6/**"],
    rules: {
      // generated files and k6 scripts are excluded from strict TS rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
    },
  },
];
