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

type WSData = { userId: string };

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

function authenticate(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const decoded = verifyJWT(token);
  const userId = decoded?.id || decoded?.userId;
  return typeof userId === "string" && userId ? userId : null;
}

function addSocket(userId: string, ws: ServerWebSocket<WSData>) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(ws);
}

function removeSocket(userId: string, ws: ServerWebSocket<WSData>) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    userSockets.delete(userId);
  }
}

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

      server.upgrade(req, { data: { userId } satisfies WSData });
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
      logger.info("connected", { userId: ws.data.userId });
    },
    async message(ws, message) {
      try {
        const data = JSON.parse(message.toString()) as IncomingMessage;

        if (data.type === "chat" && data.conversationId && data.content) {
          // Verify user is part of conversation
          const conversation = await prisma.conversation.findFirst({
            where: {
              id: data.conversationId,
              participants: {
                has: ws.data.userId,
              },
            },
          });

          if (!conversation) {
            console.error("[WS] User not in conversation");
            return;
          }

          // Get sender details
          const sender = await prisma.user.findUnique({
            where: { id: ws.data.userId },
            select: { name: true },
          });

          if (!sender) {
            console.error("[WS] Sender not found");
            return;
          }

          // Save message to database
          const savedMessage = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderId: ws.data.userId,
              senderName: sender.name,
              content: data.content,
              readBy: [ws.data.userId], // Mark as read by sender
            },
          });

          // Update conversation's last message
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: {
              lastMessage: data.content,
              lastMessageAt: savedMessage.createdAt,
            },
          });

          // Send to all participants including sender
          const chatPayload: ChatMessage = {
            type: "chat",
            messageId: savedMessage.id,
            conversationId: data.conversationId,
            senderId: ws.data.userId,
            senderName: sender.name,
            content: data.content,
            timestamp: savedMessage.createdAt.toISOString(),
          };

          // Push to all recipients
          for (const recipientId of conversation.participants) {
            pushToUser(recipientId, chatPayload);
          }
        } else if (
          data.type === "typing" &&
          data.conversationId &&
          data.recipientIds
        ) {
          // Broadcast typing indicator
          const typingPayload = {
            type: "typing",
            conversationId: data.conversationId,
            userId: ws.data.userId,
            timestamp: new Date().toISOString(),
          };

          for (const recipientId of data.recipientIds) {
            if (recipientId !== ws.data.userId) {
              pushToUser(recipientId, typingPayload);
            }
          }
        } else if (data.type === "read" && data.messageIds) {
          // Mark messages as read
          await prisma.message.updateMany({
            where: {
              id: {
                in: data.messageIds,
              },
              senderId: {
                not: ws.data.userId,
              },
            },
            data: {
              readBy: {
                push: ws.data.userId,
              },
            },
          });

          // Send read receipt to senders
          const messages = await prisma.message.findMany({
            where: {
              id: {
                in: data.messageIds,
              },
            },
            select: {
              id: true,
              senderId: true,
              conversationId: true,
            },
          });

          for (const msg of messages) {
            pushToUser(msg.senderId, {
              type: "read",
              messageIds: [msg.id],
              conversationId: msg.conversationId,
              userId: ws.data.userId,
              timestamp: new Date().toISOString(),
            });
          }
        }
        } catch (err) {
          logger.error("Failed to handle message", err instanceof Error ? err : String(err));
        }
    },
    close(ws) {
      removeSocket(ws.data.userId, ws);
      logger.info("disconnected", { userId: ws.data.userId });
    },
  },
});

startKafkaConsumer().catch((err) => {
  logger.error("Failed to start consumer", err instanceof Error ? err : String(err));
  process.exit(1);
});

logger.info(`server running on ws://localhost:${WS_PORT}`);

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