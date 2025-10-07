
/**
 * ESLint Configuration for Web Application
 * 
 * Applies the shared Next.js ESLint configuration from the monorepo's
 * eslint-config package to the web application.
 * 
 * This configuration provides:
 * - TypeScript linting rules
 * - React and React Hooks best practices
 * - Next.js specific rules
 * - Prettier compatibility
 * - Turborepo environment variable validation
 * 
 * @module ESLintConfig
 * @see {@link packages/eslint-config/next-js.js} for the base configuration
 */

import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */

/**
 * ESLint configuration array for the web application
 * @type {import("eslint").Linter.Config[]}
 */
export default nextJsConfig;
