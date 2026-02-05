import { createConsumer, TOPICS } from '../config';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

interface NotificationEvent {
  eventId?: string;
  fanoutId?: string;
  recipientIds: string[];
  channels: string[];
  message: any;
}

// Publish IN_APP notifications to Redis so WebSocket servers (clustered) can pick them up
/**
 * Performs run in app worker operation.
 * @param {string} redisUrl - Description of redisUrl
 * @returns {Promise<void>} Description of return value
 */
export async function runInAppWorker(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
  const consumer = createConsumer('in-app-worker-group');
  const redis: RedisClientType = createClient({ url: redisUrl });

  await redis.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.NOTIFICATION_EVENTS, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const raw = message.value?.toString();
        if (!raw) return;
        const payload = JSON.parse(raw) as NotificationEvent;

        if (!payload.channels || !payload.recipientIds) return;

        if (!payload.channels.includes('IN_APP')) return; // only handle in-app here

        // publish per-recipient to redis channel
        for (const rid of payload.recipientIds) {
          const payloadMsg = JSON.stringify({ recipientId: rid, notification: payload });
          // channel: inapp:{userId}
          await redis.publish(`inapp:${rid}`, payloadMsg);
        }
      } catch (err) {
        console.error('in-app worker error', err);
      }
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInAppWorker().catch((e) => {
    console.error('in-app worker failed', e);
    process.exit(1);
  });
}

export default runInAppWorker;