import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function getRedisClient(url?: string): Promise<RedisClientType> {
  if (client) return client;
  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';
  client = createClient({ url: redisUrl });
  client.on('error', (err: Error) => {
    console.error('Redis client error', err instanceof Error ? err.message : String(err));
  });
  await client.connect();
  return client;
}

export async function quitRedisClient() {
  try {
    if (client) {
      await client.quit();
      client = null;
    }
  } catch (err) {
    console.warn('Failed to quit redis client', err);
  }
}

export default getRedisClient;
