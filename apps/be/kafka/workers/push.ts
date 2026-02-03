import type { EachMessagePayload } from "kafkajs";

import { createConsumer, TOPICS } from "../config";
import type { NotificationEvent } from "../notification-producer";

/**
 * Firebase Cloud Messaging (FCM) push notification service
 * Sends push notifications to registered devices via FCM
 * 
 * Environment variables required:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_CLIENT_EMAIL
 */

interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data: {
    eventId: string;
    type: string;
    priority: string;
    timestamp: string;
  };
}

/**
 * Send push notification via FCM
 * Note: Requires firebase-admin SDK to be installed and initialized
 */
async function sendPushNotification(message: FCMMessage): Promise<boolean> {
  try {
    // Check if Firebase Admin SDK is available
    try {
      // @ts-ignore - firebase-admin is optional
      const admin = await import("firebase-admin");
      
      // Only initialize once
      if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (!projectId) {
          throw new Error("Missing required Firebase env var: FIREBASE_PROJECT_ID");
        }
        if (!privateKey) {
          throw new Error("Missing required Firebase env var: FIREBASE_PRIVATE_KEY");
        }
        if (!clientEmail) {
          throw new Error("Missing required Firebase env var: FIREBASE_CLIENT_EMAIL");
        }

        const serviceAccount = {
          projectId,
          privateKey: privateKey.replace(/\\n/g, "\n"),
          clientEmail,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      const response = await admin.messaging().send(message);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot find module")) {
        return false; // SDK not available, not sent
      }
      throw error;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Build FCM message from notification event
 */
function buildFCMMessage(
  event: NotificationEvent & { recipientId: string; fcmToken: string },
): FCMMessage {
  return {
    token: event.fcmToken,
    notification: {
      title: event.subject || event.type.replace(/_/g, " "),
      body: String(event.message ?? "").substring(0, 150), // FCM has character limits
    },
    data: {
      eventId: event.eventId,
      type: event.type,
      priority: event.priority,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Push notification consumer worker
 * Consumes push notification events from Kafka and sends them via FCM
 */
export async function startPushConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-push");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_PUSH,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        if (!message.value) {
          return;
        }

        const event = JSON.parse(message.value.toString()) as NotificationEvent & {
          recipientId: string;
          fcmToken: string;
        };

        // Skip if no FCM token
        if (!event.fcmToken) {
          return;
        }

        // Build FCM message
        const fcmMessage = buildFCMMessage(event);

        // Send push notification
        const success = await sendPushNotification(fcmMessage);
      } catch (error) {
      }
    },
  });
}

