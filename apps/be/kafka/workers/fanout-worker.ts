import type { RedisClientType } from 'redis';

export interface FanoutMessage {
  fanoutId?: string;
  initiatedBy?: string;
  recipientIds: string[];
  channels: string[];
  message: any;
  priority?: string;
}

/**
 * Performs process fanout message operation.
 * @param {{ prisma: any; producer?: any; msg: import("/Users/nalindalal/modheshwari/apps/be/kafka/workers/fanout-worker").FanoutMessage; chunkSize?: number; }} opts - Description of opts
 * @returns {Promise<{ created: number; }>} Description of return value
 */
export async function processFanoutMessage(opts: {
  prisma: any;
  producer?: any;
  redis?: RedisClientType | null;
  msg: FanoutMessage;
  chunkSize?: number;
}) {
  const { prisma, producer, redis = null, msg, chunkSize = 500 } = opts;
  if (!prisma) throw new Error('prisma required');
  if (!msg || !Array.isArray(msg.recipientIds)) throw new Error('invalid message');

  const recipientIds = msg.recipientIds;
  const chunks: string[][] = [];
  for (let i = 0; i < recipientIds.length; i += chunkSize) {
    chunks.push(recipientIds.slice(i, i + chunkSize));
  }

  let created = 0;

  // Update audit status to PROCESSING if audit exists
  if (msg.fanoutId) {
    try {
      await prisma.fanoutAudit.updateMany({
        where: { fanoutId: msg.fanoutId },
        data: { status: 'PROCESSING' },
      });
    } catch (e) {
      console.warn('Failed to mark fanout audit PROCESSING', e);
    }
  }

  try {
    for (const chunk of chunks) {
      const data = chunk.map((id) => ({
        userId: id,
        type: msg.message?.type || 'ANNOUNCEMENT',
        title: msg.message?.title || null,
        body: typeof msg.message === 'string' ? msg.message : msg.message?.body || null,
        createdAt: new Date(),
        fanoutId: msg.fanoutId || null,
      }));

      if (redis) {
        // Cache notifications per-user in Redis list for quick reads and later persistence
        const TTL = Number(process.env.NOTIFICATION_CACHE_TTL_SECONDS || 60 * 60 * 24 * 7); // default 7 days
        for (const item of data) {
          const key = `notifications:${item.userId}`;
          try {
            await redis.rPush(key, JSON.stringify({ ...item, cachedAt: new Date().toISOString() }));
            await redis.expire(key, TTL);
          } catch (e) {
            console.warn('Failed to write notification to redis cache for', item.userId, e);
          }
        }
        created += data.length;
      } else {
        // prisma.notification.createMany is expected; in tests this is mocked
        await prisma.notification.createMany({ data });
        created += data.length;
      }
    }

    // Emit a routing event so downstream workers pick up channel-specific work
    if (producer && typeof producer.send === 'function') {
      await producer.send({
        topic: 'notification.events',
        messages: [
          {
            value: JSON.stringify({
              fanoutId: msg.fanoutId,
              initiatedBy: msg.initiatedBy,
              channels: msg.channels,
              message: msg.message,
              recipientCount: recipientIds.length,
            }),
          },
        ],
      });
    }

    // Mark audit completed
    if (msg.fanoutId) {
      try {
        await prisma.fanoutAudit.updateMany({
          where: { fanoutId: msg.fanoutId },
          data: { status: 'COMPLETED', processedAt: new Date(), processedCount: created },
        });
      } catch (e) {
        console.warn('Failed to mark fanout audit COMPLETED', e);
      }
    }

    return { created };
  } catch (err: any) {
    // Attempt to mark audit FAILED with error
    if (msg.fanoutId) {
      try {
        await prisma.fanoutAudit.updateMany({
          where: { fanoutId: msg.fanoutId },
          data: { status: 'FAILED', error: String(err?.message || err) },
        });
      } catch (e) {
        console.warn('Failed to mark fanout audit FAILED', e);
      }
    }

    console.error('processFanoutMessage failed:', err);
    throw err;
  }
}

export default processFanoutMessage;
