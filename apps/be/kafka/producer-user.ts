import { producer, TOPICS } from "./config";

/**
 * Performs main operation.
 * @returns {Promise<void>} Description of return value
 */
async function main() {
  try {
    // Connect the producer
    await producer.connect();
    console.log("Producer connected successfully");

    // Send a message with a key (for partitioning)
    // All messages with the same key will go to the same partition
    await producer.send({
      topic: TOPICS.PAYMENT_DONE,
      messages: [
        {
          value: "Payment processed for user1",
          key: "user1", // This ensures all user1 messages go to the same partition
        },
      ],
    });

    console.log("Message sent to payment-done topic with key 'user1'");

    // Send more messages to test partitioning
    for (let i = 1; i <= 5; i++) {
      await producer.send({
        topic: TOPICS.PAYMENT_DONE,
        messages: [
          {
            value: `Payment ${i} for user1`,
            key: "user1",
          },
        ],
      });
      console.log(`Message ${i} sent`);
    }

    // Disconnect
    await producer.disconnect();
    console.log("Producer disconnected");
  } catch (error) {
    console.error("Error in producer:", error);
    process.exit(1);
  }
}

main();
