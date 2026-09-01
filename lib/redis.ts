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
    globalForRedis.redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    });
    globalForRedis.redis.on("error", (error) => {
      console.error("Redis connection error", error);
    });
  }

  if (!globalForRedis.redis.isOpen) {
    try {
      globalForRedis.redisConnection ??= globalForRedis.redis.connect().then(() => globalForRedis.redis!);
      await globalForRedis.redisConnection;
    } catch (error) {
      globalForRedis.redisConnection = undefined;
      console.warn("Could not connect to Redis", error);
      return null;
    }
  }

  return globalForRedis.redis.isReady ? globalForRedis.redis : null;
}
