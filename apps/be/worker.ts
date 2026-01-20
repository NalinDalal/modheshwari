#!/usr/bin/env node

/**
 * Notification Worker Process
 * Run this as a separate process to consume and deliver notifications
 * 
 * Usage:
 *   npm run worker:notifications
 * 
 * Or run specific consumers:
 *   CONSUMER_TYPE=email npm run worker:notifications
 *   CONSUMER_TYPE=push npm run worker:notifications
 *   CONSUMER_TYPE=router npm run worker:notifications
 */

import {
  startAllConsumers,
  startNotificationRouter,
  startEmailConsumer,
  startPushConsumer,
  startSmsConsumer,
} from "./services/notificationConsumers";
import { disconnectKafka } from "./services/kafka";

const consumerType = process.env.CONSUMER_TYPE || "all";

async function main() {
  console.log(` Starting notification worker (type: ${consumerType})...`);

  try {
    switch (consumerType) {
      case "router":
        await startNotificationRouter();
        break;

      case "email":
        await startEmailConsumer();
        break;

      case "push":
        await startPushConsumer();
        break;

      case "sms":
        await startSmsConsumer();
        break;

      case "all":
      default:
        await startAllConsumers();
        break;
    }

    console.log(" Notification worker started successfully");
  } catch (error) {
    console.error(" Failed to start notification worker:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n Received SIGINT, shutting down gracefully...");
  await disconnectKafka();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n Received SIGTERM, shutting down gracefully...");
  await disconnectKafka();
  process.exit(0);
});

main();
