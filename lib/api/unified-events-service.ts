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
   * Get featured events near user location
   */
  async getFeaturedEventsNearUser(lat: number, lng: number, radius = 25, limit = 10): Promise<UnifiedEventsResponse> {
    try {
      logger.info("Fetching featured events near user", {
        component: "UnifiedEventsService",
        action: "getFeaturedEventsNearUser",
        metadata: { lat, lng, radius, limit },
      })

      // Search for events near the user with higher priority categories
      const featuredCategories = ["Concerts", "Club Events", "Day Parties"]
      const allFeaturedEvents: EventDetailProps[] = []

      for (const category of featuredCategories) {
        const categoryEvents = await this.searchEvents({
          lat,
          lng,
          radius,
          category,
          limit: Math.ceil(limit / featuredCategories.length),
        })

        if (categoryEvents.events.length > 0) {
          allFeaturedEvents.push(...categoryEvents.events)
        }
      }

      // Remove duplicates and sort by date
      const uniqueEvents = this.removeDuplicates(allFeaturedEvents)
      const sortedEvents = uniqueEvents.sort((a, b) => {
        const dateTimeA = this.parseEventDateTime(a.date, a.time)
        const dateTimeB = this.parseEventDateTime(b.date, b.time)
        return new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime()
      })

      // Take only the requested limit
      const featuredEvents = sortedEvents.slice(0, limit)

      return {
        events: featuredEvents,
        totalCount: featuredEvents.length,
        hasMore: false,
        sources: { rapidapi: 0, ticketmaster: 0, cached: featuredEvents.length },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("Featured events search failed", {
        component: "UnifiedEventsService",
        action: "getFeaturedEventsNearUser",
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

      // Transform RapidAPI events to our format with direct image usage
      const transformedEvents: EventDetailProps[] = rapidApiEvents.slice(0, limit).map((event, index) => {
        const category = rapidAPIEventsService.categorizeEvent(event)
        const title = event.name || "Untitled Event"
        
        // Use the thumbnail directly from RapidAPI, fallback to category image if not available
        const eventImage = event.thumbnail && event.thumbnail.startsWith('http')
          ? event.thumbnail
          : this.getCategoryImage(category)
        
        // Format ticket links properly
        const ticketLinks = event.ticket_links?.map(link => ({
          source: link.source || "Buy Tickets",
          link: link.link,
          price: undefined
        })) || []

        // Add event link if available
        if (event.link && !ticketLinks.some(tl => tl.link === event.link)) {
          ticketLinks.unshift({
            source: "Event Details",
            link: event.link,
            price: undefined
          })
        }
        
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
          image: eventImage,
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
          ticketLinks,
          source: 'rapidapi' as const,
          externalId: event.event_id,
        }
      })

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
      
      // Add source and external ID to events with direct image usage
      const eventsWithSource = result.events.map((event) => {
        // Use Ticketmaster image directly, fallback to category image if not available
        const eventImage = event.image && event.image.startsWith('http')
          ? event.image
          : this.getCategoryImage(event.category)

        return {
          ...event,
          image: eventImage,
          source: 'ticketmaster' as const,
          externalId: `tm_${event.id}`,
        }
      })

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
   * Enhanced store events in Supabase with better data handling
   */
  private async storeEvents(events: EventDetailProps[], source: 'rapidapi' | 'ticketmaster'): Promise<void> {
    try {
      if (!events || events.length === 0) {
        logger.info("No events to store")
        return
      }

      const databaseEvents = events.map(event => {
        // Enhanced external ID generation
        const externalId = (event as any).externalId ||
                          (event as any).event_id ||
                          `${source}_${event.id}_${Date.now()}`

        // Enhanced image URL validation and processing
        let imageUrl = event.image
        if (imageUrl && !this.isValidImageUrl(imageUrl)) {
          imageUrl = "/community-event.png"
        }

        // Enhanced date parsing with better error handling
        const startDate = this.parseEventDateTimeEnhanced(event.date, event.time)

        // Extract tags from various sources
        const tags = this.extractEventTags(event, source)

        return {
          external_id: externalId,
          source,
          title: event.title?.substring(0, 500) || "Untitled Event", // Limit title length
          description: event.description?.substring(0, 2000) || "", // Ensure string, not null
          category: event.category?.substring(0, 100) || null,
          start_date: startDate,
          location_name: event.location?.substring(0, 255) || null,
          location_address: event.address?.substring(0, 500) || null,
          location_lat: this.validateCoordinate(event.coordinates?.lat, 'lat'),
          location_lng: this.validateCoordinate(event.coordinates?.lng, 'lng'),
          price_min: this.extractMinPrice(event.price),
          price_max: this.extractMaxPrice(event.price),
          price_currency: "USD",
          image_url: imageUrl,
          organizer_name: event.organizer?.name?.substring(0, 255) || null,
          organizer_avatar: event.organizer?.logo || null, // Remove avatar reference
          attendee_count: Math.max(0, Math.min(event.attendees || 0, 1000000)), // Reasonable bounds
          ticket_links: this.validateTicketLinks((event as any).ticketLinks || []),
          tags,
          is_active: true,
        }
      })

      // Batch insert with better error handling
      const batchSize = 50 // Process in smaller batches
      const batches = []

      for (let i = 0; i < databaseEvents.length; i += batchSize) {
        batches.push(databaseEvents.slice(i, i + batchSize))
      }

      let totalStored = 0
      let totalErrors = 0

      for (const batch of batches) {
        try {
          const { error, count } = await this.supabase
            .from("events")
            .upsert(batch, {
              onConflict: "external_id,source",
              ignoreDuplicates: false,
            })
            .select('id', { count: 'exact', head: false })

          if (error) {
            logger.error("Error storing event batch", {
              error: error.message,
              batchSize: batch.length,
              source
            })
            totalErrors += batch.length
          } else {
            totalStored += count || batch.length
            logger.debug(`Stored batch of ${batch.length} events from ${source}`)
          }
        } catch (batchError) {
          logger.error("Batch processing error", {
            error: batchError,
            batchSize: batch.length,
            source
          })
          totalErrors += batch.length
        }
      }

      logger.info(`Event storage completed for ${source}`, {
        component: "UnifiedEventsService",
        action: "storeEvents",
        metadata: {
          source,
          totalEvents: events.length,
          totalStored,
          totalErrors,
          successRate: totalStored / events.length
        }
      })

    } catch (error) {
      logger.error("Error in storeEvents", {
        error: error instanceof Error ? error.message : String(error),
        source,
        eventCount: events.length
      })
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

    // Sort by date and time (soonest first)
    filtered.sort((a, b) => {
      const dateTimeA = this.parseEventDateTime(a.date, a.time)
      const dateTimeB = this.parseEventDateTime(b.date, b.time)
      return new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime()
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
      if (isNaN(date.getTime())) {
        return "Time TBA"
      }
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

  /**
   * Get category-specific fallback image
   */
  private getCategoryImage(category: string): string {
    const categoryImages: Record<string, string[]> = {
      "Concerts": ["/event-1.png", "/event-2.png", "/event-3.png"],
      "Club Events": ["/event-4.png", "/event-5.png", "/event-6.png"],
      "Day Parties": ["/event-7.png", "/event-8.png", "/event-9.png"],
      "Parties": ["/event-10.png", "/event-11.png", "/event-12.png"],
      "General Events": ["/community-event.png"],
    }

    const images = categoryImages[category] || categoryImages["General Events"]
    const randomIndex = Math.floor(Math.random() * images.length)
    return images[randomIndex]
  }

  /**
   * Enhanced image URL validation
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false

    try {
      const urlObj = new URL(url)
      if (!["http:", "https:"].includes(urlObj.protocol)) return false

      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".avif"]
      const imageServices = [
        "images.unsplash.com", "img.evbuc.com", "s1.ticketm.net", "media.ticketmaster.com",
        "tmol-prd.s3.amazonaws.com", "livenationinternational.com", "cdn.evbuc.com",
        "eventbrite.com", "rapidapi.com", "pexels.com", "pixabay.com", "cloudinary.com",
        "amazonaws.com", "googleusercontent.com", "fbcdn.net", "cdninstagram.com"
      ]

      const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext))
      const isFromImageService = imageServices.some(service => url.toLowerCase().includes(service.toLowerCase()))

      return hasImageExtension || isFromImageService
    } catch {
      return false
    }
  }

  /**
   * Enhanced date/time parsing
   */
  private parseEventDateTimeEnhanced(date: string, time?: string): string {
    try {
      if (!date) return new Date().toISOString()

      let dateTime: Date

      // Try parsing the date
      if (date.includes('T') || date.includes('Z')) {
        dateTime = new Date(date)
      } else {
        // Combine date and time if available
        const dateStr = time ? `${date} ${time}` : date
        dateTime = new Date(dateStr)
      }

      // Validate the parsed date
      if (isNaN(dateTime.getTime())) {
        return new Date().toISOString()
      }

      return dateTime.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  /**
   * Extract tags from event data
   */
  private extractEventTags(event: EventDetailProps, source: string): string[] {
    const tags: string[] = []

    // Add source as a tag
    tags.push(source)

    // Add category as a tag
    if (event.category) {
      tags.push(event.category.toLowerCase())
    }

    // Extract tags from title and description
    const text = `${event.title} ${event.description}`.toLowerCase()
    const commonTags = [
      'music', 'concert', 'festival', 'comedy', 'theater', 'sports', 'art', 'food',
      'business', 'conference', 'workshop', 'nightlife', 'community', 'dance'
    ]

    commonTags.forEach(tag => {
      if (text.includes(tag)) {
        tags.push(tag)
      }
    })

    // Remove duplicates and limit to 10 tags
    return [...new Set(tags)].slice(0, 10)
  }

  /**
   * Validate coordinate values
   */
  private validateCoordinate(coord: number | undefined, type: 'lat' | 'lng'): number | null {
    if (typeof coord !== 'number' || isNaN(coord)) return null

    if (type === 'lat') {
      return coord >= -90 && coord <= 90 ? coord : null
    } else {
      return coord >= -180 && coord <= 180 ? coord : null
    }
  }

  /**
   * Validate and clean ticket links
   */
  private validateTicketLinks(links: any[]): any[] {
    if (!Array.isArray(links)) return []

    return links
      .filter(link => link && typeof link === 'object' && link.link)
      .map(link => ({
        source: link.source || 'Tickets',
        link: link.link
      }))
      .slice(0, 5) // Limit to 5 ticket links
  }
}

// Export singleton instance
export const unifiedEventsService = new UnifiedEventsService()
export default unifiedEventsService