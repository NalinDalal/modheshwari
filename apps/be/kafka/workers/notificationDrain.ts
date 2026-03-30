import type { RedisClientType } from 'redis';
import prisma from '@modheshwari/db';
import getRedisClient from '../../lib/redisClient';
import { errorCounter } from '../../lib/metrics';
import { logger } from '../../lib/logger';

const DLQ_KEY = 'notifications:dlq';
const NOTIFICATION_KEY_PATTERN = 'notifications:*';
const BATCH_SIZE = Number(process.env.NOTIFICATION_DRAIN_BATCH_SIZE || 500);
const SCAN_COUNT = Number(process.env.NOTIFICATION_DRAIN_SCAN_COUNT || 100);

async function parseCached(item: string) {
  try {
    return JSON.parse(item);
  } catch (err) {
    return null;
  }
}

export async function drainOnce(redis?: RedisClientType | null) {
  const client = redis || (await getRedisClient());
  let drained = 0;
  try {
    // Use SCAN to iterate keys matching notifications:*
    // Note: scanIterator is supported by node-redis v4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore - redis types for scanIterator can be complicated in this repo
    for await (const key of client.scanIterator({ MATCH: NOTIFICATION_KEY_PATTERN, COUNT: SCAN_COUNT })) {
      try {
        const k = String(key);
        const items = await client.lRange(k, 0, -1);
        if (!items || items.length === 0) continue;

        const parsed = items.map((it) => parseCached(it)).filter(Boolean) as any[];
        if (parsed.length === 0) {
          // nothing valid to persist; remove key to avoid infinite loop
          try {
            await client.del(key);
          } catch (e) {
            logger.warn('Failed to delete invalid notification key', { key, error: String(e) });
          }
          continue;
        }

        // Map to prisma shape (assumes fanout-worker shape)
        const data = parsed.map((p) => ({
          userId: p.userId,
          type: p.type || 'GENERIC',
          message: p.message || p.body || p.title || '',
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          fanoutId: p.fanoutId || null,
        }));

        try {
          // Persist in DB
          // Use createMany for bulk insert
          await prisma.notification.createMany({ data, skipDuplicates: true });
          // remove key after successful persist
          await client.del(key);
          drained += data.length;
        } catch (dbErr) {
          // On DB failure, push items to DLQ for later inspection/retry
          errorCounter.inc({ type: 'notification_drain_db' }, 1);
          logger.error('Failed to persist notifications; moving to DLQ', { key, error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
          for (const p of parsed) {
            try {
              await client.rPush(DLQ_KEY, JSON.stringify({ item: p, attempts: 1, error: String(dbErr), cachedAt: new Date().toISOString() }));
            } catch (e) {
              logger.warn('Failed to push notification to DLQ', { error: e instanceof Error ? e.message : String(e), item: p });
            }
          }
          // keep the original key for retry, but break to avoid tight loop
          continue;
        }
      } catch (e) {
        logger.warn('Error processing redis key during drain', { key: String((e as any)?.key || ''), error: e instanceof Error ? e.message : String(e) });
      }
    }
  } catch (err) {
    logger.error('Notification drain failed', { error: err instanceof Error ? err.message : String(err) });
    errorCounter.inc({ type: 'notification_drain_scan' }, 1);
  }

  logger.info('Notification drain completed', { drained });
  return drained;
}

export function startNotificationDrain(intervalMs = Number(process.env.NOTIFICATION_DRAIN_INTERVAL_MS || 1000 * 60 * 5)) {
  let running = true;
  const redisPromise = getRedisClient();

  async function tick() {
    if (!running) return;
    const redis = await redisPromise;
    try {
      await drainOnce(redis);
    } catch (err) {
      logger.error('Periodic notification drain tick failed', { error: err instanceof Error ? err.message : String(err) });
    }
    if (running) setTimeout(tick, intervalMs);
  }

  // start immediately
  setTimeout(tick, 0);

  return {
    stop() {
      running = false;
    },
  };
}

export default startNotificationDrain;
