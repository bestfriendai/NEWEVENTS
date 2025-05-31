import { createClient } from "@supabase/supabase-js"
import { env, serverEnv } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { searchTicketmasterEvents, type TicketmasterSearchParams } from "./ticketmaster-api"
import type { EventDetailProps } from "@/components/event-detail-modal"

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
  source: "rapidapi" | "ticketmaster"
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
    this.supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
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

      // First, check for cached events in Supabase (quick check)
      const cachedEvents = await this.getCachedEvents(params)
      if (cachedEvents.length > 0) {
        allEvents.push(...cachedEvents)
        sources.cached = cachedEvents.length
        logger.info(`Found ${cachedEvents.length} cached events`)
      }

      // If we don't have enough cached events, fetch from APIs in parallel
      const remainingLimit = (params.limit || 50) - allEvents.length
      if (remainingLimit > 0) {
        const apiLimit = Math.max(remainingLimit, 30) // Increased minimum

        // Run API calls in parallel for better performance
        const apiPromises: Promise<{ source: string; events: EventDetailProps[] }>[] = []

        // RapidAPI promise with better error handling
        if (serverEnv.RAPIDAPI_KEY) {
          apiPromises.push(
            this.fetchFromRapidAPI(params, apiLimit)
              .then((events) => ({ source: "rapidapi", events }))
              .catch((error) => {
                logger.error("RapidAPI fetch failed", {
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                })
                return { source: "rapidapi", events: [] }
              }),
          )
        }

        // Ticketmaster promise with better error handling
        if (serverEnv.TICKETMASTER_API_KEY) {
          apiPromises.push(
            this.fetchFromTicketmaster(params, apiLimit)
              .then((events) => ({ source: "ticketmaster", events }))
              .catch((error) => {
                logger.error("Ticketmaster fetch failed", {
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                })
                return { source: "ticketmaster", events: [] }
              }),
          )
        }

        // Wait for all API calls to complete
        const apiResults = await Promise.all(apiPromises)

        // Process results and store events
        for (const result of apiResults) {
          if (result.events.length > 0) {
            // Store events in background (don't wait)
            this.storeEvents(result.events, result.source as "rapidapi" | "ticketmaster").catch((error) =>
              logger.error(`Failed to store ${result.source} events`, { error }),
            )

            allEvents.push(...result.events)
            sources[result.source as keyof typeof sources] = result.events.length
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
   * Fetch events from RapidAPI with enhanced error handling
   */
  private async fetchFromRapidAPI(params: UnifiedEventSearchParams, limit: number): Promise<EventDetailProps[]> {
    try {
      // Check if API key is available
      if (!serverEnv.RAPIDAPI_KEY) {
        logger.warn("RapidAPI key not configured")
        return []
      }

      // Use the enhanced RapidAPI search from events-api.ts
      const { searchRapidApiEvents } = await import("./events-api")

      // Build enhanced search parameters
      const searchParams = {
        keyword: params.query,
        location: params.lat && params.lng ? `${params.lat},${params.lng}` : undefined,
        coordinates: params.lat && params.lng ? { lat: params.lat, lng: params.lng } : undefined,
        radius: params.radius || 25,
        startDateTime: params.startDate || new Date().toISOString(), // Only future events
        endDateTime: params.endDate,
        size: Math.min(limit, 100),
        sort: "date",
      }

      logger.debug("RapidAPI search parameters", {
        component: "UnifiedEventsService",
        action: "fetchFromRapidAPI",
        metadata: { searchParams },
      })

      const events = await searchRapidApiEvents(searchParams)

      // Filter out past events
      const futureEvents = events.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate >= new Date()
      })

      logger.info(`RapidAPI returned ${events.length} events, ${futureEvents.length} are future events`)
      return futureEvents
    } catch (error) {
      logger.error("RapidAPI fetch error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hasApiKey: !!serverEnv.RAPIDAPI_KEY,
        apiHost: serverEnv.RAPIDAPI_HOST,
      })
      return []
    }
  }

  /**
   * Fetch events from Ticketmaster with enhanced error handling
   */
  private async fetchFromTicketmaster(params: UnifiedEventSearchParams, limit: number): Promise<EventDetailProps[]> {
    try {
      // Check if API key is available
      if (!serverEnv.TICKETMASTER_API_KEY) {
        logger.warn("Ticketmaster API key not configured")
        return []
      }

      const ticketmasterParams: TicketmasterSearchParams = {
        size: Math.min(limit, 200),
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

      // Ensure we only get future events with proper date formatting
      const now = new Date()
      ticketmasterParams.startDateTime = params.startDate || now.toISOString()

      if (params.endDate) {
        ticketmasterParams.endDateTime = params.endDate
      } else {
        // Default to 6 months from now
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + 6)
        ticketmasterParams.endDateTime = futureDate.toISOString()
      }

      logger.debug("Ticketmaster search parameters", {
        component: "UnifiedEventsService",
        action: "fetchFromTicketmaster",
        metadata: { ticketmasterParams },
      })

      const result = await searchTicketmasterEvents(ticketmasterParams)

      if (result.error) {
        logger.warn("Ticketmaster API returned error", { error: result.error })
        return []
      }

      // Enhanced image processing for each event
      const eventsWithEnhancedImages = await Promise.all(
        result.events.map(async (event) => {
          try {
            const { imageService } = await import("../services/image-service")
            const imageResult = await imageService.validateAndEnhanceImage(event.image, event.category, event.title)

            return {
              ...event,
              image: imageResult.url,
              source: "ticketmaster" as const,
              externalId: `tm_${event.id}`,
            }
          } catch (imageError) {
            logger.warn("Failed to enhance Ticketmaster event image", {
              eventId: event.id,
              error: imageError instanceof Error ? imageError.message : String(imageError),
            })
            return {
              ...event,
              source: "ticketmaster" as const,
              externalId: `tm_${event.id}`,
            }
          }
        }),
      )

      return eventsWithEnhancedImages
    } catch (error) {
      logger.error("Ticketmaster fetch error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hasApiKey: !!serverEnv.TICKETMASTER_API_KEY,
      })
      return []
    }
  }

  /**
   * Get cached events from Supabase
   */
  private async getCachedEvents(params: UnifiedEventSearchParams): Promise<EventDetailProps[]> {
    try {
      logger.info("Fetching cached events", {
        component: "UnifiedEventsService",
        action: "getCachedEvents",
        metadata: params,
      })

      const now = new Date()

      let query = this.supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("start_date", now.toISOString()) // Only future events
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

      // Only get events cached in the last 4 hours for freshness
      const fourHoursAgo = new Date()
      fourHoursAgo.setHours(fourHoursAgo.getHours() - 4)
      query = query.gte("created_at", fourHoursAgo.toISOString())

      const { data, error } = await query.limit(params.limit || 50)

      if (error) {
        logger.error("Supabase query error in getCachedEvents", {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return []
      }

      if (!data || data.length === 0) {
        logger.info("No cached events found", { params })
        return []
      }

      logger.info(`Found ${data.length} cached events`, { count: data.length })

      // Enhanced image processing for cached events with better error handling
      const eventsWithEnhancedImages = await Promise.allSettled(
        data.map(async (dbEvent) => {
          try {
            const event = this.transformDatabaseEventToProps(dbEvent)

            // Skip image validation for cached events if they already have valid images
            if (event.image && event.image.startsWith("http")) {
              return event
            }

            const { imageService } = await import("../services/image-service")
            const imageResult = await imageService.validateAndEnhanceImage(event.image, event.category, event.title)

            return {
              ...event,
              image: imageResult.url,
            }
          } catch (error) {
            logger.warn("Error processing cached event image", {
              eventId: dbEvent.id,
              error: error instanceof Error ? error.message : String(error),
            })

            // Return event with fallback image on error
            const event = this.transformDatabaseEventToProps(dbEvent)
            return {
              ...event,
              image: this.getCategoryImage(event.category),
            }
          }
        }),
      )

      // Filter out failed results and extract successful ones
      const successfulEvents = eventsWithEnhancedImages
        .filter((result): result is PromiseFulfilledResult<EventDetailProps> => result.status === "fulfilled")
        .map((result) => result.value)

      return successfulEvents
    } catch (error) {
      logger.error("Error in getCachedEvents", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        params,
      })
      return []
    }
  }

  /**
   * Store events in Supabase
   */
  private async storeEvents(events: EventDetailProps[], source: "rapidapi" | "ticketmaster"): Promise<void> {
    try {
      logger.info(`Storing ${events.length} events from ${source}`, {
        component: "UnifiedEventsService",
        action: "storeEvents",
        metadata: { source, count: events.length },
      })

      const databaseEvents: DatabaseEvent[] = events.map((event) => ({
        external_id: (event as any).externalId || `${source}_${event.id}`,
        source,
        title: event.title,
        description: event.description,
        category: event.category,
        start_date: this.parseEventDateTime(event.date, event.time),
        location_name: event.location,
        location_address: event.address,
        location_lat: event.coordinates?.lat || null,
        location_lng: event.coordinates?.lng || null,
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

      // Store events individually to avoid constraint conflicts
      let storedCount = 0
      let skippedCount = 0

      for (const event of databaseEvents) {
        try {
          // Check if event already exists
          const { data: existing, error: selectError } = await this.supabase
            .from("events")
            .select("id")
            .eq("external_id", event.external_id)
            .eq("source", event.source)
            .maybeSingle()

          if (selectError) {
            logger.error("Error checking existing event", {
              error: selectError.message,
              eventId: event.external_id,
            })
            continue
          }

          if (existing) {
            skippedCount++
            continue
          }

          // Insert new event
          const { error: insertError } = await this.supabase.from("events").insert(event)

          if (insertError) {
            logger.error("Error inserting event", {
              error: insertError.message,
              code: insertError.code,
              eventId: event.external_id,
              title: event.title,
            })
          } else {
            storedCount++
          }
        } catch (eventError) {
          logger.error("Error processing individual event", {
            error: eventError instanceof Error ? eventError.message : String(eventError),
            eventId: event.external_id,
          })
        }
      }

      logger.info(`Event storage completed for ${source}`, {
        total: databaseEvents.length,
        stored: storedCount,
        skipped: skippedCount,
      })
    } catch (error) {
      logger.error("Error in storeEvents", {
        error: error instanceof Error ? error.message : String(error),
        source,
        batchSize: events.length,
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
      coordinates:
        dbEvent.location_lat && dbEvent.location_lng
          ? {
              lat: dbEvent.location_lat,
              lng: dbEvent.location_lng,
            }
          : undefined,
      ticketLinks: dbEvent.ticket_links || [],
    }
  }

  /**
   * Remove duplicate events based on title and location
   */
  private removeDuplicates(events: EventDetailProps[]): EventDetailProps[] {
    const seen = new Set<string>()
    return events.filter((event) => {
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
      filtered = filtered.filter((event) => {
        if (!event.coordinates) return false
        const distance = this.calculateDistance(params.lat!, params.lng!, event.coordinates.lat, event.coordinates.lng)
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
      hash = (hash << 5) - hash + char
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
    const match = priceString.match(/\$(\d+(?:\.\d{2})?)/)
    return match ? Number.parseFloat(match[1]) : undefined
  }

  private extractMaxPrice(priceString: string): number | undefined {
    const matches = priceString.match(/\$(\d+(?:\.\d{2})?)/g)
    if (matches && matches.length > 1) {
      return Number.parseFloat(matches[1].replace("$", ""))
    }
    return this.extractMinPrice(priceString)
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
      Concerts: "Music",
      "Club Events": "Music",
      "Day Parties": "Music",
      Parties: "Music",
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
      Concerts: ["/event-1.png", "/event-2.png", "/event-3.png"],
      "Club Events": ["/event-4.png", "/event-5.png", "/event-6.png"],
      "Day Parties": ["/event-7.png", "/event-8.png", "/event-9.png"],
      Parties: ["/event-10.png", "/event-11.png", "/event-12.png"],
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
        "images.unsplash.com",
        "img.evbuc.com",
        "s1.ticketm.net",
        "media.ticketmaster.com",
        "tmol-prd.s3.amazonaws.com",
        "livenationinternational.com",
        "cdn.evbuc.com",
        "eventbrite.com",
        "rapidapi.com",
        "pexels.com",
        "pixabay.com",
        "cloudinary.com",
        "amazonaws.com",
        "googleusercontent.com",
        "fbcdn.net",
        "cdninstagram.com",
      ]

      const hasImageExtension = imageExtensions.some((ext) => url.toLowerCase().includes(ext))
      const isFromImageService = imageServices.some((service) => url.toLowerCase().includes(service.toLowerCase()))

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
      if (date.includes("T") || date.includes("Z")) {
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
      "music",
      "concert",
      "festival",
      "comedy",
      "theater",
      "sports",
      "art",
      "food",
      "business",
      "conference",
      "workshop",
      "nightlife",
      "community",
      "dance",
    ]

    commonTags.forEach((tag) => {
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
  private validateCoordinate(coord: number | undefined, type: "lat" | "lng"): number | null {
    if (typeof coord !== "number" || isNaN(coord)) return null

    if (type === "lat") {
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
      .filter((link) => link && typeof link === "object" && link.link)
      .map((link) => ({
        source: link.source || "Tickets",
        link: link.link,
      }))
      .slice(0, 5) // Limit to 5 ticket links
  }
}

// Export singleton instance
export const unifiedEventsService = new UnifiedEventsService()
export default unifiedEventsService
