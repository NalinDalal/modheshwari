import type { ServerWebSocket } from "bun";
import prisma from "@modheshwari/db";

import type { WSData, IncomingMessage, ChatMessage } from "./types";
import { MAX_MESSAGE_SIZE, HEARTBEAT_INTERVAL, CONNECTION_TIMEOUT } from "./config";
import { addSocket, removeSocket, checkRateLimit, getMessageSize, pushToUser } from "./utils";
import { logger } from "./logger";

/**
 * Handle new WebSocket connection.
 */
export function handleOpen(ws: ServerWebSocket<WSData>) {
  // If not authenticated, set an auth timeout and wait for auth handshake message
  if (!ws.data.authenticated) {
    const authTimeout = setTimeout(() => {
      try {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
      } catch {}
      try {
        ws.close();
      } catch {}
    }, 5000) as unknown as number;
    ws.data.authTimeoutId = authTimeout;
    ws.data.lastSeen = Date.now();
    return;
  }

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
}

/**
 * Handle incoming WebSocket message.
 */
export async function handleMessage(ws: ServerWebSocket<WSData>, message: string | Uint8Array) {
  const userId = ws.data.userId;
  const size = getMessageSize(message);
  
  // If not authenticated, only accept auth handshake messages
  if (!ws.data.authenticated) {
    try {
      const raw = typeof message === 'string' ? message : new TextDecoder().decode(message as Uint8Array);
      const parsed = JSON.parse(raw);
      if (parsed?.type === 'auth' && typeof parsed.token === 'string') {
        // validate token
        try {
          const decoded = (await import('@modheshwari/utils/jwt')).verifyJWT(parsed.token);
          const authUserId = decoded?.id || decoded?.userId;
          if (!authUserId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
            ws.close();
            return;
          }
          // clear auth timeout
          if (ws.data.authTimeoutId) clearTimeout(ws.data.authTimeoutId);
          ws.data.userId = authUserId;
          ws.data.authenticated = true;
          // register socket and start heartbeat
          addSocket(ws.data.userId, ws);
          ws.send(JSON.stringify({ type: 'connected', userId: ws.data.userId }));
          ws.data.lastSeen = Date.now();
          const heartbeatId = setInterval(() => {
            const now = Date.now();
            if (now - ws.data.lastSeen > CONNECTION_TIMEOUT) {
              try { ws.close(); } catch {}
              return;
            }
            try { ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })); } catch {}
          }, HEARTBEAT_INTERVAL) as unknown as number;
          ws.data.heartbeatId = heartbeatId;
        } catch (e) {
          try { ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' })); } catch {}
          try { ws.close(); } catch {}
        }
      } else {
        try { ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' })); } catch {}
        try { ws.close(); } catch {}
      }
    } catch (err) {
      try { ws.send(JSON.stringify({ type: 'error', message: 'Invalid auth message' })); } catch {}
      try { ws.close(); } catch {}
    }
    return;
  }

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
      await handleChatMessage(ws, data, userId);
    } else if (data.type === "typing") {
      handleTypingIndicator(data, userId);
    } else if (data.type === "read") {
      await handleReadReceipt(data, userId);
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
}

/**
 * Handle chat message.
 */
async function handleChatMessage(ws: ServerWebSocket<WSData>, data: IncomingMessage, userId: string) {
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
}

/**
 * Handle typing indicator.
 */
function handleTypingIndicator(data: IncomingMessage, userId: string) {
  if (!data.conversationId || !data.recipientIds) return;
  if (!Array.isArray(data.recipientIds) || data.recipientIds.length > 50) {
    return;
  }

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
}

/**
 * Handle read receipt.
 */
async function handleReadReceipt(data: IncomingMessage, userId: string) {
  if (!data.messageIds) return;
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

/**
 * Handle WebSocket connection close.
 */
export function handleClose(ws: ServerWebSocket<WSData>) {
  removeSocket(ws.data.userId, ws);
  if (ws.data.heartbeatId) {
    clearInterval(ws.data.heartbeatId);
  }
  logger.info("disconnected", { userId: ws.data.userId });
}
