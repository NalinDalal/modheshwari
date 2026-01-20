import { NotificationPubSubManager } from "../services/NotificationPubSubManager";
import { NotificationChannel } from "@prisma/client";
import { verify } from "@modheshwari/utils/jwt";

/**
 * WebSocket handler for real-time notifications
 * Usage: ws://localhost:3001/ws/notifications?token=JWT_TOKEN
 */
export function handleNotificationWebSocket(req: Request): Response {
  // Verify auth token from query params
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = verify(token);
    const userId = payload.id;

    const manager = NotificationPubSubManager.getInstance();

    // Upgrade to WebSocket
    const success = Bun.upgradeWebSocket(req);
    
    if (success) {
      return new Response("Upgrading to WebSocket", { status: 101 });
    }

    return new Response("WebSocket upgrade failed", { status: 400 });
  } catch (error) {
    console.error("WebSocket auth error:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}

/**
 * WebSocket event handlers
 */
export const websocketHandlers = {
  open(ws: any) {
    const userId = ws.data?.userId;
    if (userId) {
      const manager = NotificationPubSubManager.getInstance();
      manager.registerSocket(userId, ws);
      manager.userSubscribe(userId, [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ]);
    }
  },

  message(ws: any, message: string) {
    console.log("WebSocket message:", message);
  },

  close(ws: any) {
    const userId = ws.data?.userId;
    if (userId) {
      const manager = NotificationPubSubManager.getInstance();
      manager.unregisterSocket(userId);
      manager.userUnsubscribe(userId);
    }
  },
};
