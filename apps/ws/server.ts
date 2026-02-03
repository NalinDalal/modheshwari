import { serve } from "bun";

import type { WSData } from "./types";
import { WS_PORT } from "./config";
import { authenticate } from "./utils";
import { handleOpen, handleMessage, handleClose } from "./handlers";
import { startKafkaConsumer, consumer } from "./kafka";
import { logger } from "./logger";

export const server = serve<WSData>({
  port: WS_PORT,
  async fetch(req) {
    if (req.headers.get("upgrade") === "websocket") {
      const userId = authenticate(req);
      if (!userId) {
        return new Response("Unauthorized", { status: 401 });
      }

      server.upgrade(req, {
        data: { userId, lastSeen: Date.now() } satisfies WSData,
      });
      return;
    }

    const { pathname } = new URL(req.url);
    if (pathname === "/health") {
      return Response.json({ status: "ok", service: "ws" });
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open: handleOpen,
    message: handleMessage,
    close: handleClose,
  },
});

/**
 * Start the WebSocket server.
 */
export async function startServer() {
  await startKafkaConsumer().catch((err) => {
    logger.error("Failed to start consumer", err instanceof Error ? err : String(err));
    process.exit(1);
  });

  logger.info(`server running on ws://localhost:${WS_PORT}`);
}

/**
 * Gracefully shutdown server.
 */
export async function shutdown() {
  logger.info("shutting down...");
  try {
    await consumer.disconnect();
  } catch (err) {
    logger.error("consumer disconnect failed", err instanceof Error ? err : String(err));
  }
  server.stop(true);
  process.exit(0);
}
