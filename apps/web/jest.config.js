
/**
 * Jest Configuration for Web Application
 * 
 * Configures Jest testing framework for the web application with TypeScript support.
 * Tests are located in __tests__ directories and must have a .test.ts extension.
 * 
 * Configuration details:
 * - Uses ts-jest preset for TypeScript transformation
 * - Runs tests in Node.js environment
 * - Only matches files in __tests__ directories with .test.ts extension
 * 
 * @module JestConfig
 * @see {@link https://jestjs.io/docs/configuration} for available options
 */

/**
 * Jest configuration object
 * @type {import('@types/jest').Config}
 */
module.exports = {
  /** 
   * Uses ts-jest preset for TypeScript support
   * Automatically handles .ts and .tsx files
   */
  preset: 'ts-jest',
  
  /** 
   * Test environment simulates Node.js
   * Use 'jsdom' if testing browser-specific code
   */
  testEnvironment: 'node',
  
  /** 
   * Pattern to match test files
   * Only runs files in __tests__ directories with .test.ts extension
   */
  testMatch: ['**/__tests__/**/*.test.ts'],
};
