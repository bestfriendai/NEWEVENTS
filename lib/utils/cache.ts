/**
 * Comprehensive caching utility with multiple storage backends
 */

import { logger } from '@/lib/utils/logger'
import { generateId } from '@/lib/utils'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
  hits: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
  namespace?: string
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

/**
 * Abstract cache interface
 */
abstract class CacheBackend<T> {
  abstract get(key: string): CacheEntry<T> | null
  abstract set(key: string, entry: CacheEntry<T>): void
  abstract delete(key: string): boolean
  abstract clear(): void
  abstract keys(): string[]
  abstract size(): number
}

/**
 * Memory cache backend
 */
class MemoryCache<T> extends CacheBackend<T> {
  private cache = new Map<string, CacheEntry<T>>()

  get(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null
  }

  set(key: string, entry: CacheEntry<T>): void {
    this.cache.set(key, entry)
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * LocalStorage cache backend
 */
class LocalStorageCache<T> extends CacheBackend<T> {
  constructor(private namespace: string = 'cache') {
    super()
  }

  private getStorageKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  get(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(this.getStorageKey(key))
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  set(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry))
    } catch (error) {
      logger.warn('Failed to save to localStorage', {
        component: 'cache',
        action: 'localStorage_error',
        metadata: { key }
      }, error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  delete(key: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.removeItem(this.getStorageKey(key))
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return
    
    try {
      const keys = this.keys()
      keys.forEach(key => this.delete(key))
    } catch (error) {
      logger.warn('Failed to clear localStorage cache', {
        component: 'cache',
        action: 'clear_error'
      }, error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  keys(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`${this.namespace}:`)) {
          keys.push(key.replace(`${this.namespace}:`, ''))
        }
      }
      return keys
    } catch {
      return []
    }
  }

  size(): number {
    return this.keys().length
  }
}

/**
 * SessionStorage cache backend
 */
class SessionStorageCache<T> extends CacheBackend<T> {
  constructor(private namespace: string = 'cache') {
    super()
  }

  private getStorageKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  get(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = sessionStorage.getItem(this.getStorageKey(key))
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  set(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem(this.getStorageKey(key), JSON.stringify(entry))
    } catch (error) {
      logger.warn('Failed to save to sessionStorage', {
        component: 'cache',
        action: 'sessionStorage_error',
        metadata: { key }
      }, error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  delete(key: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      sessionStorage.removeItem(this.getStorageKey(key))
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return
    
    try {
      const keys = this.keys()
      keys.forEach(key => this.delete(key))
    } catch (error) {
      logger.warn('Failed to clear sessionStorage cache', {
        component: 'cache',
        action: 'clear_error'
      }, error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  keys(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const keys: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(`${this.namespace}:`)) {
          keys.push(key.replace(`${this.namespace}:`, ''))
        }
      }
      return keys
    } catch {
      return []
    }
  }

  size(): number {
    return this.keys().length
  }
}

/**
 * Main cache manager
 */
export class CacheManager<T> {
  private backend: CacheBackend<T>
  private stats = { hits: 0, misses: 0 }
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      storage: 'memory',
      namespace: 'default',
      ...options
    }

    // Initialize backend
    switch (this.options.storage) {
      case 'localStorage':
        this.backend = new LocalStorageCache<T>(this.options.namespace)
        break
      case 'sessionStorage':
        this.backend = new SessionStorageCache<T>(this.options.namespace)
        break
      default:
        this.backend = new MemoryCache<T>()
    }

    // Start cleanup interval
    this.startCleanupInterval()
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.backend.get(key)
    
    if (!entry) {
      this.stats.misses++
      logger.debug('Cache miss', {
        component: 'cache',
        action: 'cache_miss',
        metadata: { key, namespace: this.options.namespace }
      })
      return null
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.backend.delete(key)
      this.stats.misses++
      logger.debug('Cache expired', {
        component: 'cache',
        action: 'cache_expired',
        metadata: { key, namespace: this.options.namespace }
      })
      return null
    }

    // Update hit count
    entry.hits++
    this.backend.set(key, entry)
    this.stats.hits++
    
    logger.debug('Cache hit', {
      component: 'cache',
      action: 'cache_hit',
      metadata: { key, namespace: this.options.namespace, hits: entry.hits }
    })
    
    return entry.data
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      key,
      hits: 0
    }

    // Check if we need to evict entries
    if (this.backend.size() >= this.options.maxSize) {
      this.evictLeastUsed()
    }

    this.backend.set(key, entry)
    
    logger.debug('Cache set', {
      component: 'cache',
      action: 'cache_set',
      metadata: { key, namespace: this.options.namespace, ttl: entry.ttl }
    })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const result = this.backend.delete(key)
    
    if (result) {
      logger.debug('Cache delete', {
        component: 'cache',
        action: 'cache_delete',
        metadata: { key, namespace: this.options.namespace }
      })
    }
    
    return result
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.backend.clear()
    this.stats = { hits: 0, misses: 0 }
    
    logger.info('Cache cleared', {
      component: 'cache',
      action: 'cache_clear',
      metadata: { namespace: this.options.namespace }
    })
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.backend.size(),
      hitRate: total > 0 ? this.stats.hits / total : 0
    }
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const data = await factory()
    this.set(key, data, ttl)
    return data
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const keys = this.backend.keys()
    const entries = keys
      .map(key => this.backend.get(key))
      .filter((entry): entry is CacheEntry<T> => entry !== null)
      .sort((a, b) => a.hits - b.hits)

    // Remove the least used entry
    if (entries.length > 0) {
      this.backend.delete(entries[0].key)
      logger.debug('Cache eviction', {
        component: 'cache',
        action: 'cache_evict',
        metadata: { 
          key: entries[0].key, 
          namespace: this.options.namespace,
          hits: entries[0].hits
        }
      })
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const keys = this.backend.keys()
    const now = Date.now()
    let cleaned = 0

    for (const key of keys) {
      const entry = this.backend.get(key)
      if (entry && now > entry.timestamp + entry.ttl) {
        this.backend.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', {
        component: 'cache',
        action: 'cache_cleanup',
        metadata: { namespace: this.options.namespace, cleaned }
      })
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Only run cleanup in browser environment
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000) // Every minute
    }
  }
}

// Create default cache instances
export const memoryCache = new CacheManager({ storage: 'memory', namespace: 'memory' })
export const sessionCache = new CacheManager({ storage: 'sessionStorage', namespace: 'session' })
export const persistentCache = new CacheManager({ storage: 'localStorage', namespace: 'persistent', ttl: 24 * 60 * 60 * 1000 }) // 24 hours

// Convenience function for creating custom caches
export const createCache = <T>(options: CacheOptions = {}) => new CacheManager<T>(options)
