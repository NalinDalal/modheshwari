/**
 * Notification Read Tracking API
 * 
 * Handles marking notifications as read and publishing read events
 * to Kafka to trigger escalation cancellation.
 */

import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils";

import { kafka } from "../kafka/config";

const producer = kafka.producer();

// Track producer readiness
let producerReady = false;
let connectionPromise: Promise<void> | null = null;

/**
 * Ensure producer is connected before sending
 */
async function ensureProducerConnected() {
  if (producerReady) return;
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = (async () => {
    try {
      await producer.connect();
      producerReady = true;
    } catch (error) {
      throw new Error("Kafka producer connection failed");
    }
  })();

  try {
    await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }

  connectionPromise = null;
}

/**
 * Publish notification read event to Kafka
 * This triggers the escalation worker to cancel pending escalations
 */
async function publishReadEvent(notificationId: string, userId: string) {
  try {
    // Ensure producer is connected
    await ensureProducerConnected();

    await producer.send({
      topic: "notification.read",
      messages: [
        {
          key: notificationId,
          value: JSON.stringify({
            notificationId,
            userId,
            readAt: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (error) {
    // Don't fail the request if Kafka publish fails
  }
}

/**
 * Mark a notification as read
 * POST /api/notifications/:id/read
 */
export async function handleMarkAsRead(req: Request, id: string): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;
    const notificationId = id;

    // Update notification as read
    const notification = await prisma.$transaction((tx) =>
      tx.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
    );

    // Publish read event to Kafka to cancel escalations
    await publishReadEvent(notificationId, userId as string);

    return new Response(
      JSON.stringify({
        success: true,
        notification: {
          id: notification.id,
          read: notification.read,
          readAt: notification.readAt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Check if error is Prisma record-not-found
    const isNotFound = 
      error && 
      typeof error === "object" && 
      "code" in error && 
      error.code === "P2025";
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to mark notification as read",
      }),
      {
        status: isNotFound ? 404 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Mark multiple notifications as read
 * POST /api/notifications/read-multiple
 */
export async function handleMarkMultipleAsRead(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;
    const body = await req.json();
    const { notificationIds } = body as { notificationIds: string[] };

    if (!Array.isArray(notificationIds)) {
      return new Response(JSON.stringify({ error: "notificationIds must be an array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update all notifications as read
    const [result, updatedNotifications] = await prisma.$transaction([
      prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId, // Ensure user can only mark their own notifications
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
      prisma.notification.findMany({
        where: {
          id: { in: notificationIds },
          userId,
          read: true,
          readAt: { not: null },
        },
        select: { id: true },
      }),
    ]);

    const updatedIds = updatedNotifications.map(n => n.id);
    await Promise.all(updatedIds.map((id: string) => publishReadEvent(id, userId)));

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: result.count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to mark notifications as read",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Mark all notifications as read for a user
 * POST /api/notifications/read-all
 */
export async function handleMarkAllAsRead(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;

    // Get all unread notification IDs
    const [unreadNotifications, result] = await prisma.$transaction([
      prisma.notification.findMany({
        where: {
          userId,
          read: false,
        },
        select: { id: true },
      }),
      prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
    ]);

    // Publish read events
    await Promise.all(unreadNotifications.map((notif: { id: string }) => publishReadEvent(notif.id, userId)));

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: result.count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to mark all notifications as read",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Get delivery status for a notification (for debugging/monitoring)
 * GET /api/notifications/:id/delivery-status
 */
export async function handleGetDeliveryStatus(req: Request, id: string): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;
    const notificationId = id;

    // Get notification with deliveries
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      include: {
        deliveries: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!notification) {
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        notification: {
          id: notification.id,
          read: notification.read,
          readAt: notification.readAt,
          deliveryStrategy: notification.deliveryStrategy,
          priority: notification.priority,
        },
        deliveries: notification.deliveries.map((d: any) => ({
          channel: d.channel,
          status: d.status,
          attemptCount: d.attemptCount,
          scheduledFor: d.scheduledFor,
          deliveredAt: d.deliveredAt,
          error: d.error,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching delivery status:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch delivery status",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Graceful shutdown
let isShuttingDown = false;

/**
 * Performs shutdown producer operation.
 * @returns {Promise<void>} Description of return value
 */
async function shutdownProducer() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    if (producerReady) {
      await producer.disconnect();
      console.log("✓ Kafka producer disconnected");
    }
  } catch (error) {
    console.error("❌ Error disconnecting producer:", error);
  }
}

process.on("SIGINT", async () => {
  console.log("\n⏹️  SIGINT: Shutting down notification read handler...");
  await shutdownProducer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  SIGTERM: Shutting down notification read handler...");
  await shutdownProducer();
  process.exit(0);
});

