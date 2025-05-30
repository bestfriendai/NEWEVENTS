import { createClient } from "@supabase/supabase-js"
import { env, serverEnv } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { rapidAPIEventsService } from "./rapidapi-events"
import { searchTicketmasterEvents, type TicketmasterSearchParams } from "./ticketmaster-api"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { imageService } from "@/lib/services/image-service"

export interface UnifiedEventSearchParams {
  lat?: number
  lng?: number
  radius?: number // in kilometers
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  query?: string
}

export interface UnifiedEventsResponse {
  events: EventDetailProps[]
  totalCount: number
  hasMore: boolean
  error?: string
  sources: {
    rapidapi: number
    ticketmaster: number
    cached: number
  }
}

interface DatabaseEvent {
  id?: number
  external_id: string
  source: 'rapidapi' | 'ticketmaster'
  title: string
  description: string
  category: string
  start_date: string
  end_date?: string
  location_name: string
  location_address: string
  location_lat?: number
  location_lng?: number
  price_min?: number
  price_max?: number
  price_currency: string
  image_url?: string
  organizer_name?: string
  organizer_avatar?: string
  attendee_count?: number
  ticket_links?: any[]
  tags?: string[]
  is_active: boolean
  created_at?: string
  updated_at?: string
}

class UnifiedEventsService {
  private supabase

  constructor() {
    this.supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Search for events from multiple sources and store in Supabase
   */
  async searchEvents(params: UnifiedEventSearchParams): Promise<UnifiedEventsResponse> {
    try {
      logger.info("Starting unified events search", {
        component: "UnifiedEventsService",
        action: "searchEvents",
        metadata: params,
      })

      const sources = { rapidapi: 0, ticketmaster: 0, cached: 0 }
      const allEvents: EventDetailProps[] = []

      // First, check for cached events in Supabase
      const cachedEvents = await this.getCachedEvents(params)
      if (cachedEvents.length > 0) {
        allEvents.push(...cachedEvents)
        sources.cached = cachedEvents.length
        logger.info(`Found ${cachedEvents.length} cached events`)
      }

      // If we don't have enough cached events, fetch from APIs
      const remainingLimit = (params.limit || 50) - allEvents.length
      if (remainingLimit > 0) {
        // Fetch from RapidAPI
        if (serverEnv.RAPIDAPI_KEY) {
          try {
            const rapidApiEvents = await this.fetchFromRapidAPI(params, Math.ceil(remainingLimit / 2))
            if (rapidApiEvents.length > 0) {
              await this.storeEvents(rapidApiEvents, 'rapidapi')
              allEvents.push(...rapidApiEvents)
              sources.rapidapi = rapidApiEvents.length
            }
          } catch (error) {
            logger.error("RapidAPI fetch failed", { error })
          }
        }

        // Fetch from Ticketmaster
        if (serverEnv.TICKETMASTER_API_KEY) {
          try {
            const ticketmasterEvents = await this.fetchFromTicketmaster(params, Math.ceil(remainingLimit / 2))
            if (ticketmasterEvents.length > 0) {
              await this.storeEvents(ticketmasterEvents, 'ticketmaster')
              allEvents.push(...ticketmasterEvents)
              sources.ticketmaster = ticketmasterEvents.length
            }
          } catch (error) {
            logger.error("Ticketmaster fetch failed", { error })
          }
        }
      }

      // Remove duplicates and apply final filtering
      const uniqueEvents = this.removeDuplicates(allEvents)
      const filteredEvents = this.applyFilters(uniqueEvents, params)
      
      // Apply pagination
      const offset = params.offset || 0
      const limit = params.limit || 50
      const paginatedEvents = filteredEvents.slice(offset, offset + limit)

      logger.info("Unified events search completed", {
        component: "UnifiedEventsService",
        action: "searchEvents",
        metadata: {
          totalFound: filteredEvents.length,
          returned: paginatedEvents.length,
          sources,
        },
      })

      return {
        events: paginatedEvents,
        totalCount: filteredEvents.length,
        hasMore: filteredEvents.length > offset + limit,
        sources,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("Unified events search failed", {
        component: "UnifiedEventsService",
        action: "searchEvents",
        error: errorMessage,
      })

      return {
        events: [],
        totalCount: 0,
        hasMore: false,
        error: errorMessage,
        sources: { rapidapi: 0, ticketmaster: 0, cached: 0 },
      }
    }
  }

  /**
   * Fetch events from RapidAPI
   */
  private async fetchFromRapidAPI(params: UnifiedEventSearchParams, limit: number): Promise<EventDetailProps[]> {
    try {
      // Build query for RapidAPI
      let query = params.query || ""
      if (params.category && params.category !== "all") {
        query = query ? `${query} ${params.category}` : params.category
      }

      // Add location to query if provided
      if (params.lat && params.lng) {
        // For RapidAPI, we'll search by general location terms
        query = query ? `${query} events` : "events"
      }

      if (!query) {
        query = "events" // Default search term
      }

      const rapidApiEvents = await rapidAPIEventsService.searchEvents({
        query,
        date: params.startDate || "any",
        is_virtual: false,
        start: 0,
      })

      // Transform RapidAPI events to our format with enhanced image handling
      const transformedEvents: EventDetailProps[] = await Promise.all(
        rapidApiEvents.slice(0, limit).map(async (event, index) => {
          const category = rapidAPIEventsService.categorizeEvent(event)
          const title = event.name || "Untitled Event"
          
          // Preprocess and validate image
          const preprocessedImage = imageService.preprocessImageUrl(event.thumbnail, 'rapidapi')
          const imageResult = await imageService.validateAndEnhanceImage(
            preprocessedImage,
            category,
            title
          )
          
          return {
            id: this.generateNumericId(event.event_id),
            title,
            description: event.description || "No description available",
            category,
            date: this.formatDate(event.start_time),
            time: this.formatTime(event.start_time),
            location: event.venue?.name || "Venue TBA",
            address: event.venue?.full_address || "Address TBA",
            price: "Check Event",
            image: imageResult.url,
            organizer: {
              name: event.publisher || "Event Organizer",
              logo: "/avatar-1.png",
            },
            attendees: Math.floor(Math.random() * 500) + 50,
            isFavorite: false,
            coordinates: event.venue?.latitude && event.venue?.longitude ? {
              lat: event.venue.latitude,
              lng: event.venue.longitude,
            } : undefined,
            ticketLinks: event.ticket_links || [],
            source: 'rapidapi' as const,
            externalId: event.event_id,
          }
        })
      )

      return transformedEvents
    } catch (error) {
      logger.error("RapidAPI fetch error", { error })
      return []
    }
  }

  /**
   * Fetch events from Ticketmaster
   */
  private async fetchFromTicketmaster(params: UnifiedEventSearchParams, limit: number): Promise<EventDetailProps[]> {
    try {
      const ticketmasterParams: TicketmasterSearchParams = {
        size: limit,
        page: 0,
      }

      // Add location if provided
      if (params.lat && params.lng) {
        ticketmasterParams.coordinates = { lat: params.lat, lng: params.lng }
        ticketmasterParams.radius = params.radius || 50
      }

      // Add keyword if provided
      if (params.query) {
        ticketmasterParams.keyword = params.query
      }

      // Add category mapping
      if (params.category && params.category !== "all") {
        ticketmasterParams.classificationName = this.mapCategoryToTicketmaster(params.category)
      }

      // Add date range
      if (params.startDate) {
        ticketmasterParams.startDateTime = params.startDate
      }
      if (params.endDate) {
        ticketmasterParams.endDateTime = params.endDate
      }

      const result = await searchTicketmasterEvents(ticketmasterParams)
      
      // Add source and external ID to events with enhanced image handling
      const eventsWithSource = await Promise.all(
        result.events.map(async (event) => {
          // Validate and enhance Ticketmaster images
          const preprocessedImage = imageService.preprocessImageUrl(event.image, 'ticketmaster')
          const imageResult = await imageService.validateAndEnhanceImage(
            preprocessedImage,
            event.category,
            event.title
          )

          return {
            ...event,
            image: imageResult.url,
            source: 'ticketmaster' as const,
            externalId: `tm_${event.id}`,
          }
        })
      )

      return eventsWithSource
    } catch (error) {
      logger.error("Ticketmaster fetch error", { error })
      return []
    }
  }

  /**
   * Get cached events from Supabase
   */
  private async getCachedEvents(params: UnifiedEventSearchParams): Promise<EventDetailProps[]> {
    try {
      let query = this.supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })

      // Apply location-based filtering if coordinates provided
      if (params.lat && params.lng && params.radius) {
        const radiusInDegrees = params.radius / 111.32
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

      // Limit to recent events (last 24 hours) to avoid stale data
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)
      query = query.gte("created_at", oneDayAgo.toISOString())

      const { data, error } = await query.limit(params.limit || 50)

      if (error) {
        logger.error("Error fetching cached events", { error: error.message })
        return []
      }

      return (data || []).map(this.transformDatabaseEventToProps)
    } catch (error) {
      logger.error("Error in getCachedEvents", { error })
      return []
    }
  }

  /**
   * Store events in Supabase
   */
  private async storeEvents(events: EventDetailProps[], source: 'rapidapi' | 'ticketmaster'): Promise<void> {
    try {
      const databaseEvents: DatabaseEvent[] = events.map(event => ({
        external_id: (event as any).externalId || `${source}_${event.id}`,
        source,
        title: event.title,
        description: event.description,
        category: event.category,
        start_date: this.parseEventDateTime(event.date, event.time),
        location_name: event.location,
        location_address: event.address,
        location_lat: event.coordinates?.lat,
        location_lng: event.coordinates?.lng,
        price_min: this.extractMinPrice(event.price),
        price_max: this.extractMaxPrice(event.price),
        price_currency: "USD",
        image_url: event.image,
        organizer_name: event.organizer?.name,
        organizer_avatar: event.organizer?.logo,
        attendee_count: event.attendees,
        ticket_links: (event as any).ticketLinks || [],
        tags: [],
        is_active: true,
      }))

      // Use upsert to avoid duplicates
      const { error } = await this.supabase
        .from("events")
        .upsert(databaseEvents, {
          onConflict: "external_id,source",
          ignoreDuplicates: false,
        })

      if (error) {
        logger.error("Error storing events", { error: error.message })
      } else {
        logger.info(`Stored ${databaseEvents.length} events from ${source}`)
      }
    } catch (error) {
      logger.error("Error in storeEvents", { error })
    }
  }

  /**
   * Transform database event to EventDetailProps
   */
  private transformDatabaseEventToProps(dbEvent: any): EventDetailProps {
    return {
      id: dbEvent.id,
      title: dbEvent.title || "Untitled Event",
      description: dbEvent.description || "No description available",
      category: dbEvent.category || "Event",
      date: this.formatDate(dbEvent.start_date),
      time: this.formatTime(dbEvent.start_date),
      location: dbEvent.location_name || "Venue TBA",
      address: dbEvent.location_address || "Address TBA",
      price: this.formatPrice(dbEvent.price_min, dbEvent.price_max, dbEvent.price_currency),
      image: dbEvent.image_url || "/community-event.png",
      organizer: {
        name: dbEvent.organizer_name || "Event Organizer",
        logo: dbEvent.organizer_avatar || "/avatar-1.png",
      },
      attendees: dbEvent.attendee_count || 0,
      isFavorite: false,
      coordinates: dbEvent.location_lat && dbEvent.location_lng ? {
        lat: dbEvent.location_lat,
        lng: dbEvent.location_lng,
      } : undefined,
      ticketLinks: dbEvent.ticket_links || [],
    }
  }

  /**
   * Remove duplicate events based on title and location
   */
  private removeDuplicates(events: EventDetailProps[]): EventDetailProps[] {
    const seen = new Set<string>()
    return events.filter(event => {
      const key = `${event.title.toLowerCase()}_${event.location.toLowerCase()}_${event.date}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * Apply additional filters to events
   */
  private applyFilters(events: EventDetailProps[], params: UnifiedEventSearchParams): EventDetailProps[] {
    let filtered = events

    // Filter by location radius if coordinates provided
    if (params.lat && params.lng && params.radius) {
      filtered = filtered.filter(event => {
        if (!event.coordinates) return false
        const distance = this.calculateDistance(
          params.lat!,
          params.lng!,
          event.coordinates.lat,
          event.coordinates.lng
        )
        return distance <= params.radius!
      })
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    return filtered
  }

  // Helper methods
  private generateNumericId(externalId: string): number {
    // Create a numeric ID from string ID
    let hash = 0
    for (let i = 0; i < externalId.length; i++) {
      const char = externalId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Date TBA"
    }
  }

  private formatTime(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return "Time TBA"
    }
  }

  private parseEventDateTime(date: string, time: string): string {
    try {
      // Try to parse the date and time into a proper ISO string
      const dateObj = new Date(`${date} ${time}`)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString()
      }
      // Fallback to just the date
      return new Date(date).toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  private extractMinPrice(priceString: string): number | undefined {
    const match = priceString.match(/\$(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : undefined;
  }

  private extractMaxPrice(priceString: string): number | undefined {
    const matches = priceString.match(/\$(\d+(?:\.\d{2})?)/g);
    if (matches && matches.length > 1) {
      return parseFloat(matches[1].replace('$', ''));
    }
    return this.extractMinPrice(priceString);
  }

  private formatPrice(min?: number, max?: number, currency = "USD"): string {
    if (!min && !max) return "Free"
    if (min === 0 && max === 0) return "Free"

    const symbol = currency === "USD" ? "$" : currency

    if (min && max && min !== max) {
      return `${symbol}${min}-${max}`
    }

    const price = min || max || 0
    return `${symbol}${price}`
  }

  private mapCategoryToTicketmaster(category: string): string {
    const mapping: Record<string, string> = {
      "Concerts": "Music",
      "Club Events": "Music",
      "Day Parties": "Music",
      "Parties": "Music",
      "General Events": "Miscellaneous",
    }
    return mapping[category] || category
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

// Export singleton instance
export const unifiedEventsService = new UnifiedEventsService()
export default unifiedEventsService