import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
export const redis = new Redis(redisUrl)

export async function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl = 60): Promise<T> {
  try {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached) as T
    const data = await fetcher()
    await redis.setex(key, ttl, JSON.stringify(data))
    return data
  } catch (err) {
    console.error('Redis error', err)
    return fetcher()
  }
}

export async function invalidateCache(pattern: string) {
  try {
    // Use SCAN for better performance in production with large datasets
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, matchedKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Redis invalidateCache error:', err);
    // Fallback to keys command if scan fails
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch (fallbackErr) {
      console.error('Redis fallback invalidateCache error:', fallbackErr);
    }
  }
}
