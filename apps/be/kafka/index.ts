import { producer, createConsumer, TOPICS } from "./config";

async function main() {
  const consumer = createConsumer("modheshwari-demo-group");

  try {
    console.log("Starting Kafka demo...\n");

    // Connect producer and consumer
    await producer.connect();
    console.log("✓ Producer connected");

    await consumer.connect();
    console.log("✓ Consumer connected\n");

    // Subscribe to topics
    await consumer.subscribe({
      topic: TOPICS.QUICKSTART_EVENTS,
      fromBeginning: true,
    });

    await consumer.subscribe({
      topic: TOPICS.PAYMENT_DONE,
      fromBeginning: true,
    });

    console.log("✓ Subscribed to topics\n");

    // Start consuming messages
    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log("📨 Message received:");
        console.log({
          topic: topic,
          partition: partition,
          offset: message.offset,
          key: message.key?.toString(),
          value: message.value?.toString(),
        });
        console.log("");
      },
    });

    // Send some test messages
    console.log("Sending test messages...\n");

    // Basic message
    await producer.send({
      topic: TOPICS.QUICKSTART_EVENTS,
      messages: [
        {
          value: "Hello from Kafka!",
        },
      ],
    });
    console.log("✓ Sent message to quickstart-events");

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
    console.log("✓ Sent payment message for user1\n");

    // Keep the process running to receive messages
    console.log("Listening for messages... (Press Ctrl+C to exit)\n");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\nShutting down...");
      await producer.disconnect();
      await consumer.disconnect();
      console.log("✓ Disconnected");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    await producer.disconnect();
    await consumer.disconnect();
    process.exit(1);
  }
}

main();
