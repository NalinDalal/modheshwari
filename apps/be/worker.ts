import { startRouterConsumer } from "./kafka/workers/router";
import { startEmailConsumer } from "./kafka/workers/email";
import { startPushConsumer } from "./kafka/workers/push";
import { startSmsConsumer } from "./kafka/workers/sms";

/**
 * Notification Worker Process
 *
 * Starts all Kafka consumers to process notifications across different channels:
 * - Router: Routes events to appropriate channels based on user preferences
 * - Email: Sends email notifications
 * - Push: Sends push notifications
 * - SMS: Sends SMS notifications
 *
 * Usage:
 *   npm run worker:notifications
 *
 * Environment Variables:
 *   KAFKA_BROKER - Kafka broker address (default: localhost:9092)
 *   EMAIL_PROVIDER - Email provider: smtp | sendgrid | ses | console
 *   PUSH_PROVIDER - Push provider: fcm | apns | console
 *   SMS_PROVIDER - SMS provider: twilio | aws-sns | console
 */

async function startWorkers() {
  try {
    // Start all consumers in parallel
    const workers = await Promise.allSettled([
      startRouterConsumer(),
      startEmailConsumer(),
      startPushConsumer(),
      startSmsConsumer(),
    ]);

    // Check if any worker failed to start
    const failures = workers.filter((w) => w.status === "rejected");
    if (failures.length > 0) {
      process.exit(1);
    }

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      // Kafka consumers will disconnect automatically
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      process.exit(0);
    });
  } catch (error) {
    process.exit(1);
  }
}

// Start the workers
startWorkers().catch((error) => {
  process.exit(1);
});
