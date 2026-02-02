/**
 * Escalation Worker
 * 
 * Handles the notification escalation pattern:
 * 1. In-app notification sent immediately
 * 2. If not read after 10 minutes → send SMS
 * 3. If not read after 30 more minutes → send email
 * 
 * This worker processes scheduled notifications and cancels escalation
 * when notifications are marked as read.
 */

import type { Consumer } from "kafkajs";
import prisma from "@modheshwari/db";
import { kafka } from "../config";
import { publishToChannel } from "../notification-producer";

// Escalation timings (in milliseconds)
const ESCALATION_DELAYS = {
  SMS: 10 * 60 * 1000, // 10 minutes after in-app
  EMAIL: 40 * 60 * 1000, // 40 minutes total (10 + 30)
};

/**
 * Process notifications that are ready for escalation
 */
async function processEscalation() {
  try {
    const now = new Date();

    // Find deliveries that are scheduled and ready to send
    // Note: We limit to 100 to avoid overwhelming the system
    // In a distributed setup, each worker should claim deliveries atomically
    // to prevent duplicate processing across workers
    const readyDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        notification: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      take: 100, // Process in batches
    });

    if (readyDeliveries.length === 0) return;

    for (const delivery of readyDeliveries) {
      const { notification } = delivery;

      // Check if notification has been read - if yes, cancel remaining escalations
      if (notification.read) {
        await cancelEscalation(notification.id);
        continue;
      }

      // Send to the scheduled channel
      try {
        await publishToChannel(delivery.channel as any, notification.userId, {
          eventId: delivery.notificationId,
          message: notification.message,
          type: notification.type,
          channels: [delivery.channel as any],
          recipientIds: [notification.userId],
          senderId: "system",
          priority: "normal",
        } as any);

        // Update delivery status to SENT
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "SENT",
            attemptCount: { increment: 1 },
            lastAttemptAt: now,
            deliveredAt: now,
          },
        });

        console.log(`✅ Escalated notification ${notification.id} to ${delivery.channel}`);
      } catch (error) {
        // Mark as failed and retry later
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: delivery.attemptCount >= 3 ? "FAILED" : "SCHEDULED",
            attemptCount: { increment: 1 },
            lastAttemptAt: now,
            error: error instanceof Error ? error.message : "Unknown error",
            // Retry in 5 minutes if not exceeded max attempts
            scheduledFor: delivery.attemptCount < 3 
              ? new Date(now.getTime() + 5 * 60 * 1000)
              : delivery.scheduledFor,
          },
        });

        console.error(`❌ Failed to escalate notification ${notification.id}:`, error);
      }
    }

    if (readyDeliveries.length > 0) {
      console.log(`📊 Processed ${readyDeliveries.length} escalation deliveries`);
    }
  } catch (error) {
    console.error("❌ Error processing escalations:", error);
  }
}

/**
 * Cancel all pending escalations for a notification (called when notification is read)
 */
async function cancelEscalation(notificationId: string) {
  try {
    const result = await prisma.notificationDelivery.updateMany({
      where: {
        notificationId,
        status: { in: ["PENDING", "SCHEDULED"] },
      },
      data: {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
    });

    if (result.count > 0) {
      console.log(`🚫 Cancelled ${result.count} escalations for notification ${notificationId}`);
    }
  } catch (error) {
    console.error(`❌ Error cancelling escalation for ${notificationId}:`, error);
  }
}

/**
 * Schedule escalation deliveries for a notification
 * Called by the router when a notification uses ESCALATION strategy
 */
export async function scheduleEscalation(
  notificationId: string,
  userId: string,
  channels: { email?: string; sms?: string }
) {
  const now = new Date();

  // Schedule SMS delivery (10 minutes after in-app)
  if (channels.sms) {
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: "SMS",
        status: "SCHEDULED",
        scheduledFor: new Date(now.getTime() + ESCALATION_DELAYS.SMS),
        metadata: { phoneNumber: channels.sms },
      },
    });
  }

  // Schedule EMAIL delivery (40 minutes after in-app)
  if (channels.email) {
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: "EMAIL",
        status: "SCHEDULED",
        scheduledFor: new Date(now.getTime() + ESCALATION_DELAYS.EMAIL),
        metadata: { emailAddress: channels.email },
      },
    });
  }

  console.log(`📅 Scheduled escalations for notification ${notificationId}`);
}

/**
 * Consumer for notification read events
 * Cancels escalation when user reads the notification
 */
let readConsumer: Consumer | null = null;

async function startReadEventConsumer() {
  readConsumer = kafka.consumer({ groupId: "escalation-read-group" });

  await readConsumer.connect();
  await readConsumer.subscribe({ topic: "notification.read", fromBeginning: false });

  console.log("👀 Escalation worker listening for read events...");

  await readConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString();
        if (!value) return;

        const event = JSON.parse(value);
        const { notificationId } = event;

        if (notificationId) {
          await cancelEscalation(notificationId);
        }
      } catch (error) {
        console.error("❌ Error processing read event:", error);
      }
    },
  });
}

/**
 * Start the escalation worker
 * Runs periodic checks for scheduled deliveries
 */
let escalationInterval: NodeJS.Timeout | null = null;

async function startEscalationWorker() {
  console.log("🚀 Starting Escalation Worker...");

  try {
    // Start the read event consumer
    await startReadEventConsumer();
  } catch (error) {
    console.error("❌ Failed to start read event consumer:", error);
    throw error;
  }

  // Process escalations every 30 seconds and store the handle
  escalationInterval = setInterval(async () => {
    await processEscalation();
  }, 30 * 1000);

  // Initial processing
  await processEscalation();

  console.log("✅ Escalation Worker ready - checking every 30 seconds");
}

// Start the worker
startEscalationWorker().catch(console.error);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down escalation worker...");
  
  // Clear the escalation interval
  if (escalationInterval) {
    clearInterval(escalationInterval);
    console.log("✓ Escalation interval cleared");
  }

  // Stop and disconnect Kafka consumer
  if (readConsumer) {
    try {
      await readConsumer.stop();
      await readConsumer.disconnect();
      console.log("✓ Read event consumer disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting read consumer:", error);
    }
  }

  // Disconnect Prisma
  await prisma.$disconnect();
  console.log("✓ Prisma disconnected");
  
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  SIGTERM: Shutting down escalation worker...");
  
  // Clear the escalation interval
  if (escalationInterval) {
    clearInterval(escalationInterval);
    console.log("✓ Escalation interval cleared");
  }

  // Stop and disconnect Kafka consumer
  if (readConsumer) {
    try {
      await readConsumer.stop();
      await readConsumer.disconnect();
      console.log("✓ Read event consumer disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting read consumer:", error);
    }
  }

  // Disconnect Prisma
  await prisma.$disconnect();
  console.log("✓ Prisma disconnected");
  
  process.exit(0);
});
