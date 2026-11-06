/**
 * Cache utilities (optional KV cache for hot data)
 */

/**
 * Cache key prefix
 */
const CACHE_PREFIX = 'luo:v2:';

/**
 * Generate cache key
 */
export function getCacheKey(scope: 'day' | 'month' | 'year', key: string): string {
  return `${CACHE_PREFIX}${scope}:${key}`;
}

/**
 * Get cached data
 */
export async function getCachedData(
  cache: KVNamespace | undefined,
  scope: 'day' | 'month' | 'year',
  key: string
): Promise<unknown | null> {
  if (!cache) return null;

  const cacheKey = getCacheKey(scope, key);
  try {
    const cached = await cache.get(cacheKey);
    if (!cached) return null;
    const parsed: unknown = JSON.parse(cached);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    // Optional cache failures must not prevent reading authoritative R2 data.
    return null;
  }
}

/**
 * Set cache data
 */
export async function setCachedData(
  cache: KVNamespace | undefined,
  scope: 'day' | 'month' | 'year',
  key: string,
  data: string | object,
  ttlSeconds: number = 600
): Promise<void> {
  if (!cache) return;

  const cacheKey = getCacheKey(scope, key);
  const value = typeof data === 'string' ? data : JSON.stringify(data);

  try {
    await cache.put(cacheKey, value, { expirationTtl: ttlSeconds });
  } catch {
    // A failed cache fill must not fail an otherwise successful response.
  }
}

/**
 * Check if should use cache for a date
 * Today's data is hot - use shorter TTL
 * Future data is cold - use longer TTL
 */
export function getCacheTTL(date: string): number {
  const today = new Date().toISOString().split('T')[0];
  const parsedDate = new Date(date);

  // Hot data (today): 10 minutes
  if (date === today) return 600;

  // Recent data (within 7 days): 1 hour
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (parsedDate > weekAgo) return 3600;

  // Old data: 1 day
  return 86400;
}
