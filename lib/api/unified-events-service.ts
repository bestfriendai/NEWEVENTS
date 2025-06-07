import { createClient } from "@supabase/supabase-js"
import { env, serverEnv } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { searchTicketmasterEvents, type TicketmasterSearchParams } from "./ticketmaster-api"
import type { EventDetailProps } from "@/components/event-detail-modal"

export interface UnifiedEventSearchParams {
  // Location-based search
  lat?: number
  lng?: number
  radius?: number // in kilometers

  // Text search
  query?: string
  keyword?: string // Alias for query for compatibility

  // Category and filtering
  category?: string
  categories?: string[] // Support multiple categories

  // Date filtering
  startDate?: string
  endDate?: string
  dateRange?: {
    start: string
    end: string
  }

  // Price filtering
  priceMin?: number
  priceMax?: number
  priceRange?: {
    min: number
    max: number
  }

  // Sorting and pagination
  sortBy?: 'date' | 'distance' | 'popularity' | 'price' | 'relevance'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
  page?: number

  // Advanced filters
  tags?: string[]
  source?: 'rapidapi' | 'ticketmaster' | 'eventbrite' | 'all'
  hasImages?: boolean
  hasDescription?: boolean

  // Search behavior
  includeCache?: boolean
  forceRefresh?: boolean
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
  responseTime?: number
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
    this.supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false
      }
    })
  }

  /**
   * Search for events from multiple sources and store in Supabase
   */
  async searchEvents(params: UnifiedEventSearchParams): Promise<UnifiedEventsResponse> {
    const startTime = Date.now()

    // Normalize and validate parameters
    const normalizedParams = this.normalizeSearchParams(params)

    try {
      logger.info("Starting unified events search", {
        component: "UnifiedEventsService",
        action: "searchEvents",
        metadata: { original: params, normalized: normalizedParams },
      })

      // Input validation
      if (normalizedParams.lat && (normalizedParams.lat < -90 || normalizedParams.lat > 90)) {
        throw new Error("Invalid latitude: must be between -90 and 90")
      }
      if (normalizedParams.lng && (normalizedParams.lng < -180 || normalizedParams.lng > 180)) {
        throw new Error("Invalid longitude: must be between -180 and 180")
      }
      if (normalizedParams.radius && (normalizedParams.radius < 1 || normalizedParams.radius > 500)) {
        throw new Error("Invalid radius: must be between 1 and 500 km")
      }
      if (normalizedParams.limit && (normalizedParams.limit < 1 || normalizedParams.limit > 200)) {
        throw new Error("Invalid limit: must be between 1 and 200")
      }

      const sources = { rapidapi: 0, ticketmaster: 0, cached: 0 }
      const allEvents: EventDetailProps[] = []

      // First, check for cached events in Supabase (quick check)
      const cachedEvents = await this.getCachedEvents(normalizedParams)
      if (cachedEvents.length > 0) {
        allEvents.push(...cachedEvents)
        sources.cached = cachedEvents.length
        logger.info(`Found ${cachedEvents.length} cached events`)
      }

      // If we don't have enough cached events, fetch from APIs in parallel
      const remainingLimit = (normalizedParams.limit || 50) - allEvents.length
      if (remainingLimit > 0) {
        const apiLimit = Math.max(remainingLimit, 50) // Reduced back to 50

        // Run API calls in parallel for better performance
        const apiPromises: Promise<{ source: string; events: EventDetailProps[] }>[] = []

        // RapidAPI promise with better error handling
        if (serverEnv.RAPIDAPI_KEY) {
          apiPromises.push(
            this.fetchFromRapidAPI(normalizedParams, apiLimit)
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

        // Ticketmaster promise with better error handling and rate limiting
        if (serverEnv.TICKETMASTER_API_KEY) {
          // Add a small delay before Ticketmaster call to avoid immediate rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))

          apiPromises.push(
            this.fetchFromTicketmaster(normalizedParams, Math.min(apiLimit, 50)) // Limit Ticketmaster to 50 events max
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

      // Remove duplicates and apply advanced filtering
      const uniqueEvents = this.removeDuplicates(allEvents)
      const filteredEvents = this.applyAdvancedFilters(uniqueEvents, normalizedParams)

      // Apply sorting
      const sortedEvents = this.applySorting(filteredEvents, normalizedParams)

      // Apply pagination
      const { paginatedEvents, totalCount, hasMore } = this.applyPagination(sortedEvents, normalizedParams)

      logger.info("Unified events search completed", {
        component: "UnifiedEventsService",
        action: "searchEvents",
        metadata: {
          totalFound: filteredEvents.length,
          returned: paginatedEvents.length,
          sources,
        },
      })

      const responseTime = Date.now() - startTime
      return {
        events: paginatedEvents,
        totalCount,
        hasMore,
        sources,
        responseTime,
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

      // If we still don't have enough events, generate more comprehensive fallback events
      if (featuredEvents.length < Math.min(limit, 3)) {
        logger.info("Using enhanced fallback events due to insufficient API results")
        const fallbackEvents = this.generateEnhancedFallbackEvents(limit - featuredEvents.length, { lat, lng })
        const featuredEventsNew = [...featuredEvents, ...fallbackEvents].slice(0, limit)
        return {
          events: featuredEventsNew,
          totalCount: featuredEventsNew.length,
          hasMore: false,
          sources: { rapidapi: 0, ticketmaster: 0, cached: featuredEventsNew.length },
        }
      }

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
        size: Math.min(limit, 200),
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error("RapidAPI fetch error", {
        component: "UnifiedEventsService",
        action: "fetchFromRapidAPI",
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          hasApiKey: !!serverEnv.RAPIDAPI_KEY,
          apiHost: serverEnv.RAPIDAPI_HOST,
          params: params,
        },
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
        size: Math.min(limit, 50), // Reduced from 200 to 50 to avoid rate limits
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
        // Default to 3 months from now instead of 6 to reduce load
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + 3)
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

      // Enhanced image processing and geocoding for each event
      const eventsWithEnhancedData = await Promise.all(
        result.events.map(async (event) => {
          try {
            // Enhance images
            const { imageService } = await import("../services/image-service")
            const imageResult = await imageService.validateAndEnhanceImage(
              event.image || "",
              event.category,
              event.title,
            )

            // Add geocoding for missing coordinates
            let coordinates = event.coordinates
            if (!coordinates && event.address && event.address !== "Address TBA") {
              try {
                const { geocodingService } = await import("../services/geocoding-service")
                const geocodingResult = await geocodingService.geocodeAddress(event.address, event.location)
                if (geocodingResult.success && geocodingResult.coordinates) {
                  coordinates = geocodingResult.coordinates
                }
              } catch (geocodingError) {
                logger.warn("Failed to geocode Ticketmaster event", {
                  eventId: event.id,
                  address: event.address,
                  error: geocodingError instanceof Error ? geocodingError.message : String(geocodingError),
                })
              }
            }

            return {
              ...event,
              image: imageResult.url,
              coordinates,
              source: "ticketmaster" as const,
              externalId: `tm_${event.id}`,
            }
          } catch (error) {
            logger.warn("Failed to enhance Ticketmaster event data", {
              eventId: event.id,
              error: error instanceof Error ? error.message : String(error),
            })
            return {
              ...event,
              source: "ticketmaster" as const,
              externalId: `tm_${event.id}`,
            }
          }
        }),
      )

      return eventsWithEnhancedData
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error("Ticketmaster fetch error", {
        component: "UnifiedEventsService",
        action: "fetchFromTicketmaster",
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          hasApiKey: !!serverEnv.TICKETMASTER_API_KEY,
          params: params,
        },
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

      const { data, error } = await query.limit(params.limit || 100)

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
            const imageResult = await imageService.validateAndEnhanceImage(
              event.image || "",
              event.category,
              event.title,
            )

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
        location_lat: event.coordinates?.lat || undefined,
        location_lng: event.coordinates?.lng || undefined,
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
   * Apply advanced filters to events
   */
  private applyAdvancedFilters(events: EventDetailProps[], params: UnifiedEventSearchParams): EventDetailProps[] {
    let filtered = events

    // Filter by location radius if coordinates provided
    if (params.lat && params.lng && params.radius) {
      filtered = filtered.filter((event) => {
        if (!event.coordinates) return false
        const distance = this.calculateDistance(params.lat!, params.lng!, event.coordinates.lat, event.coordinates.lng)
        return distance <= params.radius!
      })
    }

    // Filter by multiple categories
    if (params.categories && params.categories.length > 0) {
      filtered = filtered.filter((event) =>
        params.categories!.some(cat =>
          event.category.toLowerCase().includes(cat.toLowerCase())
        )
      )
    }

    // Filter by price range
    if (params.priceRange || (params.priceMin !== undefined || params.priceMax !== undefined)) {
      const minPrice = params.priceRange?.min ?? params.priceMin
      const maxPrice = params.priceRange?.max ?? params.priceMax

      filtered = filtered.filter((event) => {
        if (!event.price || event.price.toLowerCase().includes('free')) {
          return minPrice === undefined || minPrice === 0
        }

        const eventPrice = this.extractMinPrice(event.price)
        if (eventPrice === undefined) return true

        if (minPrice !== undefined && eventPrice < minPrice) return false
        if (maxPrice !== undefined && eventPrice > maxPrice) return false

        return true
      })
    }

    // Filter by date range
    if (params.dateRange || params.startDate || params.endDate) {
      const startDate = params.dateRange?.start ?? params.startDate
      const endDate = params.dateRange?.end ?? params.endDate

      filtered = filtered.filter((event) => {
        const eventDateTime = this.parseEventDateTime(event.date, event.time)
        const eventDate = new Date(eventDateTime)

        if (startDate && eventDate < new Date(startDate)) return false
        if (endDate && eventDate > new Date(endDate)) return false

        return true
      })
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      filtered = filtered.filter((event) => {
        const eventText = `${event.title} ${event.description} ${event.category}`.toLowerCase()
        return params.tags!.some(tag => eventText.includes(tag.toLowerCase()))
      })
    }

    // Filter by content quality
    if (params.hasImages) {
      filtered = filtered.filter((event) => event.image && event.image !== '')
    }

    if (params.hasDescription) {
      filtered = filtered.filter((event) => event.description && event.description.length > 10)
    }

    return filtered
  }

  /**
   * Apply sorting to events
   */
  private applySorting(events: EventDetailProps[], params: UnifiedEventSearchParams): EventDetailProps[] {
    const sortBy = params.sortBy || 'date'
    const sortOrder = params.sortOrder || 'asc'

    const sorted = [...events].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          const dateTimeA = this.parseEventDateTime(a.date, a.time)
          const dateTimeB = this.parseEventDateTime(b.date, b.time)
          comparison = new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime()
          break

        case 'distance':
          if (params.lat && params.lng) {
            const distanceA = a.coordinates ?
              this.calculateDistance(params.lat, params.lng, a.coordinates.lat, a.coordinates.lng) :
              Infinity
            const distanceB = b.coordinates ?
              this.calculateDistance(params.lat, params.lng, b.coordinates.lat, b.coordinates.lng) :
              Infinity
            comparison = distanceA - distanceB
          }
          break

        case 'price':
          const priceA = this.extractMinPrice(a.price || '') || 0
          const priceB = this.extractMinPrice(b.price || '') || 0
          comparison = priceA - priceB
          break

        case 'popularity':
          // Use title length as popularity metric (since attendeeCount is not available)
          const popularityA = a.title.length
          const popularityB = b.title.length
          comparison = popularityB - popularityA // Higher is better for popularity
          break

        case 'relevance':
          // Simple relevance based on query match
          if (params.query || params.keyword) {
            const query = (params.query || params.keyword || '').toLowerCase()
            const relevanceA = this.calculateRelevanceScore(a, query)
            const relevanceB = this.calculateRelevanceScore(b, query)
            comparison = relevanceB - relevanceA // Higher is better for relevance
          }
          break

        default:
          comparison = 0
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return sorted
  }

  /**
   * Apply pagination to events
   */
  private applyPagination(events: EventDetailProps[], params: UnifiedEventSearchParams): {
    paginatedEvents: EventDetailProps[]
    totalCount: number
    hasMore: boolean
  } {
    const totalCount = events.length

    // Handle both offset/limit and page-based pagination
    let offset = params.offset || 0
    const limit = params.limit || 50

    if (params.page !== undefined) {
      offset = params.page * limit
    }

    const paginatedEvents = events.slice(offset, offset + limit)
    const hasMore = totalCount > offset + limit

    return {
      paginatedEvents,
      totalCount,
      hasMore
    }
  }

  /**
   * Calculate relevance score for search query
   */
  private calculateRelevanceScore(event: EventDetailProps, query: string): number {
    if (!query) return 0

    let score = 0
    const queryLower = query.toLowerCase()

    // Title match (highest weight)
    if (event.title.toLowerCase().includes(queryLower)) {
      score += 10
    }

    // Category match
    if (event.category.toLowerCase().includes(queryLower)) {
      score += 5
    }

    // Description match
    if (event.description.toLowerCase().includes(queryLower)) {
      score += 3
    }

    // Location match
    if (event.location.toLowerCase().includes(queryLower)) {
      score += 2
    }

    return score
  }

  // Helper methods

  /**
   * Normalize search parameters
   */
  private normalizeSearchParams(params: UnifiedEventSearchParams): UnifiedEventSearchParams {
    return {
      ...params,
      query: params.query || params.keyword,
      limit: params.limit || 50,
      offset: params.offset || 0,
      radius: params.radius || 25,
      sortBy: params.sortBy || 'date',
      sortOrder: params.sortOrder || 'asc',
      includeCache: params.includeCache !== false,
      forceRefresh: params.forceRefresh || false,
    }
  }

  /**
   * Extract minimum price from price string
   */
  private extractMinPrice(priceString: string): number | undefined {
    if (!priceString || typeof priceString !== 'string') return undefined

    // Handle free events
    if (priceString.toLowerCase().includes('free')) return 0

    // Extract numbers from price string
    const numbers = priceString.match(/\d+(?:\.\d{2})?/g)
    if (!numbers || numbers.length === 0) return undefined

    // Return the minimum price found
    return Math.min(...numbers.map(n => parseFloat(n)))
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
   * Generate enhanced fallback events with better variety
   */
  private generateEnhancedFallbackEvents(count: number, params?: UnifiedEventSearchParams): EventDetailProps[] {
    const fallbackEvents: EventDetailProps[] = []

    const eventTemplates = [
      {
        title: "Summer Music Festival",
        category: "Festivals",
        description: "Join us for an amazing day of live music featuring local and international artists.",
        location: "Central Park",
        address: "Central Park, New York, NY",
        price: "$45 - $85",
        image: "/event-1.png",
      },
      {
        title: "Rooftop Day Party",
        category: "Day Parties",
        description: "Dance the day away with stunning city views and amazing DJs.",
        location: "Sky Lounge",
        address: "123 High Street, Downtown",
        price: "$25 - $40",
        image: "/event-2.png",
      },
      {
        title: "Weekend Brunch & Beats",
        category: "Brunches",
        description: "Bottomless brunch with live DJ sets and craft cocktails.",
        location: "The Garden Cafe",
        address: "456 Garden Ave, Midtown",
        price: "$35 - $55",
        image: "/event-3.png",
      },
      {
        title: "Underground Club Night",
        category: "Nightlife",
        description: "Experience the best underground electronic music scene.",
        location: "The Basement",
        address: "789 Underground St, Arts District",
        price: "$20 - $30",
        image: "/event-4.png",
      },
      {
        title: "Community Block Party",
        category: "Public Events",
        description: "Free community celebration with food trucks, live music, and activities.",
        location: "Community Center",
        address: "321 Community Blvd, Neighborhood",
        price: "Free",
        image: "/community-event.png",
      },
    ]

    for (let i = 0; i < count; i++) {
      const template = eventTemplates[i % eventTemplates.length]
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30) + 1)

      fallbackEvents.push({
        id: 10000 + i,
        title: `${template.title} ${i > 4 ? Math.floor(i / 5) + 1 : ""}`.trim(),
        description: template.description,
        category: template.category,
        date: eventDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: `${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? "PM" : "AM"}`,
        location: template.location,
        address: template.address,
        price: template.price,
        image: template.image,
        organizer: {
          name: "Event Organizer",
        },
        isFavorite: false,
        coordinates:
          params?.lat && params?.lng
            ? {
                lat: params.lat + (Math.random() - 0.5) * 0.1,
                lng: params.lng + (Math.random() - 0.5) * 0.1,
              }
            : {
                lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                lng: -74.006 + (Math.random() - 0.5) * 0.1,
              },
        ticketLinks: [],
      })
    }

    return fallbackEvents
  }
}

// Export singleton instance
export const unifiedEventsService = new UnifiedEventsService()
export default unifiedEventsService
