/**
 * Frontend API Cache + Request Deduplication
 *
 * Provides:
 *  - Per-entry TTL caching (replaces the old single-TTL dataCache)
 *  - In-flight request deduplication: identical GET calls that arrive while
 *    a previous identical call is still in-flight share the same Promise,
 *    preventing duplicate network requests.
 */

// ── Cache store ───────────────────────────────────────────────────────────────
const _cache = new Map(); // key → { data, expiresAt }

// Default TTLs in milliseconds
export const TTL = {
  SHORT:    30  * 1000,  //  30 s  — results, frequently mutated data
  MEDIUM:   2   * 60 * 1000, //  2 min — tests list, learners list
  LONG:     10  * 60 * 1000, // 10 min — grading systems, streams, config
  VERY_LONG: 30 * 60 * 1000, // 30 min — static lookup tables
};

export function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.data;
}

export function cacheSet(key, data, ttl = TTL.MEDIUM) {
  _cache.set(key, { data, expiresAt: Date.now() + ttl });
}

export function cacheDel(key) {
  if (key) { _cache.delete(key); }
  else { _cache.clear(); }
}

/** Delete all keys whose string representation contains `prefix` */
export function cacheDelPrefix(prefix) {
  for (const k of _cache.keys()) {
    if (k.startsWith(prefix)) _cache.delete(k);
  }
}

// ── In-flight deduplication ───────────────────────────────────────────────────
const _inflight = new Map(); // key → Promise

/**
 * Run `fn` at most once for a given `key` while it is in-flight.
 * Subsequent callers with the same key share the same Promise.
 */
export async function dedupe(key, fn) {
  if (_inflight.has(key)) return _inflight.get(key);
  const promise = fn().finally(() => _inflight.delete(key));
  _inflight.set(key, promise);
  return promise;
}

/**
 * Convenience: cache + dedupe a GET.
 * @param {string} key      Cache + dedupe key
 * @param {Function} fn     Async fetch function
 * @param {number} ttl      Cache TTL in ms (default: TTL.MEDIUM)
 */
export async function cachedFetch(key, fn, ttl = TTL.MEDIUM) {
  const hit = cacheGet(key);
  if (hit !== null) return hit;

  const data = await dedupe(key, fn);
  cacheSet(key, data, ttl);
  return data;
}
