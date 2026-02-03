import { producer, createConsumer, TOPICS } from "./config";

/**
 * Performs main operation.
 * @returns {Promise<void>} Description of return value
 */
async function startKafka() {
  const consumer = createConsumer("modheshwari-demo-group");

  try {
    // Connect producer and consumer
    await producer.connect();

    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({
      topic: TOPICS.QUICKSTART_EVENTS,
      fromBeginning: true,
    });

    await consumer.subscribe({
      topic: TOPICS.PAYMENT_DONE,
      fromBeginning: true,
    });

    // Start consuming messages
    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
      },
    });

    // Send some test messages

    // Basic message
    await producer.send({
      topic: TOPICS.QUICKSTART_EVENTS,
      messages: [
        {
          value: "Hello from Kafka!",
        },
      ],
    });

    // Message with key (for partitioning)
    await producer.send({
      topic: TOPICS.PAYMENT_DONE,
      messages: [
        {
          value: JSON.stringify({
            userId: "user1",
            amount: 100,
            timestamp: new Date().toISOString(),
          }),
          key: "user1",
        },
      ],
    });

    // Keep the process running to receive messages
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      await producer.disconnect();
      await consumer.disconnect();
      process.exit(0);
    });
  } catch (error) {
    await producer.disconnect();
    await consumer.disconnect();
    process.exit(1);
  }
}

startKafka();
