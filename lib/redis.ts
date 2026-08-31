import { createClient, type RedisClientType } from "redis";

type CarteRedis = RedisClientType;

const globalForRedis = globalThis as unknown as {
  redis?: CarteRedis;
  redisConnection?: Promise<CarteRedis>;
};

export async function getRedis() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!globalForRedis.redis) {
    globalForRedis.redis = createClient({ url: process.env.REDIS_URL });
    globalForRedis.redis.on("error", (error) => {
      console.error("Redis connection error", error);
    });
  }

  if (!globalForRedis.redis.isOpen) {
    globalForRedis.redisConnection ??= globalForRedis.redis.connect().then(() => globalForRedis.redis!);
    await globalForRedis.redisConnection;
  }

  return globalForRedis.redis;
}
