import { producer, TOPICS } from "./config";
import { NotificationType, NotificationChannel } from "@prisma/client";
import { randomUUID } from "crypto";

export interface NotificationEvent {
  eventId: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject?: string;
  recipientIds: number[];
  senderId: number;
  priority: "low" | "normal" | "high" | "urgent";
  timestamp: string;
}

/**
 * Broadcast a notification event to Kafka
 * This will be consumed by the router worker which will route to appropriate channels
 */
export async function broadcastNotification(
  params: Omit<NotificationEvent, "eventId" | "timestamp">,
) {
  const eventId = randomUUID();
  const timestamp = new Date().toISOString();

  const event: NotificationEvent = {
    ...params,
    eventId,
    timestamp,
  };

  try {
    // Ensure producer is connected
    await producer.connect();

    // Publish event to the main notification events topic
    await producer.send({
      topic: TOPICS.NOTIFICATION_EVENTS,
      messages: [
        {
          key: eventId, // Use eventId as key for partitioning
          value: JSON.stringify(event),
          headers: {
            "event-type": "notification.broadcast",
            "sender-id": String(params.senderId),
            priority: params.priority,
          },
        },
      ],
    });

    console.log(`✓ Notification event ${eventId} published to Kafka`);

    return {
      eventId,
      recipientCount: params.recipientIds.length,
      timestamp,
    };
  } catch (error) {
    console.error("Failed to publish notification event:", error);
    throw new Error("Failed to queue notification for delivery");
  }
}

/**
 * Publish a channel-specific notification
 * Used by the router consumer to send to specific delivery channels
 */
export async function publishToChannel(
  channel: NotificationChannel,
  recipientId: number,
  event: NotificationEvent,
) {
  const topicMap: Record<NotificationChannel, string> = {
    IN_APP: TOPICS.NOTIFICATION_EVENTS, // In-app handled by router directly
    EMAIL: TOPICS.NOTIFICATION_EMAIL,
    PUSH: TOPICS.NOTIFICATION_PUSH,
    SMS: TOPICS.NOTIFICATION_SMS,
  };

  const topic = topicMap[channel];

  if (!topic) {
    console.error(`Unknown channel: ${channel}`);
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: `${recipientId}`, // Use recipientId for partitioning
          value: JSON.stringify({
            ...event,
            recipientId,
            channel,
          }),
          headers: {
            channel: channel,
            "recipient-id": String(recipientId),
            "event-id": event.eventId,
          },
        },
      ],
    });

    console.log(
      `✓ Published to ${channel} channel for recipient ${recipientId}`,
    );
  } catch (error) {
    console.error(`Failed to publish to ${channel} channel:`, error);
    throw error;
  }
}
