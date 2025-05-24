/**
 * Comprehensive caching utility with multiple storage backends
 */

import { logger } from '@/lib/utils/logger'

const IS_BROWSER = typeof window !== 'undefined';

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
  private _managedKeys: Set<string>;
  private readonly MANAGED_KEYS_STORAGE_KEY: string;

  constructor(private namespace: string = 'cache') {
    super()
    this.MANAGED_KEYS_STORAGE_KEY = `${this.namespace}:__managed_keys__`;
    this._managedKeys = this.loadManagedKeys();
  }

  private getStorageKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  private loadManagedKeys(): Set<string> {
    if (!IS_BROWSER) return new Set();
    try {
      const storedKeys = localStorage.getItem(this.MANAGED_KEYS_STORAGE_KEY);
      return storedKeys ? new Set(JSON.parse(storedKeys)) : new Set();
    } catch (error) {
      logger.warn(`Failed to load managed keys from localStorage: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'load_managed_keys_error',
        metadata: { namespace: this.namespace }
      });
      return new Set();
    }
  }

  private saveManagedKeys(): void {
    if (!IS_BROWSER) return;
    try {
      localStorage.setItem(this.MANAGED_KEYS_STORAGE_KEY, JSON.stringify(Array.from(this._managedKeys)));
    } catch (error) {
      logger.warn(`Failed to save managed keys to localStorage: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'save_managed_keys_error',
        metadata: { namespace: this.namespace }
      });
    }
  }

  get(key: string): CacheEntry<T> | null {
    if (!IS_BROWSER) return null

    try {
      // Ensure key is managed before attempting to get, though direct access is fine
      // if (!this._managedKeys.has(key)) return null;
      const item = localStorage.getItem(this.getStorageKey(key))
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  set(key: string, entry: CacheEntry<T>): void {
    if (!IS_BROWSER) return

    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry))
      if (!this._managedKeys.has(key)) {
        this._managedKeys.add(key);
        this.saveManagedKeys();
      }
    } catch (error) {
      logger.warn(`Failed to save to localStorage: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'localStorage_error',
        metadata: { key }
      })
    }
  }

  delete(key: string): boolean {
    if (!IS_BROWSER) return false

    try {
      localStorage.removeItem(this.getStorageKey(key))
      if (this._managedKeys.has(key)) {
        this._managedKeys.delete(key);
        this.saveManagedKeys();
      }
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    if (!IS_BROWSER) return

    try {
      // Iterate over a copy of the keys, as `delete` modifies the set
      const currentKeys = Array.from(this._managedKeys);
      currentKeys.forEach(key => {
        // Use the internal delete which also removes from localStorage
        localStorage.removeItem(this.getStorageKey(key));
      });
      this._managedKeys.clear();
      localStorage.removeItem(this.MANAGED_KEYS_STORAGE_KEY); // Remove the managed keys list itself
      // No need to call this.saveManagedKeys() here as we just cleared and removed it.
    } catch (error) {
      logger.warn(`Failed to clear localStorage cache: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'clear_error'
      })
    }
  }

  keys(): string[] {
    if (!IS_BROWSER) return []
    // Return keys from the managed set
    return Array.from(this._managedKeys)
  }

  size(): number {
    // Size is now directly from the managed set
    return this._managedKeys.size
  }
}

/**
 * SessionStorage cache backend
 */
class SessionStorageCache<T> extends CacheBackend<T> {
  private _managedKeys: Set<string>;
  private readonly MANAGED_KEYS_STORAGE_KEY: string;

  constructor(private namespace: string = 'cache') {
    super()
    this.MANAGED_KEYS_STORAGE_KEY = `${this.namespace}:__managed_keys__`;
    this._managedKeys = this.loadManagedKeys();
  }

  private getStorageKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  private loadManagedKeys(): Set<string> {
    if (!IS_BROWSER) return new Set();
    try {
      const storedKeys = sessionStorage.getItem(this.MANAGED_KEYS_STORAGE_KEY);
      return storedKeys ? new Set(JSON.parse(storedKeys)) : new Set();
    } catch (error) {
      logger.warn(`Failed to load managed keys from sessionStorage: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'load_managed_keys_error',
        metadata: { namespace: this.namespace }
      });
      return new Set();
    }
  }

  private saveManagedKeys(): void {
    if (!IS_BROWSER) return;
    try {
      sessionStorage.setItem(this.MANAGED_KEYS_STORAGE_KEY, JSON.stringify(Array.from(this._managedKeys)));
    } catch (error) {
      logger.warn(`Failed to save managed keys to sessionStorage: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'save_managed_keys_error',
        metadata: { namespace: this.namespace }
      });
    }
  }

  get(key: string): CacheEntry<T> | null {
    if (!IS_BROWSER) return null

    try {
      // Ensure key is managed before attempting to get, though direct access is fine
      // if (!this._managedKeys.has(key)) return null;
      const item = sessionStorage.getItem(this.getStorageKey(key))
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  set(key: string, entry: CacheEntry<T>): void {
    if (!IS_BROWSER) return

    try {
      sessionStorage.setItem(this.getStorageKey(key), JSON.stringify(entry))
      if (!this._managedKeys.has(key)) {
        this._managedKeys.add(key);
        this.saveManagedKeys();
      }
    } catch (error) {
      logger.warn(`Failed to save to sessionStorage: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'sessionStorage_error',
        metadata: { key }
      })
    }
  }

  delete(key: string): boolean {
    if (!IS_BROWSER) return false

    try {
      sessionStorage.removeItem(this.getStorageKey(key))
      if (this._managedKeys.has(key)) {
        this._managedKeys.delete(key);
        this.saveManagedKeys();
      }
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    if (!IS_BROWSER) return

    try {
      // Iterate over a copy of the keys, as `delete` modifies the set
      const currentKeys = Array.from(this._managedKeys);
      currentKeys.forEach(key => {
        // Use the internal delete which also removes from sessionStorage
        sessionStorage.removeItem(this.getStorageKey(key));
      });
      this._managedKeys.clear();
      sessionStorage.removeItem(this.MANAGED_KEYS_STORAGE_KEY); // Remove the managed keys list itself
      // No need to call this.saveManagedKeys() here as we just cleared and removed it.
    } catch (error) {
      logger.warn(`Failed to clear sessionStorage cache: ${error instanceof Error ? error.message : String(error)}`, {
        component: 'cache',
        action: 'clear_error'
      })
    }
  }

  keys(): string[] {
    if (!IS_BROWSER) return []
    // Return keys from the managed set
    return Array.from(this._managedKeys)
  }

  size(): number {
    // Size is now directly from the managed set
    return this._managedKeys.size
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
    const allKeys = this.backend.keys();
    if (allKeys.length === 0) {
        return;
    }

    let candidateEntries: CacheEntry<T>[] = [];
    // Number of entries to consider for eviction.
    // A small fixed sample size helps keep eviction fast for large caches.
    const SAMPLE_SIZE = 20;

    if (allKeys.length <= SAMPLE_SIZE) {
        // For small caches or when the cache size is less than/equal to sample size,
        // examine all entries to find the least used.
        // This is O(N) rather than O(N log N) from sorting all entries.
        candidateEntries = allKeys
            .map(key => this.backend.get(key))
            .filter((entry): entry is CacheEntry<T> => entry !== null);
    } else {
        // For larger caches, randomly sample entries to find a candidate for eviction.
        // This avoids iterating or sorting all entries.
        const selectedKeys: string[] = [];
        const availableKeys = [...allKeys]; // Create a copy for modification

        // Ensure we don't try to sample more keys than available
        const numToSample = Math.min(SAMPLE_SIZE, availableKeys.length);

        for (let i = 0; i < numToSample; i++) {
            const randomIndex = Math.floor(Math.random() * availableKeys.length);
            // Remove the key from availableKeys and add to selectedKeys to ensure uniqueness
            selectedKeys.push(availableKeys.splice(randomIndex, 1)[0]);
        }

        candidateEntries = selectedKeys
            .map(key => this.backend.get(key))
            .filter((entry): entry is CacheEntry<T> => entry !== null);
    }

    if (candidateEntries.length === 0) {
        // No valid entries found among candidates (e.g. if backend.get() returned null for all sampled keys)
        // This should be rare if allKeys is not empty and backend is consistent.
        logger.warn('Cache eviction: No candidate entries found to evict.', {
            component: 'cache',
            action: 'cache_evict_no_candidates',
            metadata: {
                namespace: this.options.namespace,
                totalCacheSize: allKeys.length,
                sampled: allKeys.length > SAMPLE_SIZE,
                attemptedSampleSize: SAMPLE_SIZE
            }
        });
        return;
    }

    // Find the entry with the minimum hits. Tie-break with the oldest timestamp.
    let entryToEvict = candidateEntries[0];
    for (let i = 1; i < candidateEntries.length; i++) {
        const currentEntry = candidateEntries[i];
        if (currentEntry.hits < entryToEvict.hits) {
            entryToEvict = currentEntry;
        } else if (currentEntry.hits === entryToEvict.hits && currentEntry.timestamp < entryToEvict.timestamp) {
            entryToEvict = currentEntry;
        }
    }

    // Remove the chosen entry
    this.backend.delete(entryToEvict.key);
    logger.debug('Cache eviction (sampled LFU)', {
        component: 'cache',
        action: 'cache_evict_sampled_lfu',
        metadata: {
            key: entryToEvict.key,
            namespace: this.options.namespace,
            hits: entryToEvict.hits,
            timestamp: entryToEvict.timestamp,
            sampled: allKeys.length > SAMPLE_SIZE,
            // Number of entries actually considered in the eviction decision pool
            samplePoolSize: candidateEntries.length,
            totalCacheSizeBeforeEviction: allKeys.length,
        }
    });
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
      setInterval(() => this.cleanup(), 300000) // Every 5 minutes
    }
  }
}

// Create default cache instances
export const memoryCache = new CacheManager({ storage: 'memory', namespace: 'memory' })
export const sessionCache = new CacheManager({ storage: 'sessionStorage', namespace: 'session' })
export const persistentCache = new CacheManager({ storage: 'localStorage', namespace: 'persistent', ttl: 24 * 60 * 60 * 1000 }) // 24 hours

// Convenience function for creating custom caches
export const createCache = <T>(options: CacheOptions = {}) => new CacheManager<T>(options)
