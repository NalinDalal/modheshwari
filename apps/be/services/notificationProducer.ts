import { NotificationType, NotificationChannel, Role } from "@prisma/client";
import { publishMessage, TOPICS } from "./kafka";
import prisma from "@modheshwari/db";

/**
 * Notification event payload
 */
export interface NotificationEvent {
  eventId: string;
  timestamp: number;
  type: NotificationType;
  channels: NotificationChannel[];
  message: string;
  subject?: string; // For email
  data?: Record<string, any>; // Additional metadata
  recipients: {
    userId: string;
    email?: string;
    phone?: string;
    fcmToken?: string; // Firebase Cloud Messaging token
  }[];
  priority: "low" | "normal" | "high" | "urgent";
  senderId?: string;
  template?: string; // Email/push template name
}

/**
 * Broadcast notification to multiple users via Kafka
 */
export async function broadcastNotification(params: {
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject?: string;
  recipientIds: string[];
  senderId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  data?: Record<string, any>;
  template?: string;
}): Promise<{ eventId: string; recipientCount: number }> {
  const {
    message,
    type,
    channels,
    subject,
    recipientIds,
    senderId,
    priority = "normal",
    data,
    template,
  } = params;

  // Fetch recipient details including notification preferences
  const users = await prisma.user.findMany({
    where: {
      id: { in: recipientIds },
      status: true,
    },
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          phone: true,
          fcmToken: true,
          notificationPreferences: true,
        },
      },
    },
  });

  if (!users.length) {
    throw new Error("No valid recipients found");
  }

  // Filter recipients based on their preferences
  const recipients = users
    .filter((user) => {
      const prefs = user.profile?.notificationPreferences as any;
      if (!prefs) return true; // Default: allow all

      // Check if user has opted in for this channel
      return channels.some((channel) => {
        switch (channel) {
          case NotificationChannel.EMAIL:
            return prefs.emailEnabled !== false;
          case NotificationChannel.PUSH:
            return prefs.pushEnabled !== false;
          case NotificationChannel.SMS:
            return prefs.smsEnabled !== false;
          case NotificationChannel.IN_APP:
            return true; // Always allowed
          default:
            return true;
        }
      });
    })
    .map((user) => ({
      userId: user.id,
      email: user.email,
      phone: user.profile?.phone || undefined,
      fcmToken: user.profile?.fcmToken || undefined,
    }));

  const eventId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const event: NotificationEvent = {
    eventId,
    timestamp: Date.now(),
    type,
    channels,
    message,
    subject,
    data,
    recipients,
    priority,
    senderId,
    template,
  };

  // Publish to main notification events topic
  await publishMessage(TOPICS.NOTIFICATION_EVENTS, event, eventId);

  console.log(
    `📨 Published notification event ${eventId} for ${recipients.length} recipients`,
  );

  return {
    eventId,
    recipientCount: recipients.length,
  };
}

/**
 * Send single notification to one user
 */
export async function sendNotification(params: {
  userId: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject?: string;
  data?: Record<string, any>;
  template?: string;
}): Promise<{ eventId: string }> {
  const result = await broadcastNotification({
    ...params,
    recipientIds: [params.userId],
  });

  return { eventId: result.eventId };
}

/**
 * Send event-related notifications (e.g., registration confirmation)
 */
export async function notifyEventRegistration(params: {
  userId: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: NotificationType.EVENT,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: `Event Registration Confirmed: ${params.eventName}`,
    message: `You have successfully registered for ${params.eventName} on ${params.eventDate.toLocaleDateString()}.`,
    data: {
      eventName: params.eventName,
      eventDate: params.eventDate.toISOString(),
      eventLocation: params.eventLocation,
    },
    template: "event-registration",
  });
}

/**
 * Send resource request notifications
 */
export async function notifyResourceRequest(params: {
  requesterId: string;
  approverIds: string[];
  resourceType: string;
  description: string;
}): Promise<void> {
  await broadcastNotification({
    recipientIds: params.approverIds,
    type: NotificationType.RESOURCE_REQUEST,
    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    message: `New ${params.resourceType} request from user`,
    data: {
      requesterId: params.requesterId,
      resourceType: params.resourceType,
      description: params.description,
    },
    priority: "high",
    template: "resource-request",
  });
}

/**
 * Send reminders
 */
export async function sendReminder(params: {
  userIds: string[];
  message: string;
  data?: Record<string, any>;
}): Promise<void> {
  await broadcastNotification({
    recipientIds: params.userIds,
    type: NotificationType.REMINDER,
    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    message: params.message,
    data: params.data,
    priority: "normal",
  });
}
