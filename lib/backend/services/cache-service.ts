/**
 * Enhanced Cache Service
 * Provides multi-level caching with database persistence and memory optimization
 */

import { createServerSupabaseClient } from "@/lib/api/supabase-api"
import { logger } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"

export interface CacheEntry {
  key: string
  data: any
  expires_at: string
  created_at?: string
}

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  useMemory?: boolean // Whether to use memory cache as well
  namespace?: string // Cache namespace for organization
}

export class CacheService {
  private defaultTTL = 3600 // 1 hour in seconds

  private async getSupabase() {
    return await createServerSupabaseClient()
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { useMemory = true, namespace = "default" } = options
    const fullKey = `${namespace}:${key}`

    try {
      // Try memory cache first if enabled
      if (useMemory) {
        const memoryResult = memoryCache.get<T>(fullKey)
        if (memoryResult !== null) {
          logger.debug("Cache hit (memory)", {
            component: "CacheService",
            action: "get_memory_hit",
            metadata: { key: fullKey },
          })
          return memoryResult
        }
      }

      // Try database cache
      const { data, error } = await this.supabase.from("event_cache").select("*").eq("cache_key", fullKey).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          logger.debug("Cache miss (database)", {
            component: "CacheService",
            action: "get_db_miss",
            metadata: { key: fullKey },
          })
          return null
        }
        throw new Error(error.message)
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        // Expired, remove from cache
        await this.delete(key, { namespace })
        logger.debug("Cache expired", {
          component: "CacheService",
          action: "get_expired",
          metadata: { key: fullKey, expiresAt },
        })
        return null
      }

      // Cache hit, also store in memory if enabled
      if (useMemory) {
        const ttlMs = Math.max(0, expiresAt.getTime() - Date.now())
        memoryCache.set(fullKey, data.data, ttlMs)
      }

      logger.debug("Cache hit (database)", {
        component: "CacheService",
        action: "get_db_hit",
        metadata: { key: fullKey },
      })

      return data.data as T
    } catch (error) {
      logger.error(
        "Error getting cached data",
        {
          component: "CacheService",
          action: "get_error",
          metadata: { key: fullKey },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return null
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    const { ttl = this.defaultTTL, useMemory = true, namespace = "default" } = options
    const fullKey = `${namespace}:${key}`

    try {
      const expiresAt = new Date(Date.now() + ttl * 1000)

      // Store in database
      const { error } = await this.supabase.from("event_cache").upsert({
        cache_key: fullKey,
        data,
        expires_at: expiresAt.toISOString(),
      })

      if (error) {
        throw new Error(error.message)
      }

      // Store in memory if enabled
      if (useMemory) {
        memoryCache.set(fullKey, data, ttl * 1000)
      }

      logger.debug("Cache set", {
        component: "CacheService",
        action: "set_success",
        metadata: { key: fullKey, ttl, expiresAt },
      })

      return true
    } catch (error) {
      logger.error(
        "Error setting cached data",
        {
          component: "CacheService",
          action: "set_error",
          metadata: { key: fullKey, ttl },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return false
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string, options: { namespace?: string } = {}): Promise<boolean> {
    const { namespace = "default" } = options
    const fullKey = `${namespace}:${key}`

    try {
      // Remove from memory cache
      memoryCache.delete(fullKey)

      // Remove from database
      const { error } = await this.supabase.from("event_cache").delete().eq("cache_key", fullKey)

      if (error) {
        throw new Error(error.message)
      }

      logger.debug("Cache deleted", {
        component: "CacheService",
        action: "delete_success",
        metadata: { key: fullKey },
      })

      return true
    } catch (error) {
      logger.error(
        "Error deleting cached data",
        {
          component: "CacheService",
          action: "delete_error",
          metadata: { key: fullKey },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return false
    }
  }

  /**
   * Clear cache by namespace
   */
  async clearNamespace(namespace: string): Promise<boolean> {
    try {
      // Clear memory cache (approximate)
      const memoryStats = memoryCache.getStats()
      if (memoryStats.size > 0) {
        // This is a simplified approach - in production, you might want to track keys by namespace
        memoryCache.clear()
      }

      // Clear database cache
      const { error } = await this.supabase.from("event_cache").delete().like("cache_key", `${namespace}:%`)

      if (error) {
        throw new Error(error.message)
      }

      logger.info("Cache namespace cleared", {
        component: "CacheService",
        action: "clear_namespace_success",
        metadata: { namespace },
      })

      return true
    } catch (error) {
      logger.error(
        "Error clearing cache namespace",
        {
          component: "CacheService",
          action: "clear_namespace_error",
          metadata: { namespace },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return false
    }
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, options: CacheOptions = {}): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    try {
      // Generate new data
      const data = await factory()

      // Cache the result
      await this.set(key, data, options)

      return data
    } catch (error) {
      logger.error(
        "Error in cache getOrSet factory",
        {
          component: "CacheService",
          action: "getOrSet_factory_error",
          metadata: { key: `${options.namespace || "default"}:${key}` },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return null
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpired(): Promise<number> {
    try {
      const now = new Date().toISOString()

      const { data, error } = await this.supabase.from("event_cache").delete().lt("expires_at", now).select("cache_key")

      if (error) {
        throw new Error(error.message)
      }

      const deletedCount = data?.length || 0

      logger.info("Cache cleanup completed", {
        component: "CacheService",
        action: "cleanup_expired_success",
        metadata: { deletedCount },
      })

      return deletedCount
    } catch (error) {
      logger.error(
        "Error cleaning up expired cache",
        {
          component: "CacheService",
          action: "cleanup_expired_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number
    expiredEntries: number
    memoryStats: any
  }> {
    try {
      const now = new Date().toISOString()

      // Get total entries
      const { count: totalEntries } = await this.supabase
        .from("event_cache")
        .select("*", { count: "exact", head: true })

      // Get expired entries
      const { count: expiredEntries } = await this.supabase
        .from("event_cache")
        .select("*", { count: "exact", head: true })
        .lt("expires_at", now)

      // Get memory cache stats
      const memoryStats = memoryCache.getStats()

      return {
        totalEntries: totalEntries || 0,
        expiredEntries: expiredEntries || 0,
        memoryStats,
      }
    } catch (error) {
      logger.error(
        "Error getting cache stats",
        {
          component: "CacheService",
          action: "get_stats_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return {
        totalEntries: 0,
        expiredEntries: 0,
        memoryStats: { hits: 0, misses: 0, size: 0, hitRate: 0 },
      }
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()
