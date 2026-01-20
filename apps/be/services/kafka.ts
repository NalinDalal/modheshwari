import { Kafka, Producer, Consumer, EachMessagePayload } from "kafkajs";

/**
 * Kafka Service for event-driven notification system
 * Provides pub/sub messaging for decoupled, scalable notifications
 */

const kafka = new Kafka({
  clientId: "modheshwari-notification-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;

/**
 * Initialize Kafka producer
 */
export async function initProducer(): Promise<Producer> {
  if (producer) return producer;

  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  await producer.connect();
  console.log(" Kafka Producer connected");

  return producer;
}

/**
 * Initialize Kafka consumer with group ID
 */
export async function initConsumer(groupId: string): Promise<Consumer> {
  consumer = kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  await consumer.connect();
  console.log(` Kafka Consumer connected (group: ${groupId})`);

  return consumer;
}

/**
 * Publish message to Kafka topic
 */
export async function publishMessage(
  topic: string,
  message: any,
  key?: string,
): Promise<void> {
  const prod = await initProducer();

  await prod.send({
    topic,
    messages: [
      {
        key: key || null,
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
      },
    ],
  });
}

/**
 * Subscribe to topic and process messages
 */
export async function subscribeToTopic(
  topic: string,
  groupId: string,
  handler: (payload: EachMessagePayload) => Promise<void>,
): Promise<void> {
  const cons = await initConsumer(groupId);

  await cons.subscribe({
    topic,
    fromBeginning: false,
  });

  await cons.run({
    eachMessage: async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`Error processing message from ${topic}:`, error);
        // In production, send to dead-letter queue
      }
    },
  });
}

/**
 * Graceful shutdown
 */
export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    console.log("Kafka Producer disconnected");
  }
  if (consumer) {
    await consumer.disconnect();
    console.log("Kafka Consumer disconnected");
  }
}

// Topics
export const TOPICS = {
  NOTIFICATION_EVENTS: "notification.events",
  EMAIL_NOTIFICATIONS: "notification.email",
  PUSH_NOTIFICATIONS: "notification.push",
  SMS_NOTIFICATIONS: "notification.sms",
  IN_APP_NOTIFICATIONS: "notification.in-app",
} as const;
