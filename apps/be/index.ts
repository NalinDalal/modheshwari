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
// Initialize metrics (collectDefaultMetrics called on import)
import "./lib/metrics";
// Register prisma -> elasticsearch indexing hooks (if ES configured)
try {
  // import lazily so app can still start if dependencies not installed
  // or environment variables not present during dev
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { registerPrismaIndexHooks } = require("./lib/prisma-index-hooks");
  registerPrismaIndexHooks();
  logger.info('Prisma index hooks registered');
} catch (err) {
  logger.warn('Prisma index hooks not registered (elastic client may be unavailable)', err);
}

// Workers
import startNotificationDrain from "./kafka/workers/notification-drain";
import startDLQRetryWorker from "./kafka/workers/notification-dlq-retry";

// Load environment variables
config({ path: join(process.cwd(), "../../.env") });

const PORT = parseInt(process.env.PORT || "3001");

// Start server
serve({
  port: PORT,
  fetch: router,
});

logger.info(`Server running on http://localhost:${PORT}`);

// Start background workers after server is up
let drainHandle: { stop?: () => void } | null = null;
let dlqHandle: { stop?: () => void } | null = null;

drainHandle = startNotificationDrain();
dlqHandle = startDLQRetryWorker();

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`Shutting down gracefully (${signal})`);
  try {
    drainHandle?.stop?.();
    dlqHandle?.stop?.();
  } catch (e) {
    logger.warn('Error stopping background workers', e);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Expose default metrics and ensure metrics collection started
try {
  // metrics import already calls collectDefaultMetrics
  logger.info('Prometheus metrics initialized');
} catch (err) {
  logger.warn('Failed to initialize Prometheus metrics', err);
}

// Keep process alive
await new Promise(() => {});
