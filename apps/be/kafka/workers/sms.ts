import { createConsumer, TOPICS } from "../config";
import type { EachMessagePayload } from "kafkajs";

/**
 * Performs start sms consumer operation.
 * @returns {Promise<void>} Description of return value
 */
export async function startSmsConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-sms");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_SMS,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      console.log("[SMS] Received:", {
        topic,
        partition,
        key: message.key?.toString(),
        value: message.value?.toString(),
      });
      // TODO: deliver SMS
    },
  });
}
