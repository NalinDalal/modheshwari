
/**
 * React ESLint Configuration
 * 
 * Extended ESLint configuration for React libraries and applications within the monorepo.
 * Builds upon the base configuration with React-specific rules and plugins.
 * 
 * This configuration includes:
 * - All base ESLint rules
 * - React recommended rules (eslint-plugin-react)
 * - React Hooks rules (eslint-plugin-react-hooks)
 * - Browser and Service Worker globals
 * - Automatic React version detection
 * - Disables unnecessary React import requirement (for new JSX transform)
 * 
 * @module ReactESLintConfig
 * @see {@link https://react.dev/learn/editor-setup#linting} for React ESLint setup
 * @see {@link https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html} for new JSX transform
 */

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]} */

/**
 * A custom ESLint configuration for libraries that use React.
 * 
 * Configuration layers (applied in order):
 * 1. Base configuration (TypeScript, Turborepo, etc.)
 * 2. JavaScript recommended rules
 * 3. Prettier compatibility
 * 4. TypeScript recommended rules
 * 5. React recommended rules
 * 6. Browser and Service Worker globals
 * 7. React Hooks rules with custom overrides
 * 
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  // Include base configuration
  ...baseConfig,
  
  // Apply JavaScript recommended rules
  js.configs.recommended,
  
  // Disable rules that conflict with Prettier
  eslintConfigPrettier,
  
  // Apply TypeScript recommended rules
  ...tseslint.configs.recommended,
  
  // Apply React recommended rules
  pluginReact.configs.flat.recommended,
  
  // Configure language options and global variables
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        // Add Service Worker APIs
        ...globals.serviceworker,
        // Add browser APIs (window, document, etc.)
        ...globals.browser,
      },
    },
  },
  
  // React Hooks plugin and custom rules
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { 
      /**
       * Automatically detect React version
       * Ensures rules match the installed React version
       */
      react: { version: "detect" } 
    },
    rules: {
      // Apply recommended React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      
      /**
       * Disable React import requirement
       * React 17+ with new JSX transform doesn't require React in scope
       * @see {@link https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html}
       */
      "react/react-in-jsx-scope": "off",
    },
  },
];
