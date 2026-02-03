/**
 * WebSocket Server Entry Point
 * 
 * Modular WebSocket server for real-time notifications and chat.
 * 
 * Architecture:
 * - config.ts: Environment configuration
 * - types.ts: TypeScript type definitions
 * - utils.ts: Authentication, rate limiting, socket management
 * - kafka.ts: Kafka consumer for notifications
 * - handlers.ts: WebSocket event handlers (open, message, close)
 * - server.ts: Server setup and lifecycle management
 */

import { startServer, shutdown } from "./server";

// Start the server
startServer();

// Handle graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);