/**
 * Event Repository
 * Handles all database operations for events with advanced querying capabilities
 */

import {
  BaseRepository,
  type QueryOptions,
  type RepositoryResult,
  type RepositoryListResult,
} from "../core/base-repository"
import { logger } from "@/lib/utils/logger"

export interface EventEntity {
  id: number
  external_id?: string
  title: string
  description?: string
  category?: string
  start_date?: string
  end_date?: string
  location_name?: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  price_min?: number
  price_max?: number
  price_currency?: string
  image_url?: string
  organizer_name?: string
  organizer_avatar?: string
  attendee_count?: number
  ticket_links?: any[]
  tags?: string[]
  source_provider?: string
  source_data?: any
  popularity_score?: number
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

export interface EventSearchOptions extends QueryOptions {
  category?: string
  location?: {
    lat: number
    lng: number
    radius?: number // in kilometers
  }
  dateRange?: {
    start: string
    end: string
  }
  priceRange?: {
    min?: number
    max?: number
  }
  tags?: string[]
  sourceProvider?: string
  isActive?: boolean
  searchText?: string
}

export class EventRepository extends BaseRepository<EventEntity> {
  constructor() {
    super("events")
  }

  /**
   * Search events with advanced filtering
   */
  async searchEvents(options: EventSearchOptions): Promise<RepositoryListResult<EventEntity>> {
    try {
      logger.debug("Searching events with advanced options", {
        component: "EventRepository",
        action: "searchEvents",
        metadata: { options },
      })

      const supabase = await this.getSupabase()
      let query = supabase.from(this.tableName).select("*", { count: "exact" })

      // Apply basic filters
      if (options.category) {
        query = query.eq("category", options.category)
      }

      if (options.sourceProvider) {
        query = query.eq("source_provider", options.sourceProvider)
      }

      if (options.isActive !== undefined) {
        query = query.eq("is_active", options.isActive)
      }

      // Apply date range filter
      if (options.dateRange) {
        query = query.gte("start_date", options.dateRange.start).lte("start_date", options.dateRange.end)
      }

      // Apply price range filter
      if (options.priceRange) {
        if (options.priceRange.min !== undefined) {
          query = query.gte("price_min", options.priceRange.min)
        }
        if (options.priceRange.max !== undefined) {
          query = query.lte("price_max", options.priceRange.max)
        }
      }

      // Apply text search
      if (options.searchText) {
        query = query.or(`title.ilike.%${options.searchText}%,description.ilike.%${options.searchText}%`)
      }

      // Apply tag filters
      if (options.tags && options.tags.length > 0) {
        query = query.overlaps("tags", options.tags)
      }

      // Apply location-based filtering (if supported by PostGIS)
      if (options.location) {
        const { lat, lng, radius = 25 } = options.location
        // Using simple distance calculation for now
        // In production, consider using PostGIS for better performance
        query = query
          .gte("location_lat", lat - radius / 111) // Rough conversion
          .lte("location_lat", lat + radius / 111)
          .gte("location_lng", lng - radius / (111 * Math.cos((lat * Math.PI) / 180)))
          .lte("location_lng", lng + radius / (111 * Math.cos((lat * Math.PI) / 180)))
      }

      // Apply ordering
      const orderBy = options.orderBy || "popularity_score"
      const orderDirection = options.orderDirection || "desc"
      query = query.order(orderBy, { ascending: orderDirection === "asc" })

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
          "Error searching events",
          {
            component: "EventRepository",
            action: "searchEvents_error",
            metadata: { options },
          },
          new Error(error.message),
        )

        return { data: [], error: error.message, count: 0, hasMore: false }
      }

      const totalCount = count || 0
      const returnedCount = data?.length || 0
      const hasMore = options.limit ? (options.offset || 0) + returnedCount < totalCount : false

      logger.info("Events search completed", {
        component: "EventRepository",
        action: "searchEvents_success",
        metadata: {
          totalCount,
          returnedCount,
          hasMore,
          options: { ...options, searchText: options.searchText ? "[REDACTED]" : undefined },
        },
      })

      return {
        data: (data as EventEntity[]) || [],
        error: null,
        count: totalCount,
        hasMore,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        "Unexpected error searching events",
        {
          component: "EventRepository",
          action: "searchEvents_unexpected_error",
          metadata: { options },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: [], error: errorMessage, count: 0, hasMore: false }
    }
  }

  /**
   * Find events by external ID
   */
  async findByExternalId(externalId: string): Promise<RepositoryResult<EventEntity>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.from(this.tableName).select("*").eq("external_id", externalId).single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as EventEntity, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get popular events
   */
  async getPopularEvents(limit = 20): Promise<RepositoryListResult<EventEntity>> {
    return this.findMany({
      limit,
      orderBy: "popularity_score",
      orderDirection: "desc",
      filters: { is_active: true },
    })
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(category: string, limit = 30): Promise<RepositoryListResult<EventEntity>> {
    return this.findMany({
      limit,
      orderBy: "popularity_score",
      orderDirection: "desc",
      filters: { category, is_active: true },
    })
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 20): Promise<RepositoryListResult<EventEntity>> {
    try {
      const supabase = await this.getSupabase()
      const now = new Date().toISOString()

      const { data, error, count } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact" })
        .gte("start_date", now)
        .eq("is_active", true)
        .order("start_date", { ascending: true })
        .limit(limit)

      if (error) {
        return { data: [], error: error.message, count: 0, hasMore: false }
      }

      return {
        data: (data as EventEntity[]) || [],
        error: null,
        count: count || 0,
        hasMore: (count || 0) > limit,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: [], error: errorMessage, count: 0, hasMore: false }
    }
  }

  /**
   * Upsert event (insert or update if exists)
   */
  async upsertEvent(
    eventData: Omit<EventEntity, "id" | "created_at" | "updated_at">,
  ): Promise<RepositoryResult<EventEntity>> {
    try {
      // Check if event exists by external_id
      if (eventData.external_id) {
        const existing = await this.findByExternalId(eventData.external_id)
        if (existing.data) {
          // Update existing event
          return this.update(existing.data.id, eventData)
        }
      }

      // Create new event
      return this.create(eventData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update popularity score
   */
  async updatePopularityScore(eventId: number, score: number): Promise<RepositoryResult<EventEntity>> {
    return this.update(eventId, { popularity_score: score })
  }

  /**
   * Bulk insert events
   */
  async bulkInsertEvents(
    events: Omit<EventEntity, "id" | "created_at" | "updated_at">[],
  ): Promise<RepositoryResult<EventEntity[]>> {
    try {
      logger.debug("Bulk inserting events", {
        component: "EventRepository",
        action: "bulkInsertEvents",
        metadata: { count: events.length },
      })

      const supabase = await this.getSupabase()
      const { data, error } = await supabase.from(this.tableName).insert(events).select()

      if (error) {
        logger.error(
          "Error bulk inserting events",
          {
            component: "EventRepository",
            action: "bulkInsertEvents_error",
            metadata: { count: events.length },
          },
          new Error(error.message),
        )

        return { data: null, error: error.message }
      }

      logger.info("Bulk insert events completed", {
        component: "EventRepository",
        action: "bulkInsertEvents_success",
        metadata: { insertedCount: data?.length || 0 },
      })

      return { data: (data as EventEntity[]) || [], error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error(
        "Unexpected error bulk inserting events",
        {
          component: "EventRepository",
          action: "bulkInsertEvents_unexpected_error",
          metadata: { count: events.length },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return { data: null, error: errorMessage }
    }
  }
}
