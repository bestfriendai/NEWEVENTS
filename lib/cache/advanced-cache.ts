/**
 * Advanced Caching System with Persistence and TTL
 * Provides Redis-like functionality in memory with localStorage persistence
 */

import { logger } from '@/lib/utils/logger'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  tags: string[]
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  totalSize: number
}

class AdvancedCache {
  private cache = new Map<string, CacheItem<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0
  }
  private maxSize: number
  private cleanupInterval: NodeJS.Timeout | null = null
  private persistenceKey = 'events-cache-v1'

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
    this.loadFromPersistence()
    this.startCleanupInterval()
  }

  /**
   * Set cache item with TTL and tags
   */
  set<T>(
    key: string, 
    data: T, 
    ttl = 5 * 60 * 1000, // 5 minutes default
    tags: string[] = []
  ): void {
    try {
      // Check if we need to evict items
      if (this.cache.size >= this.maxSize) {
        this.evictLeastRecentlyUsed()
      }

      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        tags
      }

      this.cache.set(key, item)
      this.stats.sets++
      this.updateTotalSize()
      
      logger.debug('Cache set', { key, ttl, tags, size: this.cache.size })
    } catch (error) {
      logger.error('Cache set error', { key, error })
    }
  }

  /**
   * Get cache item with automatic TTL checking
   */
  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key) as CacheItem<T> | undefined

      if (!item) {
        this.stats.misses++
        return null
      }

      // Check TTL
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key)
        this.stats.misses++
        this.stats.evictions++
        return null
      }

      // Update access statistics
      item.accessCount++
      item.lastAccessed = Date.now()
      this.stats.hits++

      logger.debug('Cache hit', { key, accessCount: item.accessCount })
      return item.data
    } catch (error) {
      logger.error('Cache get error', { key, error })
      this.stats.misses++
      return null
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
      this.updateTotalSize()
    }
    return deleted
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): number {
    let cleared = 0
    const tagSet = new Set(tags)

    for (const [key, item] of this.cache.entries()) {
      if (item.tags.some(tag => tagSet.has(tag))) {
        this.cache.delete(key)
        cleared++
      }
    }

    this.stats.deletes += cleared
    this.updateTotalSize()
    logger.info('Cache cleared by tags', { tags, cleared })
    return cleared
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.stats.deletes += size
    this.updateTotalSize()
    logger.info('Cache cleared', { itemsCleared: size })
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; size: number } {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size
    }
  }

  /**
   * Get all keys with optional tag filter
   */
  getKeys(tag?: string): string[] {
    if (!tag) {
      return Array.from(this.cache.keys())
    }

    return Array.from(this.cache.entries())
      .filter(([_, item]) => item.tags.includes(tag))
      .map(([key]) => key)
  }

  /**
   * Extend TTL for existing item
   */
  extend(key: string, additionalTtl: number): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    item.ttl += additionalTtl
    logger.debug('Cache TTL extended', { key, additionalTtl, newTtl: item.ttl })
    return true
  }

  /**
   * Get or set pattern - fetch data if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 5 * 60 * 1000,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    try {
      const data = await fetcher()
      this.set(key, data, ttl, tags)
      return data
    } catch (error) {
      logger.error('Cache getOrSet fetcher error', { key, error })
      throw error
    }
  }

  /**
   * Batch operations
   */
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key))
  }

  mset<T>(items: Array<{ key: string; data: T; ttl?: number; tags?: string[] }>): void {
    items.forEach(({ key, data, ttl, tags }) => {
      this.set(key, data, ttl, tags)
    })
  }

  /**
   * Evict least recently used items
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return

    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
      logger.debug('Cache evicted LRU item', { key: oldestKey })
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.stats.evictions += cleaned
      this.updateTotalSize()
      logger.debug('Cache cleanup completed', { itemsCleaned: cleaned })
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
      this.saveToPersistence()
    }, 60000) // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.saveToPersistence()
  }

  /**
   * Update total size estimate
   */
  private updateTotalSize(): void {
    this.stats.totalSize = this.cache.size
  }

  /**
   * Save cache to localStorage for persistence
   */
  private saveToPersistence(): void {
    if (typeof window === 'undefined') return

    try {
      const serializable = Array.from(this.cache.entries())
        .filter(([_, item]) => Date.now() - item.timestamp < item.ttl)
        .slice(0, 100) // Limit persistence to 100 most recent items

      localStorage.setItem(this.persistenceKey, JSON.stringify({
        cache: serializable,
        stats: this.stats,
        timestamp: Date.now()
      }))
    } catch (error) {
      logger.warn('Cache persistence save failed', { error })
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromPersistence(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.persistenceKey)
      if (!stored) return

      const { cache, stats, timestamp } = JSON.parse(stored)
      
      // Only load if data is less than 1 hour old
      if (Date.now() - timestamp > 60 * 60 * 1000) {
        localStorage.removeItem(this.persistenceKey)
        return
      }

      // Restore cache items
      for (const [key, item] of cache) {
        if (Date.now() - item.timestamp < item.ttl) {
          this.cache.set(key, item)
        }
      }

      // Restore stats
      this.stats = { ...this.stats, ...stats }
      
      logger.info('Cache loaded from persistence', { 
        itemsLoaded: this.cache.size,
        age: Date.now() - timestamp
      })
    } catch (error) {
      logger.warn('Cache persistence load failed', { error })
      localStorage.removeItem(this.persistenceKey)
    }
  }
}

// Export singleton instance
export const advancedCache = new AdvancedCache(2000) // Increased size for events

// Cache key generators
export const cacheKeys = {
  events: {
    list: (params: Record<string, any>) => `events:list:${JSON.stringify(params)}`,
    detail: (id: number) => `events:detail:${id}`,
    popular: () => 'events:popular',
    trending: () => 'events:trending',
    search: (query: string, location?: string) => `events:search:${query}:${location || 'global'}`,
    location: (lat: number, lng: number, radius: number) => `events:location:${lat}:${lng}:${radius}`,
    category: (category: string) => `events:category:${category}`,
    analytics: (eventId: number) => `events:analytics:${eventId}`,
  },
  user: {
    favorites: (userId: string) => `user:favorites:${userId}`,
    preferences: (userId: string) => `user:preferences:${userId}`,
  },
  api: {
    ticketmaster: (params: string) => `api:ticketmaster:${params}`,
    rapidapi: (params: string) => `api:rapidapi:${params}`,
  }
}

// Cache tags for bulk operations
export const cacheTags = {
  EVENTS: 'events',
  USER_DATA: 'user-data',
  API_RESPONSES: 'api-responses',
  ANALYTICS: 'analytics',
  LOCATION_BASED: 'location-based',
  SEARCH_RESULTS: 'search-results',
}

export default advancedCache
