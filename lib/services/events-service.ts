import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { transformEventEntityToProps } from "@/lib/utils/event-utils"
import type { EventDetailProps } from "@/types/event-detail"

export interface EventSearchParams {
  lat?: number
  lng?: number
  radius?: number // in kilometers
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
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
    this.supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Search for events based on location and filters
   */
  async searchEvents(params: EventSearchParams): Promise<EventsResponse> {
    try {
      logger.info("Searching for events", {
        component: "EventsService",
        action: "searchEvents",
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
        logger.error("Error searching events", {
          component: "EventsService",
          action: "searchEvents",
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

      logger.info("Events search completed", {
        component: "EventsService",
        action: "searchEvents",
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
      logger.error("Events search failed", {
        component: "EventsService",
        action: "searchEvents",
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
   * Get events by category
   */
  async getEventsByCategory(category: string, limit = 20): Promise<EventsResponse> {
    return this.searchEvents({
      category,
      limit,
    })
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
