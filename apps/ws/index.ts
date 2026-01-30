import { serve, type ServerWebSocket } from "bun";
import { Kafka, type EachMessagePayload } from "kafkajs";
import { config } from "dotenv";
import { join } from "path";
import { NotificationChannel } from "@prisma/client";
import { verifyJWT } from "@modheshwari/utils/jwt";
import prisma from "@modheshwari/db";
import { logger } from "./logger";

// Load env from monorepo root
config({ path: join(process.cwd(), "../../.env") });

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
const WS_PORT = Number(process.env.WS_PORT || 3002);
const NOTIFICATION_TOPIC =
  process.env.NOTIFICATION_TOPIC || "notification.events";
const WS_CONSUMER_GROUP = process.env.WS_CONSUMER_GROUP || "notifications-ws";

const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
const HEARTBEAT_INTERVAL = 30000; // 30s
const CONNECTION_TIMEOUT = 60000; // 60s
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 100;

type WSData = { userId: string; lastSeen: number; heartbeatId?: number };

type NotificationEvent = {
  eventId: string;
  message: string;
  type: string;
  channels: NotificationChannel[];
  subject?: string;
  recipientIds: string[];
  senderId: string;
  priority: "low" | "normal" | "high" | "urgent";
  timestamp: string;
};

type ChatMessage = {
  type: "chat";
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
};

type IncomingMessage = {
  type: "chat" | "typing" | "read";
  conversationId?: string;
  content?: string;
  recipientIds?: string[];
  messageIds?: string[];
};

const userSockets = new Map<string, Set<ServerWebSocket<WSData>>>();
const messageRateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Performs check rate limit operation.
 * @param {string} userId - Description of userId
 * @returns {boolean} Description of return value
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = messageRateLimits.get(userId);

  if (!limit || now > limit.resetAt) {
    messageRateLimits.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }

  limit.count += 1;
  return true;
}

/**
 * Performs get message size operation.
 * @param {string | Uint8Array} message - Description of message
 * @returns {number} Description of return value
 */
function getMessageSize(message: string | Uint8Array): number {
  if (typeof message === "string") return message.length;
  return message.byteLength;
}

/**
 * Performs authenticate operation.
 * @param {Request} req - Description of req
 * @returns {string} Description of return value
 */
function authenticate(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const decoded = verifyJWT(token);
  const userId = decoded?.id || decoded?.userId;
  return typeof userId === "string" && userId ? userId : null;
}

/**
 * Performs add socket operation.
 * @param {string} userId - Description of userId
 * @param {Bun.ServerWebSocket<WSData>} ws - Description of ws
 * @returns {void} Description of return value
 */
function addSocket(userId: string, ws: ServerWebSocket<WSData>) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(ws);
}

/**
 * Performs remove socket operation.
 * @param {string} userId - Description of userId
 * @param {Bun.ServerWebSocket<WSData>} ws - Description of ws
 * @returns {void} Description of return value
 */
function removeSocket(userId: string, ws: ServerWebSocket<WSData>) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    userSockets.delete(userId);
  }
}

/**
 * Performs push to user operation.
 * @param {string} userId - Description of userId
 * @param {unknown} payload - Description of payload
 * @returns {void} Description of return value
 */
function pushToUser(userId: string, payload: unknown) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const data = JSON.stringify(payload);
  for (const ws of sockets) {
    try {
      ws.send(data);
    } catch (err) {
      logger.error("Failed to send WS message", err instanceof Error ? err : String(err));
    }
  }
}

const kafka = new Kafka({
  clientId: "modheshwari-ws",
  brokers: [KAFKA_BROKER],
  logCreator: () => ({ namespace, level, label, log }) => {
    try {
      const lvl = (log && (log.level || log.levelName))
        ? String(log.level || log.levelName).toUpperCase()
        : String(level || "INFO").toUpperCase();

      const msgParts: any = { namespace };
      if (log && log.message) msgParts.message = log.message;
      if (log && log.error) msgParts.error = log.error;
      // include other useful fields
      for (const k of ["groupId", "memberId", "clientId", "broker"]) {
        if (log && (log as any)[k]) (msgParts as any)[k] = (log as any)[k];
      }

      let text: string;
      try {
        text = msgParts.message ? `${msgParts.message}` : JSON.stringify(msgParts);
      } catch (_) {
        text = String(msgParts);
      }

      if (lvl.includes("ERROR")) logger.error(text, msgParts.error || msgParts);
      else if (lvl.includes("WARN")) logger.warn(text, msgParts);
      else if (lvl.includes("DEBUG")) logger.debug(text, msgParts);
      else logger.info(text, msgParts);
    } catch (e) {
      // fallback
      logger.info(String(log) || "kafkajs log", log);
    }
  },
});
const consumer = kafka.consumer({ groupId: WS_CONSUMER_GROUP });

/**
 * Performs handle notification event operation.
 * @param {import("/Users/nalindalal/modheshwari/node_modules/kafkajs/types/index").EachMessagePayload} { message } - Description of { message }
 * @returns {Promise<void>} Description of return value
 */
async function handleNotificationEvent({ message }: EachMessagePayload) {
  const raw = message.value?.toString();
  if (!raw) return;

  let parsed: NotificationEvent | null = null;
  try {
    parsed = JSON.parse(raw) as NotificationEvent;
  } catch (err) {
    logger.error("Failed to parse event", err instanceof Error ? err : String(err));
    return;
  }

  if (!Array.isArray(parsed.recipientIds) || parsed.recipientIds.length === 0) {
    return;
  }

  if (!parsed.channels?.includes(NotificationChannel.IN_APP)) {
    return;
  }

  for (const recipientId of parsed.recipientIds) {
    pushToUser(recipientId, {
      type: "notification",
      notification: parsed,
    });
  }
}

/**
 * Performs start kafka consumer operation.
 * @returns {Promise<void>} Description of return value
 */
async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: NOTIFICATION_TOPIC, fromBeginning: false });
  await consumer.run({
    eachMessage: handleNotificationEvent,
  });
  logger.info(`Kafka consumer connected → ${NOTIFICATION_TOPIC}`);
}

const server = serve<WSData>({
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
    open(ws) {
      addSocket(ws.data.userId, ws);
      logger.info("WebSocket connected", { userId: ws.data.userId });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: "connected", userId: ws.data.userId }));

      ws.data.lastSeen = Date.now();
      const heartbeatId = setInterval(() => {
        const now = Date.now();
        if (now - ws.data.lastSeen > CONNECTION_TIMEOUT) {
          try {
            ws.close();
          } catch {}
          return;
        }

        try {
          ws.send(
            JSON.stringify({ type: "ping", timestamp: new Date().toISOString() }),
          );
        } catch {
          // ignore send failures; close handler will clean up
        }
      }, HEARTBEAT_INTERVAL) as unknown as number;
      ws.data.heartbeatId = heartbeatId;
    },
    async message(ws, message) {
      const userId = ws.data.userId;
      const size = getMessageSize(message as string | Uint8Array);
      if (!checkRateLimit(userId)) {
        try {
          ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded" }));
        } catch {}
        return;
      }

      if (size > MAX_MESSAGE_SIZE) {
        try {
          ws.send(JSON.stringify({ type: "error", message: "Message too large" }));
        } catch {}
        return;
      }

      try {
        const raw =
          typeof message === "string"
            ? message
            : new TextDecoder().decode(message as Uint8Array);
        if (!raw) return;
        const data = JSON.parse(raw) as IncomingMessage;
        ws.data.lastSeen = Date.now();

        if (data.type === "chat") {
          const conversationId = data.conversationId;
          if (!conversationId) return;
          const content = data.content;
          if (!content) return;
          if (content.length > 10000) {
            ws.send(JSON.stringify({ type: "error", message: "Message too long" }));
            return;
          }

          const result = await prisma.$transaction(async (tx) => {
            const conversation = await tx.conversation.findFirst({
              where: {
                id: conversationId,
                participants: { has: userId },
              },
            });

            if (!conversation) {
              throw new Error("User not in conversation");
            }

            const sender = await tx.user.findUnique({
              where: { id: userId },
              select: { name: true },
            });

            if (!sender) {
              throw new Error("Sender not found");
            }

            const savedMessage = await tx.message.create({
              data: {
                conversationId,
                senderId: userId,
                senderName: sender.name,
                content,
                readBy: [userId],
              },
            });

            await tx.conversation.update({
              where: { id: conversationId },
              data: {
                lastMessage: content,
                lastMessageAt: savedMessage.createdAt,
              },
            });

            return { savedMessage, sender, conversation };
          });

          const chatPayload: ChatMessage = {
            type: "chat",
            messageId: result.savedMessage.id,
            conversationId,
            senderId: userId,
            senderName: result.sender.name,
            content,
            timestamp: result.savedMessage.createdAt.toISOString(),
          };

          for (const recipientId of result.conversation.participants) {
            pushToUser(recipientId, chatPayload);
          }
        } else if (
          data.type === "typing" &&
          data.conversationId &&
          data.recipientIds
        ) {
          if (!Array.isArray(data.recipientIds) || data.recipientIds.length > 50) {
            return;
          }

          // Broadcast typing indicator
          const typingPayload = {
            type: "typing",
            conversationId: data.conversationId,
            userId,
            timestamp: new Date().toISOString(),
          };

          for (const recipientId of data.recipientIds) {
            if (recipientId !== userId) {
              pushToUser(recipientId, typingPayload);
            }
          }
        } else if (data.type === "read" && data.messageIds) {
          if (!Array.isArray(data.messageIds) || data.messageIds.length > 100) {
            return;
          }

          await prisma.$transaction(async (tx) => {
            await tx.message.updateMany({
              where: {
                id: { in: data.messageIds },
                senderId: { not: userId },
              },
              data: {
                readBy: { push: userId },
              },
            });

            const messages = await tx.message.findMany({
              where: { id: { in: data.messageIds } },
              select: { id: true, senderId: true, conversationId: true },
            });

            for (const msg of messages) {
              pushToUser(msg.senderId, {
                type: "read",
                messageIds: [msg.id],
                conversationId: msg.conversationId,
                userId,
                timestamp: new Date().toISOString(),
              });
            }
          });
        }
      } catch (err) {
        logger.error("Failed to handle message", {
          error: err instanceof Error ? err.message : String(err),
          userId,
        });
        try {
          ws.send(JSON.stringify({ type: "error", message: "Failed to process message" }));
        } catch {}
      }
    },
    close(ws) {
      removeSocket(ws.data.userId, ws);
      if (ws.data.heartbeatId) {
        clearInterval(ws.data.heartbeatId);
      }
      logger.info("disconnected", { userId: ws.data.userId });
    },
  },
});

startKafkaConsumer().catch((err) => {
  logger.error("Failed to start consumer", err instanceof Error ? err : String(err));
  process.exit(1);
});

logger.info(`server running on ws://localhost:${WS_PORT}`);

/**
 * Performs shutdown operation.
 * @returns {Promise<void>} Description of return value
 */
async function shutdown() {
  logger.info("shutting down...");
  try {
    await consumer.disconnect();
  } catch (err) {
    logger.error("consumer disconnect failed", err instanceof Error ? err : String(err));
  }
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);