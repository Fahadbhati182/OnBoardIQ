import redisClient from "../config/redis.js";

export const EMPLOYEE_LIST_CACHE_NAMESPACE = "employees-list";

function logCacheFailure(operation, error) {
  console.warn(
    `Redis cache ${operation} failed:`,
    error instanceof Error ? error.message : String(error),
  );
}

export async function getCachedJson(key) {
  if (!redisClient.isReady) return null;

  try {
    const value = await redisClient.get(key);
    return value === null ? null : JSON.parse(value);
  } catch (error) {
    logCacheFailure("read", error);
    return null;
  }
}

export async function setCachedJson(key, value, ttlSeconds) {
  if (!redisClient.isReady) return;

  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    logCacheFailure("write", error);
  }
}

export async function getCacheGeneration(namespace) {
  if (!redisClient.isReady) return null;

  const key = `onboardiq:cache-generation:${namespace}`;
  try {
    let generation = await redisClient.get(key);
    if (generation === null) {
      await redisClient.set(key, "0", { NX: true });
      generation = await redisClient.get(key);
    }
    return generation;
  } catch (error) {
    logCacheFailure("generation read", error);
    return null;
  }
}

export async function invalidateCacheGeneration(namespace) {
  if (!redisClient.isReady) return;

  try {
    await redisClient.incr(`onboardiq:cache-generation:${namespace}`);
  } catch (error) {
    logCacheFailure("invalidation", error);
  }
}
