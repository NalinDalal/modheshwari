import admin from "firebase-admin";

/**
 * Push notification service using Firebase Cloud Messaging (FCM)
 * Supports Android, iOS, and Web push notifications
 */

interface PushNotificationOptions {
  tokens: string[]; // FCM device tokens
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  priority?: "high" | "normal";
  badge?: number;
  sound?: string;
}

class PushNotificationService {
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize with service account (JSON file or environment variables)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT,
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (process.env.FIREBASE_PROJECT_ID) {
        // Alternative: use individual environment variables
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
              /\\n/g,
              "\n",
            ),
          }),
        });
      } else {
        console.warn("⚠️ Firebase not configured, push notifications disabled");
        return;
      }

      this.initialized = true;
      console.log("✅ Firebase Push Notification service initialized");
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async send(options: PushNotificationOptions): Promise<{
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
  }> {
    await this.init();

    if (!this.initialized || !options.tokens.length) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: options.tokens,
        notification: {
          title: options.title,
          body: options.body,
          imageUrl: options.imageUrl,
        },
        data: options.data || {},
        android: {
          priority: options.priority || "high",
          notification: {
            sound: options.sound || "default",
            clickAction: options.clickAction,
            channelId: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              badge: options.badge,
              sound: options.sound || "default",
            },
          },
        },
        webpush: {
          notification: {
            title: options.title,
            body: options.body,
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            vibrate: [200, 100, 200],
          },
          fcmOptions: {
            link: options.clickAction || process.env.APP_URL,
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      const invalidTokens: string[] = [];

      // Collect invalid/expired tokens
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === "messaging/invalid-registration-token" ||
            resp.error?.code === "messaging/registration-token-not-registered")
        ) {
          invalidTokens.push(options.tokens[idx]);
        }
      });

      console.log(
        `📱 Push notifications sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      console.error("Push notification error:", error);
      return {
        successCount: 0,
        failureCount: options.tokens.length,
        invalidTokens: [],
      };
    }
  }

  /**
   * Send to a single device
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    const result = await this.send({
      tokens: [token],
      title,
      body,
      data,
    });

    return result.successCount > 0;
  }

  /**
   * Send to a topic (for broadcasting to subscribed users)
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    await this.init();

    if (!this.initialized) return false;

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      await admin.messaging().send(message);
      console.log(`📱 Push notification sent to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error("Topic push notification error:", error);
      return false;
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<number> {
    await this.init();

    if (!this.initialized || !tokens.length) return 0;

    try {
      const response = await admin
        .messaging()
        .subscribeToTopic(tokens, topic);
      console.log(
        `📱 Subscribed ${response.successCount} devices to topic: ${topic}`,
      );
      return response.successCount;
    } catch (error) {
      console.error("Topic subscription error:", error);
      return 0;
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string,
  ): Promise<number> {
    await this.init();

    if (!this.initialized || !tokens.length) return 0;

    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      console.log(
        `📱 Unsubscribed ${response.successCount} devices from topic: ${topic}`,
      );
      return response.successCount;
    } catch (error) {
      console.error("Topic unsubscription error:", error);
      return 0;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
