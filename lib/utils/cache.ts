/**
 * Simple in-memory cache implementation with TTL support
 */

interface CacheItem<T> {
  value: T
  expiresAt: number
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      return null
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      this.stats.deletes++
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return item.value as T
  }

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttlMs
    this.cache.set(key, { value, expiresAt })
    this.stats.sets++
    this.updateSize()
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
      this.updateSize()
    }
    return deleted
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      this.stats.deletes++
      return false
    }

    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.stats.deletes += size
    this.updateSize()
  }

  /**
   * Get or set pattern - useful for expensive operations
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs: number = 5 * 60 * 1000): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    this.set(key, value, ttlMs)
    return value
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.stats.deletes += cleaned
      this.updateSize()
    }

    return cleaned
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get all keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  private updateSize(): void {
    this.stats.size = this.cache.size
  }
}

// Create singleton instance
export const memoryCache = new MemoryCache()

// Auto-cleanup every 5 minutes
setInterval(
  () => {
    const cleaned = memoryCache.cleanup()
    // Cache cleanup completed silently
  },
  5 * 60 * 1000,
)

// Export the class for creating additional instances if needed
export { MemoryCache }

// Export types
export type { CacheStats }
