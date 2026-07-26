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
import "./lib/metrics";
import startNotificationDrain from "./kafka/workers/notificationDrain";
import startDLQRetryWorker from "./kafka/workers/notificationDLQ";

async function registerPrismaHooks() {
    try {
        const { registerPrismaIndexHooks } = await import("./lib/prisma-index-hooks");
        registerPrismaIndexHooks();
        logger.info('Prisma index hooks registered');
    } catch (err) {
        logger.warn('Prisma index hooks not registered (elastic client may be unavailable)', err);
    }
}

registerPrismaHooks();

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
};

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
await new Promise(() => { });
