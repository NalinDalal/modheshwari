import { Kafka } from "kafkajs";

// Kafka configuration
export const kafka = new Kafka({
  clientId: "modheshwari-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

// Create producer instance
export const producer = kafka.producer();

// Create consumer instance with a consumer group
export const createConsumer = (groupId: string) => {
  return kafka.consumer({ groupId });
};

// Topics
export const TOPICS = {
  QUICKSTART_EVENTS: "quickstart-events",
  PAYMENT_DONE: "payment-done",
  NOTIFICATION_EVENTS: "notification.events",
  NOTIFICATION_EMAIL: "notification.email",
  NOTIFICATION_PUSH: "notification.push",
  NOTIFICATION_SMS: "notification.sms",
} as const;
