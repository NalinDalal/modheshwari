import { createConsumer, TOPICS } from "../config";
import type { EachMessagePayload } from "kafkajs";

/**
 * Performs start router consumer operation.
 * @returns {Promise<void>} Description of return value
 */
export async function startRouterConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-router");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_EVENTS,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      console.log("[Router] Received:", {
        topic,
        partition,
        key: message.key?.toString(),
        value: message.value?.toString(),
      });
      // TODO: route to channels based on preferences
    },
  });
}
