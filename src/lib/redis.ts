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
  const keys = await redis.keys(pattern)
  if (keys.length) await redis.del(...keys)
}
