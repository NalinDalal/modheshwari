import { producer, TOPICS } from "./config";

/**
 * Performs main operation.
 * @returns {Promise<void>} Description of return value
 */
async function main() {
  try {
    // Connect the producer
    await producer.connect();

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
    }

    // Disconnect
    await producer.disconnect();
  } catch (error) {
    process.exit(1);
  }
}

main();
