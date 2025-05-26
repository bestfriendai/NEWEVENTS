/**
 * Base Repository Pattern Implementation
 * Provides common database operations with type safety and error handling
 */

import { createServerSupabaseClient } from "@/lib/api/supabase-api"
import { logger } from "@/lib/utils/logger"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface BaseEntity {
  id: string | number
  created_at?: string
  updated_at?: string
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
  filters?: Record<string, any>
}

export interface RepositoryResult<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface RepositoryListResult<T> {
  data: T[]
  error: string | null
  count: number
  hasMore: boolean
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected supabase: SupabaseClient
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
    this.supabase = createServerSupabaseClient()
  }

  /**
   * Find entity by ID
   */
  async findById(id: string | number): Promise<RepositoryResult<T>> {
    try {
      logger.debug(`Finding ${this.tableName} by ID`, {
        component: "BaseRepository",
        action: "findById",
        metadata: { tableName: this.tableName, id },
      })

      const { data, error } = await this.supabase.from(this.tableName).select("*").eq("id", id).single()

      if (error) {
        logger.error(
          `Error finding ${this.tableName} by ID`,
          {
            component: "BaseRepository",
            action: "findById_error",
            metadata: { tableName: this.tableName, id },
          },
          new Error(error.message),
        )

        return { data: null, error: error.message }
      }

      return { data: data as T, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        `Unexpected error finding ${this.tableName} by ID`,
        {
          component: "BaseRepository",
          action: "findById_unexpected_error",
          metadata: { tableName: this.tableName, id },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: null, error: errorMessage }
    }
  }

  /**
   * Find multiple entities with options
   */
  async findMany(options: QueryOptions = {}): Promise<RepositoryListResult<T>> {
    try {
      logger.debug(`Finding multiple ${this.tableName}`, {
        component: "BaseRepository",
        action: "findMany",
        metadata: { tableName: this.tableName, options },
      })

      let query = this.supabase.from(this.tableName).select("*", { count: "exact" })

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection === "asc",
        })
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        logger.error(
          `Error finding multiple ${this.tableName}`,
          {
            component: "BaseRepository",
            action: "findMany_error",
            metadata: { tableName: this.tableName, options },
          },
          new Error(error.message),
        )

        return { data: [], error: error.message, count: 0, hasMore: false }
      }

      const totalCount = count || 0
      const returnedCount = data?.length || 0
      const hasMore = options.limit ? (options.offset || 0) + returnedCount < totalCount : false

      return {
        data: (data as T[]) || [],
        error: null,
        count: totalCount,
        hasMore,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        `Unexpected error finding multiple ${this.tableName}`,
        {
          component: "BaseRepository",
          action: "findMany_unexpected_error",
          metadata: { tableName: this.tableName, options },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: [], error: errorMessage, count: 0, hasMore: false }
    }
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, "id" | "created_at" | "updated_at">): Promise<RepositoryResult<T>> {
    try {
      logger.debug(`Creating ${this.tableName}`, {
        component: "BaseRepository",
        action: "create",
        metadata: { tableName: this.tableName },
      })

      const { data: result, error } = await this.supabase.from(this.tableName).insert(data).select().single()

      if (error) {
        logger.error(
          `Error creating ${this.tableName}`,
          {
            component: "BaseRepository",
            action: "create_error",
            metadata: { tableName: this.tableName },
          },
          new Error(error.message),
        )

        return { data: null, error: error.message }
      }

      return { data: result as T, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        `Unexpected error creating ${this.tableName}`,
        {
          component: "BaseRepository",
          action: "create_unexpected_error",
          metadata: { tableName: this.tableName },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: string | number, data: Partial<Omit<T, "id" | "created_at">>): Promise<RepositoryResult<T>> {
    try {
      logger.debug(`Updating ${this.tableName}`, {
        component: "BaseRepository",
        action: "update",
        metadata: { tableName: this.tableName, id },
      })

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        logger.error(
          `Error updating ${this.tableName}`,
          {
            component: "BaseRepository",
            action: "update_error",
            metadata: { tableName: this.tableName, id },
          },
          new Error(error.message),
        )

        return { data: null, error: error.message }
      }

      return { data: result as T, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        `Unexpected error updating ${this.tableName}`,
        {
          component: "BaseRepository",
          action: "update_unexpected_error",
          metadata: { tableName: this.tableName, id },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: null, error: errorMessage }
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string | number): Promise<RepositoryResult<boolean>> {
    try {
      logger.debug(`Deleting ${this.tableName}`, {
        component: "BaseRepository",
        action: "delete",
        metadata: { tableName: this.tableName, id },
      })

      const { error } = await this.supabase.from(this.tableName).delete().eq("id", id)

      if (error) {
        logger.error(
          `Error deleting ${this.tableName}`,
          {
            component: "BaseRepository",
            action: "delete_error",
            metadata: { tableName: this.tableName, id },
          },
          new Error(error.message),
        )

        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        `Unexpected error deleting ${this.tableName}`,
        {
          component: "BaseRepository",
          action: "delete_unexpected_error",
          metadata: { tableName: this.tableName, id },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: null, error: errorMessage }
    }
  }

  /**
   * Count entities with optional filters
   */
  async count(filters?: Record<string, any>): Promise<RepositoryResult<number>> {
    try {
      let query = this.supabase.from(this.tableName).select("*", { count: "exact", head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: count || 0, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string | number): Promise<RepositoryResult<boolean>> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("id", id)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: (count || 0) > 0, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }
}
