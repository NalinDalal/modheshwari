import { startRouterConsumer } from "./kafka/workers/router-consumer";
import { startEmailConsumer } from "./kafka/workers/email-consumer";
import { startPushConsumer } from "./kafka/workers/push-consumer";
import { startSmsConsumer } from "./kafka/workers/sms-consumer";

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
  console.log("🚀 Starting Notification Workers...\n");
  console.log("Environment:");
  console.log("  Kafka Broker:", process.env.KAFKA_BROKER || "localhost:9092");
  console.log("  Email Provider:", process.env.EMAIL_PROVIDER || "console");
  console.log("  Push Provider:", process.env.PUSH_PROVIDER || "console");
  console.log("  SMS Provider:", process.env.SMS_PROVIDER || "console");
  console.log("\n" + "=".repeat(50) + "\n");

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
      console.error("\n❌ Some workers failed to start:");
      failures.forEach((f) => {
        if (f.status === "rejected") {
          console.error(f.reason);
        }
      });
      process.exit(1);
    }

    console.log("\n✅ All workers started successfully!");
    console.log("Workers are now processing notifications...\n");
    console.log("Press Ctrl+C to stop\n");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Shutting down workers...");
      // Kafka consumers will disconnect automatically
      console.log("✓ Workers stopped");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n\n🛑 Received SIGTERM, shutting down...");
      console.log("✓ Workers stopped");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start workers:", error);
    process.exit(1);
  }
}

// Start the workers
startWorkers().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
