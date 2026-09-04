import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";

export type RateLimitResult = {
  available: boolean;
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export async function consumeRateLimit(
  scope: string,
  identifier: string,
  options: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + options.windowSeconds;
  const redis = await getRedis();
  if (!redis) {
    return { available: false, allowed: false, limit: options.limit, remaining: 0, resetAt };
  }

  const digest = createHash("sha256").update(identifier).digest("hex");
  const key = `carte:rate-limit:${scope}:${digest}`;
  let results: unknown[];
  try {
    results = await redis.multi().incr(key).expire(key, options.windowSeconds).exec() as unknown[];
  } catch (error) {
    console.warn("Could not update rate limit in Redis", error);
    return { available: false, allowed: false, limit: options.limit, remaining: 0, resetAt };
  }
  const count = Number(results?.[0] ?? 0);
  const remaining = Math.max(0, options.limit - count);
  return {
    available: true,
    allowed: count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt,
  };
}

export function getRequestIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return forwarded || real || "unknown";
}

export function setRateLimitHeaders(response: Response, result: RateLimitResult) {
  response.headers.set("RateLimit-Limit", String(result.limit));
  response.headers.set("RateLimit-Remaining", String(result.remaining));
  response.headers.set("RateLimit-Reset", String(result.resetAt));
  if (!result.allowed) {
    response.headers.set("Retry-After", String(Math.max(1, result.resetAt - Math.floor(Date.now() / 1000))));
  }
  return response;
}
