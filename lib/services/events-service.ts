import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { transformEventEntityToProps } from "@/lib/utils/event-utils"
import type { EventDetailProps } from "@/types/event-detail"
import { searchEvents as searchEventsAPI, getFeaturedEvents as getFeaturedEventsAPI } from "@/lib/api/events-api"
import type { EventSearchParams as APIEventSearchParams } from "@/lib/api/events-api"

export interface EventSearchParams {
  lat?: number
  lng?: number
  radius?: number // in kilometers
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  keyword?: string
  priceRange?: {
    min?: number
    max?: number
  }
  sortBy?: 'date' | 'price' | 'popularity' | 'distance'
  sortOrder?: 'asc' | 'desc'
  includeVirtual?: boolean
  minRating?: number
}

export interface EventsResponse {
  events: EventDetailProps[]
  totalCount: number
  hasMore: boolean
  error?: string
}

class EventsService {
  private supabase

  constructor() {
    // Handle missing environment variables gracefully during build
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Search for events based on location and filters using real APIs
   */
  async searchEvents(params: EventSearchParams): Promise<EventsResponse> {
    try {
      logger.info("Searching for events using real APIs", {
        component: "EventsService",
        action: "searchEvents",
        metadata: params,
      })

      // Convert service params to API params with enhanced filtering
      const apiParams: APIEventSearchParams = {
        coordinates: params.lat && params.lng ? { lat: params.lat, lng: params.lng } : undefined,
        radius: params.radius || 25, // Default 25km radius
        categories: params.category && params.category !== "all" ? [params.category] : undefined,
        startDateTime: params.startDate,
        endDateTime: params.endDate,
        page: Math.floor((params.offset || 0) / (params.limit || 50)),
        size: params.limit || 50,
        sort: params.sortBy || "date",
        keyword: params.keyword,
        priceRange: params.priceRange,
        includeVirtual: params.includeVirtual,
        minRating: params.minRating
      }

      // Use the real API to search events
      const apiResult = await searchEventsAPI(apiParams)

      if (apiResult.error) {
        logger.error("API search failed", {
          component: "EventsService",
          action: "searchEvents",
          error: apiResult.error,
        })

        // Try fallback to database if API fails
        return this.searchEventsFromDatabase(params)
      }

      const totalCount = apiResult.totalCount
      const hasMore = apiResult.page < apiResult.totalPages - 1

      logger.info("Events search completed via API", {
        component: "EventsService",
        action: "searchEvents",
        metadata: {
          eventCount: apiResult.events.length,
          totalCount,
          hasMore,
          sources: apiResult.sources,
        },
      })

      return {
        events: apiResult.events,
        totalCount,
        hasMore,
        error: undefined,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("Events search failed", {
        component: "EventsService",
        action: "searchEvents",
        error: errorMessage,
      })

      // Fallback to database search
      logger.info("Falling back to database search")
      return this.searchEventsFromDatabase(params)
    }
  }

  /**
   * Fallback database search when APIs fail
   */
  private async searchEventsFromDatabase(params: EventSearchParams): Promise<EventsResponse> {
    try {
      logger.info("Searching events from database (fallback)", {
        component: "EventsService",
        action: "searchEventsFromDatabase",
        metadata: params,
      })

      let query = this.supabase
        .from("events")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .gte("start_date", new Date().toISOString()) // Only future events
        .order("start_date", { ascending: true })

      // Apply location-based filtering if coordinates provided
      if (params.lat && params.lng && params.radius) {
        // Use PostGIS distance calculation (assuming PostGIS is enabled)
        // This is a simplified approach - in production you might want to use proper spatial queries
        const radiusInDegrees = params.radius / 111.32 // Rough conversion from km to degrees

        query = query
          .gte("location_lat", params.lat - radiusInDegrees)
          .lte("location_lat", params.lat + radiusInDegrees)
          .gte("location_lng", params.lng - radiusInDegrees)
          .lte("location_lng", params.lng + radiusInDegrees)
      }

      // Apply category filter
      if (params.category && params.category !== "all") {
        query = query.eq("category", params.category)
      }

      // Apply date range filters
      if (params.startDate) {
        query = query.gte("start_date", params.startDate)
      }
      if (params.endDate) {
        query = query.lte("start_date", params.endDate)
      }

      // Apply pagination
      const limit = params.limit || 50
      const offset = params.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error("Database search failed", {
          component: "EventsService",
          action: "searchEventsFromDatabase",
          error: error.message,
        })
        return {
          events: [],
          totalCount: 0,
          hasMore: false,
          error: error.message,
        }
      }

      const events = (data || []).map(transformEventEntityToProps)
      const totalCount = count || 0
      const hasMore = totalCount > offset + limit

      logger.info("Database search completed", {
        component: "EventsService",
        action: "searchEventsFromDatabase",
        metadata: {
          eventCount: events.length,
          totalCount,
          hasMore,
        },
      })

      return {
        events,
        totalCount,
        hasMore,
        error: undefined,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("Database search failed", {
        component: "EventsService",
        action: "searchEventsFromDatabase",
        error: errorMessage,
      })

      return {
        events: [],
        totalCount: 0,
        hasMore: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Get upcoming events (next 30 days)
   */
  async getUpcomingEvents(limit = 20): Promise<EventsResponse> {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    return this.searchEvents({
      startDate: now.toISOString(),
      endDate: thirtyDaysFromNow.toISOString(),
      limit,
    })
  }

  /**
   * Get events near a specific location
   */
  async getEventsNearLocation(
    lat: number,
    lng: number,
    radius = 25,
    limit = 50
  ): Promise<EventsResponse> {
    return this.searchEvents({
      lat,
      lng,
      radius,
      limit,
    })
  }

  /**
   * Get event by ID
   */
  async getEventById(id: number): Promise<EventDetailProps | null> {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single()

      if (error || !data) {
        logger.error("Error fetching event by ID", {
          component: "EventsService",
          action: "getEventById",
          metadata: { id },
          error: error?.message,
        })
        return null
      }

      return transformEventEntityToProps(data)
    } catch (error) {
      logger.error("Error fetching event by ID", {
        component: "EventsService",
        action: "getEventById",
        metadata: { id },
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return null
    }
  }

  /**
   * Get events by category using real APIs
   */
  async getEventsByCategory(category: string, limit = 20): Promise<EventsResponse> {
    try {
      logger.info("Getting events by category using real APIs", {
        component: "EventsService",
        action: "getEventsByCategory",
        metadata: { category, limit },
      })

      // Use the real API to get featured events
      const featuredEvents = await getFeaturedEventsAPI(limit)

      // Filter by category if specified and not "all"
      const filteredEvents = category && category !== "all"
        ? featuredEvents.filter(event =>
            event.category?.toLowerCase() === category.toLowerCase()
          )
        : featuredEvents

      return {
        events: filteredEvents,
        totalCount: filteredEvents.length,
        hasMore: false,
        error: undefined,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("Get events by category failed", {
        component: "EventsService",
        action: "getEventsByCategory",
        error: errorMessage,
      })

      // Fallback to database search
      return this.searchEvents({ category, limit })
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .select("id")
        .limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// Export singleton instance
export const eventsService = new EventsService()
export default eventsService
