/**
 * Simple in-memory cache service for performance optimization
 * Caches frequently accessed data with automatic expiration
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Run cleanup every 5 minutes to remove expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache with TTL (time to live)
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a single value from cache (exact key match)
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all cache entries whose keys START WITH the given prefix.
   * Use this instead of delete('tests:all') — the tests list cache uses
   * parameterised keys like `tests:TERM_1:2026:::`, so a prefix bust is
   * the only reliable way to invalidate every variant at once.
   *
   * @example  cacheService.deleteByPrefix('tests:')   // all test list keys
   * @example  cacheService.deleteByPrefix('results:') // all result keys
   * @example  cacheService.deleteByPrefix('grading:') // all grading keys
   */
  deleteByPrefix(prefix: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Clear ALL cache entries (use after a database reset)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[CACHE] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Destroy the service (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cleanup on process exit
process.on('exit', () => {
  cacheService.destroy();
});
process.on('SIGINT', () => {
  cacheService.destroy();
  process.exit(0);
});
