
/**
 * Base ESLint Configuration
 * 
 * Shared ESLint configuration used across all packages in the monorepo.
 * Provides TypeScript linting, Prettier compatibility, and Turborepo integration.
 * 
 * This configuration includes:
 * - JavaScript recommended rules (@eslint/js)
 * - TypeScript recommended rules (typescript-eslint)
 * - Prettier compatibility (eslint-config-prettier)
 * - Turborepo environment variable validation (eslint-plugin-turbo)
 * - Only warnings mode (eslint-plugin-only-warn)
 * - Ignores dist directories
 * 
 * @module BaseESLintConfig
 * @see {@link https://typescript-eslint.io/} for TypeScript ESLint docs
 * @see {@link https://turbo.build/repo/docs/reference/eslint} for Turbo plugin docs
 */

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */

/**
 * A shared ESLint configuration for the repository.
 * 
 * Configuration layers (applied in order):
 * 1. JavaScript recommended rules
 * 2. Prettier compatibility (disables conflicting rules)
 * 3. TypeScript recommended rules
 * 4. Turborepo plugin with environment variable validation
 * 5. Only warn plugin (converts errors to warnings)
 * 6. Ignore patterns for build output
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  // Apply JavaScript recommended rules
  js.configs.recommended,
  
  // Disable rules that conflict with Prettier
  eslintConfigPrettier,
  
  // Apply TypeScript recommended rules
  ...tseslint.configs.recommended,
  
  // Turborepo plugin configuration
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      /**
       * Warns when environment variables are used without being declared
       * Helps catch missing env vars in Turborepo pipeline configuration
       */
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  
  // Convert all errors to warnings
  {
    plugins: {
      onlyWarn,
    },
  },
  
  // Ignore compiled output directories
  {
    ignores: ["dist/**"],
  },
];
