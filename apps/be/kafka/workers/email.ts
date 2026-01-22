import { createConsumer, TOPICS } from "../config";
import type { EachMessagePayload } from "kafkajs";

export async function startEmailConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-email");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_EMAIL,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      console.log("[Email] Received:", {
        topic,
        partition,
        key: message.key?.toString(),
        value: message.value?.toString(),
      });
      // TODO: deliver email
    },
  });
}
