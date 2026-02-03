import type { ServerWebSocket } from "bun";
import { verifyJWT } from "@modheshwari/utils/jwt";

import type { WSData, WSMap, RateLimitMap } from "./types";
import { RATE_LIMIT_WINDOW, MAX_MESSAGES_PER_WINDOW } from "./config";
import { logger } from "./logger";

export const userSockets: WSMap = new Map();
export const messageRateLimits: RateLimitMap = new Map();

/**
 * Check if user has exceeded rate limit.
 * @param userId - User ID to check
 * @returns True if within limit, false if exceeded
 */
export function checkRateLimit(userId: string): boolean {
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
 * Get message size in bytes.
 * @param message - Message to measure
 * @returns Size in bytes
 */
export function getMessageSize(message: string | Uint8Array): number {
  if (typeof message === "string") return message.length;
  return message.byteLength;
}

/**
 * Authenticate WebSocket request.
 * @param req - HTTP request with authorization header
 * @returns User ID if authenticated, null otherwise
 */
export function authenticate(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const decoded = verifyJWT(token);
  const userId = decoded?.id || decoded?.userId;
  return typeof userId === "string" && userId ? userId : null;
}

/**
 * Add WebSocket connection for user.
 * @param userId - User ID
 * @param ws - WebSocket connection
 */
export function addSocket(userId: string, ws: ServerWebSocket<WSData>) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(ws);
}

/**
 * Remove WebSocket connection for user.
 * @param userId - User ID
 * @param ws - WebSocket connection
 */
export function removeSocket(userId: string, ws: ServerWebSocket<WSData>) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    userSockets.delete(userId);
  }
}

/**
 * Push message to all sockets for a user.
 * @param userId - User ID to send to
 * @param payload - Data to send
 */
export function pushToUser(userId: string, payload: unknown) {
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
