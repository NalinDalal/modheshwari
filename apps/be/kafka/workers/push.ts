import { createConsumer, TOPICS } from "../config";
import type { EachMessagePayload } from "kafkajs";

/**
 * Performs start push consumer operation.
 * @returns {Promise<void>} Description of return value
 */
export async function startPushConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-push");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_PUSH,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      console.log("[Push] Received:", {
        topic,
        partition,
        key: message.key?.toString(),
        value: message.value?.toString(),
      });
      // TODO: deliver push notification
    },
  });
}
