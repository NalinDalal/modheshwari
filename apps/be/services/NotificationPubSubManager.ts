import { Consumer, EachMessagePayload } from "kafkajs";
import { NotificationChannel } from "@prisma/client";
import { kafka } from "./kafka";
import { NotificationEvent } from "./notificationProducer";
import { emailService } from "./emailService";
import { pushNotificationService } from "./pushNotificationService";
import prisma from "@modheshwari/db";

/**
 * Singleton PubSub Manager for Notifications
 * Manages Kafka subscriptions and relays notifications to connected clients
 */
export class NotificationPubSubManager {
  private static instance: NotificationPubSubManager;
  private consumer: Consumer | null = null;
  private subscriptions: Map<string, Set<NotificationChannel>>; // userId -> channels
  private webSockets: Map<string, any>; // userId -> WebSocket
  private isInitialized = false;

  private constructor() {
    this.subscriptions = new Map();
    this.webSockets = new Map();
  }

  public static getInstance(): NotificationPubSubManager {
    if (!NotificationPubSubManager.instance) {
      NotificationPubSubManager.instance = new NotificationPubSubManager();
    }
    return NotificationPubSubManager.instance;
  }

  /**
   * Initialize Kafka consumer (call once on server start)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.consumer = kafka.consumer({
      groupId: "notification-server-group",
    });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: "notification.events",
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    this.isInitialized = true;
    console.log("✅ NotificationPubSubManager initialized");
  }

  /**   * Register WebSocket connection for user
   */
  public registerSocket(userId: string, socket: any): void {
    this.webSockets.set(userId, socket);
    console.log(`🔌 WebSocket registered for user ${userId}`);
  }

  /**
   * Unregister WebSocket connection
   */
  public unregisterSocket(userId: string): void {
    this.webSockets.delete(userId);
    console.log(`🔌 WebSocket unregistered for user ${userId}`);
  }

  /**   * User subscribes to notifications
   */
  public userSubscribe(userId: string, channels: NotificationChannel[] = []) {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set());
    }

    channels.forEach((channel) => {
      this.subscriptions.get(userId)?.add(channel);
    });

    console.log(`User ${userId} subscribed to ${channels.join(", ")}`);
  }

  /**
   * User unsubscribes from notifications
   */
  public userUnsubscribe(userId: string, channels?: NotificationChannel[]) {
    if (!channels) {
      this.subscriptions.delete(userId);      this.webSockets.delete(userId);      console.log(`User ${userId} unsubscribed from all`);
      return;
    }

    const userChannels = this.subscriptions.get(userId);
    if (userChannels) {
      channels.forEach((channel) => userChannels.delete(channel));
      if (userChannels.size === 0) {
        this.subscriptions.delete(userId);
      }
    }
  }

  /**
   * Handle incoming Kafka messages
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const event: NotificationEvent = JSON.parse(
      payload.message.value?.toString() || "{}",
    );

    console.log(`📨 Processing event: ${event.eventId}`);

    // Save in-app notifications
    if (event.channels.includes(NotificationChannel.IN_APP)) {
      await this.saveInAppNotifications(event);
    }

    // Send emails
    if (event.channels.includes(NotificationChannel.EMAIL)) {
      await this.sendEmails(event);
    }

    // Send push notifications
    if (event.channels.includes(NotificationChannel.PUSH)) {
      await this.sendPushNotifications(event);
    }

    // Relay to subscribed WebSocket clients
    this.relayToSubscribers(event);
  }

  /**
   * Relay notification to subscribed users
   */
  private relayToSubscribers(event: NotificationEvent): void {
    event.recipients.forEach((recipient) => {
      const userChannels = this.subscriptions.get(recipient.userId);
      const socket = this.webSockets.get(recipient.userId);

      if (userChannels && socket) {
        event.channels.forEach((channel) => {
          if (userChannels.has(channel)) {
            // Send to WebSocket
            socket.send(
              JSON.stringify({
                type: "notification",
                channel,
                data: {
                  message: event.message,
                  subject: event.subject,
                  notificationType: event.type,
                  metadata: event.data,
                  timestamp: event.timestamp,
                },
              }),
            );
            console.log(`📤 Sent ${channel} notification to user ${recipient.userId}`);
          }
        });
      }
    });
  }

  /**
   * Save in-app notifications to database
   */
  private async saveInAppNotifications(
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
      console.log(`💾 Saved ${event.recipients.length} in-app notifications`);
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  }

  /**
   * Send email notifications
   */
  private async sendEmails(event: NotificationEvent): Promise<void> {
    const emails = event.recipients
      .filter((r) => r.email)
      .map((r) => ({
        to: r.email!,
        subject: event.subject || "Notification",
        text: event.message,
      }));

    if (emails.length > 0) {
      const count = await emailService.sendBulk(emails);
      console.log(`✉️ Sent ${count}/${emails.length} emails`);
    }
  }

  /**
   * Send push notifications
   */
  private async sendPushNotifications(event: NotificationEvent): Promise<void> {
    const tokens = event.recipients
      .filter((r) => r.fcmToken)
      .map((r) => r.fcmToken!);

    if (tokens.length > 0) {
      const result = await pushNotificationService.send({
        tokens,
        title: event.subject || "Notification",
        body: event.message,
        data: event.data
          ? Object.fromEntries(
              Object.entries(event.data).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
        priority: event.priority === "urgent" ? "high" : "normal",
      });

      console.log(`📱 Sent ${result.successCount}/${tokens.length} push notifications`);

      // Clean up invalid tokens
      if (result.invalidTokens.length > 0) {
        await prisma.profile.updateMany({
          where: { fcmToken: { in: result.invalidTokens } },
          data: { fcmToken: null },
        });
      }
    }
  }

  /**
   * Cleanup on shutdown
   */
  public async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      console.log("NotificationPubSubManager disconnected");
    }
  }
}
