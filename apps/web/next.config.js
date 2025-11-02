/** @type {import('next').NextConfig} */

/**
 * Next.js Configuration
 *
 * Main configuration file for the Next.js web application.
 * Controls build behavior, optimization settings, routing, and more.
 *
 * This configuration can be extended to include:
 * - Custom webpack configuration
 * - Image optimization settings
 * - Environment variables
 * - Redirects and rewrites
 * - Internationalization (i18n)
 * - Output configuration
 * - Experimental features
 *
 * @module NextConfig
 * @see {@link https://nextjs.org/docs/app/api-reference/next-config-js} for available options
 *
 * @example
 * // Adding custom webpack configuration
 * const nextConfig = {
 *   webpack: (config, { isServer }) => {
 *     // Custom webpack config
 *     return config;
 *   }
 * };
 *
 * @example
 * // Configuring image domains
 * const nextConfig = {
 *   images: {
 *     domains: ['example.com'],
 *   }
 * };
 */

/**
 * Next.js configuration object
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_BASE_URL: "http://localhost:3001/api",
  },
};

export default nextConfig;
