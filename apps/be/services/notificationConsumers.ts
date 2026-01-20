import { EachMessagePayload } from "kafkajs";
import { NotificationChannel } from "@prisma/client";
import { subscribeToTopic, TOPICS } from "./kafka";
import { NotificationEvent } from "./notificationProducer";
import { emailService } from "./emailService";
import { pushNotificationService } from "./pushNotificationService";
import prisma from "@modheshwari/db";

/**
 * Notification Consumer Workers
 * These workers consume messages from Kafka topics and deliver notifications
 * Run these as separate processes/containers for horizontal scaling
 */

/**
 * Main notification event consumer
 * Routes notifications to appropriate channel-specific topics
 */
export async function startNotificationRouter(): Promise<void> {
  console.log("🚀 Starting notification router...");

  await subscribeToTopic(
    TOPICS.NOTIFICATION_EVENTS,
    "notification-router-group",
    async (payload: EachMessagePayload) => {
      const event: NotificationEvent = JSON.parse(
        payload.message.value?.toString() || "{}",
      );

      console.log(
        `📨 Processing notification event: ${event.eventId} for ${event.recipients.length} recipients`,
      );

      // Save in-app notifications to database
      if (event.channels.includes(NotificationChannel.IN_APP)) {
        await saveInAppNotifications(event);
      }

      // Route to channel-specific consumers
      for (const channel of event.channels) {
        const { publishMessage } = await import("./kafka");

        switch (channel) {
          case NotificationChannel.EMAIL:
            await publishMessage(
              TOPICS.EMAIL_NOTIFICATIONS,
              event,
              event.eventId,
            );
            break;

          case NotificationChannel.PUSH:
            await publishMessage(
              TOPICS.PUSH_NOTIFICATIONS,
              event,
              event.eventId,
            );
            break;

          case NotificationChannel.SMS:
            await publishMessage(
              TOPICS.SMS_NOTIFICATIONS,
              event,
              event.eventId,
            );
            break;
        }
      }

      console.log(`✅ Routed notification ${event.eventId} to channels`);
    },
  );
}

/**
 * Email notification consumer
 */
export async function startEmailConsumer(): Promise<void> {
  console.log("🚀 Starting email consumer...");

  await subscribeToTopic(
    TOPICS.EMAIL_NOTIFICATIONS,
    "email-notification-group",
    async (payload: EachMessagePayload) => {
      const event: NotificationEvent = JSON.parse(
        payload.message.value?.toString() || "{}",
      );

      console.log(
        `✉️ Processing email notification: ${event.eventId}`,
      );

      const emails = event.recipients
        .filter((r) => r.email)
        .map((recipient) => ({
          to: recipient.email!,
          subject: event.subject || "Notification",
          template: event.template || "generic",
          data: {
            message: event.message,
            ...event.data,
          },
        }));

      if (emails.length > 0) {
        const successCount = await emailService.sendBulk(emails);
        console.log(
          `✉️ Sent ${successCount}/${emails.length} emails for event ${event.eventId}`,
        );

        // Update delivery status
        await updateNotificationStatus(
          event.eventId,
          NotificationChannel.EMAIL,
          successCount,
          emails.length - successCount,
        );
      }
    },
  );
}

/**
 * Push notification consumer
 */
export async function startPushConsumer(): Promise<void> {
  console.log("🚀 Starting push notification consumer...");

  await subscribeToTopic(
    TOPICS.PUSH_NOTIFICATIONS,
    "push-notification-group",
    async (payload: EachMessagePayload) => {
      const event: NotificationEvent = JSON.parse(
        payload.message.value?.toString() || "{}",
      );

      console.log(
        `📱 Processing push notification: ${event.eventId}`,
      );

      const fcmTokens = event.recipients
        .filter((r) => r.fcmToken)
        .map((r) => r.fcmToken!);

      if (fcmTokens.length > 0) {
        const result = await pushNotificationService.send({
          tokens: fcmTokens,
          title: event.subject || "Notification",
          body: event.message,
          data: event.data
            ? Object.fromEntries(
                Object.entries(event.data).map(([k, v]) => [
                  k,
                  String(v),
                ]),
              )
            : undefined,
          priority: event.priority === "urgent" ? "high" : "normal",
        });

        console.log(
          `📱 Sent ${result.successCount}/${fcmTokens.length} push notifications for event ${event.eventId}`,
        );

        // Remove invalid tokens from database
        if (result.invalidTokens.length > 0) {
          await removeInvalidFcmTokens(result.invalidTokens);
        }

        // Update delivery status
        await updateNotificationStatus(
          event.eventId,
          NotificationChannel.PUSH,
          result.successCount,
          result.failureCount,
        );
      }
    },
  );
}

/**
 * SMS notification consumer (placeholder)
 */
export async function startSmsConsumer(): Promise<void> {
  console.log("🚀 Starting SMS consumer...");

  await subscribeToTopic(
    TOPICS.SMS_NOTIFICATIONS,
    "sms-notification-group",
    async (payload: EachMessagePayload) => {
      const event: NotificationEvent = JSON.parse(
        payload.message.value?.toString() || "{}",
      );

      console.log(
        `📲 Processing SMS notification: ${event.eventId}`,
      );

      // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
      const phoneNumbers = event.recipients
        .filter((r) => r.phone)
        .map((r) => r.phone!);

      console.log(
        `📲 Would send SMS to ${phoneNumbers.length} recipients (not implemented)`,
      );
    },
  );
}

/**
 * Save in-app notifications to database
 */
async function saveInAppNotifications(
  event: NotificationEvent,
): Promise<void> {
  try {
    await prisma.notification.createMany({
      data: event.recipients.map((recipient) => ({
        userId: recipient.userId,
        message: event.message,
        type: event.type,
        channel: NotificationChannel.IN_APP,
        metadata: event.data as any,
      })),
    });

    console.log(
      `💾 Saved ${event.recipients.length} in-app notifications`,
    );
  } catch (error) {
    console.error("Error saving in-app notifications:", error);
  }
}

/**
 * Update notification delivery status (for analytics)
 */
async function updateNotificationStatus(
  eventId: string,
  channel: NotificationChannel,
  successCount: number,
  failureCount: number,
): Promise<void> {
  try {
    // You could create a separate NotificationLog table for this
    console.log(
      `📊 Event ${eventId} - ${channel}: ${successCount} success, ${failureCount} failed`,
    );

    // Optional: Store in a log table or analytics system
  } catch (error) {
    console.error("Error updating notification status:", error);
  }
}

/**
 * Remove invalid FCM tokens from user profiles
 */
async function removeInvalidFcmTokens(tokens: string[]): Promise<void> {
  try {
    await prisma.profile.updateMany({
      where: {
        fcmToken: { in: tokens },
      },
      data: {
        fcmToken: null,
      },
    });

    console.log(`🗑️ Removed ${tokens.length} invalid FCM tokens`);
  } catch (error) {
    console.error("Error removing invalid FCM tokens:", error);
  }
}

/**
 * Start all consumers (for development/single-process mode)
 */
export async function startAllConsumers(): Promise<void> {
  await Promise.all([
    startNotificationRouter(),
    startEmailConsumer(),
    startPushConsumer(),
    startSmsConsumer(),
  ]);

  console.log("✅ All notification consumers started");
}
