import { createClient, type RedisClientType } from "redis";

type CarteRedis = RedisClientType;

const globalForRedis = globalThis as unknown as {
  redis?: CarteRedis;
  redisConnection?: Promise<CarteRedis | null>;
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

  if (!globalForRedis.redis.isReady) {
    globalForRedis.redisConnection ??= (async () => {
      const redis = globalForRedis.redis!;
      if (redis.isOpen) {
        try {
          await redis.disconnect();
        } catch {
          // A timed-out connection may already be closed by the client.
        }
      }
      await redis.connect();
      return redis;
    })()
      .catch((error) => {
        console.warn("Could not connect to Redis", error);
        try {
          if (globalForRedis.redis?.isOpen) {
            void globalForRedis.redis.disconnect();
          }
        } catch {
          // Ignore cleanup errors; the next call will create a fresh attempt.
        }
        return null;
      })
      .finally(() => {
        if (!globalForRedis.redis?.isReady) {
          globalForRedis.redisConnection = undefined;
        }
      });
    await globalForRedis.redisConnection;
  }

  return globalForRedis.redis.isReady ? globalForRedis.redis : null;
}
