import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { transformEventEntityToProps } from "@/lib/utils/event-utils"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { unifiedEventsService, type UnifiedEventSearchParams } from "@/lib/api/unified-events-service"

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
      logger.info("Searching for events using unified service", {
        component: "EventsService",
        action: "searchEvents",
        metadata: params,
      })

      // Convert EventSearchParams to UnifiedEventSearchParams
      const unifiedParams: UnifiedEventSearchParams = {
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        category: params.category,
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit,
        offset: params.offset,
      }

      // Use the unified events service to fetch from APIs and cache in Supabase
      const result = await unifiedEventsService.searchEvents(unifiedParams)

      logger.info("Unified events search completed", {
        component: "EventsService",
        action: "searchEvents",
        metadata: {
          eventCount: result.events.length,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          sources: result.sources,
        },
      })

      return {
        events: result.events,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        error: result.error,
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
        .select(`
        id,
        title,
        description,
        category,
        start_date,
        end_date,
        location_name,
        location_address,
        price_min,
        price_max,
        price_currency,
        image_url,
        organizer_name,
        organizer_avatar,
        attendee_count,
        location_lat,
        location_lng,
        is_active
      `)
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
