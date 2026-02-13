/**
 * Backend Server Entry Point
 * 
 * Modular API server for Modheshwari community management platform.
 * 
 * Architecture:
 * - server/handlers.ts: Re-exports all route handlers
 * - server/authRoutes.ts: Authentication routes (signup/login)
 * - server/staticRoutes.ts: Fixed-path API routes
 * - server/parameterizedRoutes.ts: Dynamic routes with params
 * - server/router.ts: Main request routing logic
 */

import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

import { router } from "./server/router";
import { logger } from "./lib/logger";

// Load environment variables
config({ path: join(process.cwd(), "../../.env") });

const PORT = parseInt(process.env.PORT || "3001");

// Start server
serve({
  port: PORT,
  fetch: router,
});

console.log(` Server running on http://localhost:${PORT}`);
logger.info(`Server running on http://localhost:${PORT}`);

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gracefully (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down gracefully (SIGTERM)");
  process.exit(0);
});

// Expose default metrics and ensure metrics collection started
try {
  // metrics import already calls collectDefaultMetrics
  logger.info('Prometheus metrics initialized');
} catch (err) {
  logger.warn('Failed to initialize Prometheus metrics', err);
}

// Keep process alive
await new Promise(() => {});
