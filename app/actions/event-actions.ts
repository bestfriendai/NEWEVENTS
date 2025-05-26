"use server"

import { z } from "zod"
import type { EventDetailProps } from "@/components/event-detail-modal"
import type { EventSearchParams } from "@/types"
import { logger } from "@/lib/utils/logger"
import { EventRepository, type EventSearchOptions } from "@/lib/backend/repositories/event-repository"
import { cacheService } from "@/lib/backend/services/cache-service"
import { searchEnhancedEvents } from "@/lib/api/enhanced-events-api"

export interface EventSearchError {
  message: string
  type: "API_ERROR" | "CONFIG_ERROR" | "VALIDATION_ERROR" | "NETWORK_ERROR" | "UNKNOWN_ERROR"
  statusCode?: number
}

export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  error?: EventSearchError
  source?: string
  hasMore?: boolean
  page?: number
}

// Initialize repository
const eventRepository = new EventRepository()

// Zod schemas for validation
const EventSearchParamsSchema = z.object({
  keyword: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().min(1).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categories: z.array(z.string()).optional(),
  page: z.number().min(0).optional(),
  size: z.number().min(1).max(100).optional(),
  sort: z.string().optional(),
})

/**
 * Enhanced event fetching with multi-level caching and database integration
 */
export async function fetchEvents(params: EventSearchParams): Promise<EventSearchResult> {
  try {
    logger.info("Enhanced event fetching started", {
      component: "event-actions",
      action: "fetch_events_start",
      metadata: { params },
    })

    // Validate input parameters
    const validationResult = EventSearchParamsSchema.safeParse(params)
    if (!validationResult.success) {
      logger.warn("Invalid search parameters", {
        component: "event-actions",
        action: "validation_error",
        metadata: { errors: validationResult.error.flatten() },
      })

      return {
        events: [],
        totalCount: 0,
        error: {
          message: "Invalid search parameters",
          type: "VALIDATION_ERROR",
        },
      }
    }

    const validatedParams = validationResult.data

    // If location is a string and radius is not set, provide a default
    if (
      typeof validatedParams.location === "string" &&
      validatedParams.location.trim() !== "" &&
      typeof validatedParams.radius === "undefined"
    ) {
      validatedParams.radius = 50 // Default radius of 50km
      logger.info("Default radius applied for string location", {
        component: "event-actions",
        metadata: { location: validatedParams.location, radius: validatedParams.radius },
      })
    }

    // Create cache key - make it shorter and more stable
    const cacheKeyData = {
      loc: validatedParams.location,
      r: validatedParams.radius,
      k: validatedParams.keyword,
      s: validatedParams.size || 20,
      p: validatedParams.page || 0,
    }
    const cacheKey = `search:${Buffer.from(JSON.stringify(cacheKeyData)).toString("base64").slice(0, 50)}`

    // Try to get from cache first (with graceful fallback)
    let cachedResult: EventSearchResult | null = null
    try {
      cachedResult = await cacheService.get<EventSearchResult>(cacheKey, {
        ttl: 300, // 5 minutes
        namespace: "events",
      })
    } catch (cacheError) {
      logger.warn("Cache service unavailable, proceeding without cache", {
        component: "event-actions",
        action: "cache_unavailable",
        metadata: { error: cacheError instanceof Error ? cacheError.message : String(cacheError) },
      })
    }

    if (cachedResult) {
      logger.info("Cache hit for event search", {
        component: "event-actions",
        action: "cache_hit",
        metadata: { cacheKey },
      })
      return { ...cachedResult, source: `${cachedResult.source} (Cached)` }
    }

    // Try database first for better performance
    const dbResult = await searchEventsFromDatabase(validatedParams)

    if (dbResult.events.length > 0) {
      // Try to cache the database result (don't fail if caching fails)
      try {
        await cacheService.set(cacheKey, dbResult, {
          ttl: 600, // 10 minutes for database results
          namespace: "events",
        })
      } catch (cacheError) {
        logger.warn("Failed to cache database result", {
          component: "event-actions",
          action: "cache_set_warning",
        })
      }

      logger.info("Database search successful", {
        component: "event-actions",
        action: "database_search_success",
        metadata: { eventCount: dbResult.events.length },
      })

      return { ...dbResult, source: "Database" }
    }

    // Fallback to external APIs
    logger.info("Falling back to external API search", {
      component: "event-actions",
      action: "api_fallback",
    })

    const apiResult = await searchEventsFromAPI(validatedParams)

    // Store API results in database for future use
    if (apiResult.events.length > 0) {
      await storeEventsInDatabase(apiResult.events)
    }

    // Try to cache the API result (don't fail if caching fails)
    try {
      await cacheService.set(cacheKey, apiResult, {
        ttl: 300, // 5 minutes for API results
        namespace: "events",
      })
    } catch (cacheError) {
      logger.warn("Failed to cache API result", {
        component: "event-actions",
        action: "cache_set_warning",
      })
    }

    return apiResult
  } catch (error) {
    logger.error(
      "Error in enhanced event fetching",
      {
        component: "event-actions",
        action: "fetch_events_error",
        metadata: { params },
      },
      error instanceof Error ? error : new Error("Unknown error"),
    )

    // Return fallback events on error
    const fallbackEvents = generateFallbackEvents(params.location || "New York", params.size || 20)

    return {
      events: fallbackEvents,
      totalCount: fallbackEvents.length,
      error: {
        message: `${error instanceof Error ? error.message : "Unknown error"}. Showing sample events.`,
        type: "UNKNOWN_ERROR",
      },
      source: "Fallback",
    }
  }
}

/**
 * Search events from database
 */
async function searchEventsFromDatabase(params: EventSearchParams): Promise<EventSearchResult> {
  try {
    const searchOptions: EventSearchOptions = {
      limit: params.size || 20,
      offset: (params.page || 0) * (params.size || 20),
      orderBy: "popularity_score",
      orderDirection: "desc",
      isActive: true,
    }

    // Add search filters
    if (params.keyword) {
      searchOptions.searchText = params.keyword
    }

    if (params.categories && params.categories.length > 0) {
      searchOptions.category = params.categories[0] // For now, use first category
    }

    if (params.location) {
      // In a real implementation, you'd geocode the location first
      searchOptions.location = {
        lat: 40.7128, // Default to NYC
        lng: -74.006,
        radius: params.radius || 25,
      }
    }

    if (params.startDate && params.endDate) {
      searchOptions.dateRange = {
        start: params.startDate,
        end: params.endDate,
      }
    }

    const result = await eventRepository.searchEvents(searchOptions)

    if (result.error) {
      throw new Error(result.error)
    }

    // Transform database events to EventDetailProps format
    const transformedEvents = result.data.map(transformDatabaseEventToEventDetail)

    return {
      events: transformedEvents,
      totalCount: result.count,
      hasMore: result.hasMore,
      page: params.page || 0,
    }
  } catch (error) {
    logger.error(
      "Database search error",
      {
        component: "event-actions",
        action: "database_search_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      events: [],
      totalCount: 0,
      hasMore: false,
      page: 0,
    }
  }
}

/**
 * Search events from external APIs
 */
async function searchEventsFromAPI(params: EventSearchParams): Promise<EventSearchResult> {
  try {
    const enhancedParams = {
      keyword: params.keyword,
      location: params.location,
      radius: params.radius,
      startDateTime: params.startDate,
      endDateTime: params.endDate,
      categories: params.categories,
      page: params.page,
      size: params.size,
      userPreferences: {
        favoriteCategories: params.categories || [],
        pricePreference: "any" as const,
        timePreference: "any" as const,
      },
    }

    const result = await searchEnhancedEvents(enhancedParams)

    return {
      events: result.events,
      totalCount: result.totalCount,
      hasMore: (result.page + 1) * (params.size || 20) < result.totalCount,
      page: result.page,
      source: result.sources?.join(", ") || "API",
    }
  } catch (error) {
    logger.error(
      "API search error",
      {
        component: "event-actions",
        action: "api_search_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    throw error
  }
}

/**
 * Store events in database for future use
 */
async function storeEventsInDatabase(events: EventDetailProps[]): Promise<void> {
  try {
    const dbEvents = events.map(transformEventDetailToDatabaseEvent)

    // Use bulk insert for better performance
    const result = await eventRepository.bulkInsertEvents(dbEvents)

    if (result.error) {
      logger.warn("Failed to store some events in database", {
        component: "event-actions",
        action: "store_events_warning",
        metadata: { error: result.error },
      })
    } else {
      logger.info("Successfully stored events in database", {
        component: "event-actions",
        action: "store_events_success",
        metadata: { count: result.data?.length || 0 },
      })
    }
  } catch (error) {
    logger.error(
      "Error storing events in database",
      {
        component: "event-actions",
        action: "store_events_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )
  }
}

/**
 * Transform database event to EventDetailProps
 */
function transformDatabaseEventToEventDetail(dbEvent: any): EventDetailProps {
  return {
    id: dbEvent.id,
    title: dbEvent.title || "Untitled Event",
    description: dbEvent.description || "No description available",
    category: dbEvent.category || "Event",
    date: dbEvent.start_date
      ? new Date(dbEvent.start_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date TBA",
    time: dbEvent.start_date
      ? new Date(dbEvent.start_date).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "Time TBA",
    location: dbEvent.location_name || "Location TBA",
    address: dbEvent.location_address || "Address TBA",
    price:
      dbEvent.price_min && dbEvent.price_max
        ? `$${dbEvent.price_min} - $${dbEvent.price_max}`
        : dbEvent.price_min
          ? `From $${dbEvent.price_min}`
          : "Price TBA",
    image: dbEvent.image_url || `/event-${(dbEvent.id % 12) + 1}.png`,
    organizer: {
      name: dbEvent.organizer_name || "Event Organizer",
      avatar: dbEvent.organizer_avatar || `/avatar-${(dbEvent.id % 6) + 1}.png`,
    },
    attendees: dbEvent.attendee_count || 0,
    isFavorite: false, // This would be determined by user context
    coordinates:
      dbEvent.location_lat && dbEvent.location_lng
        ? {
            lat: Number(dbEvent.location_lat),
            lng: Number(dbEvent.location_lng),
          }
        : undefined,
    ticketLinks: dbEvent.ticket_links || [],
  }
}

/**
 * Transform EventDetailProps to database event
 */
function transformEventDetailToDatabaseEvent(event: EventDetailProps): any {
  return {
    external_id: `external_${event.id}`,
    title: event.title,
    description: event.description,
    category: event.category,
    start_date: event.date && event.time ? new Date(`${event.date} ${event.time}`).toISOString() : null,
    location_name: event.location,
    location_address: event.address,
    location_lat: event.coordinates?.lat,
    location_lng: event.coordinates?.lng,
    image_url: event.image,
    organizer_name: event.organizer.name,
    organizer_avatar: event.organizer.avatar,
    attendee_count: event.attendees,
    ticket_links: event.ticketLinks || [],
    source_provider: "api_import",
    popularity_score: Math.random() * 100, // Simple popularity calculation
    is_active: true,
  }
}

/**
 * Generate fallback events (keeping existing implementation)
 */
function generateFallbackEvents(location: string, count: number): EventDetailProps[] {
  logger.info("Generating fallback events", {
    component: "event-actions",
    action: "generate_fallback",
    metadata: { location, count },
  })

  const categories = ["Music", "Arts", "Sports", "Food", "Business"]
  const venues = ["Arena", "Theater", "Stadium", "Hall", "Center", "Park", "Gallery", "Club"]

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length]!
    const venue = venues[index % venues.length]!
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1)

    return {
      id: 9000 + index,
      title: `${category} Event in ${location}`,
      description: `Join us for an amazing ${category.toLowerCase()} event in ${location}.`,
      category,
      date: futureDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
      location: `${venue} ${index + 1}`,
      address: `${location} Area`,
      price: Math.random() > 0.3 ? `$${Math.floor(Math.random() * 100) + 10}` : "Free",
      image: `/event-${(index % 12) + 1}.png`,
      organizer: {
        name: `${location} Events`,
        avatar: `/avatar-${(index % 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.006 + (Math.random() - 0.5) * 0.1,
      },
    }
  })
}

/**
 * Get featured events with caching
 */
export async function getFeaturedEvents(limit = 20): Promise<EventDetailProps[]> {
  try {
    const cacheKey = `featured_events:${limit}`

    // Try cache first, but don't fail if cache is unavailable
    let cachedEvents: EventDetailProps[] | null = null
    try {
      cachedEvents = await cacheService.get<EventDetailProps[]>(cacheKey, {
        ttl: 1800, // 30 minutes
        namespace: "events",
      })
    } catch (cacheError) {
      logger.warn("Cache unavailable for featured events", {
        component: "event-actions",
        action: "featured_cache_warning",
      })
    }

    if (cachedEvents) {
      return cachedEvents
    }

    // Generate fresh data
    let freshEvents: EventDetailProps[]
    try {
      // Try database first
      const dbResult = await eventRepository.getPopularEvents(limit)
      if (dbResult.data.length > 0) {
        freshEvents = dbResult.data.map(transformDatabaseEventToEventDetail)
      } else {
        // Fallback to API
        const apiResult = await searchEnhancedEvents({
          keyword: "featured popular trending concerts festivals",
          location: "New York",
          size: limit,
        })
        freshEvents = apiResult.events
      }
    } catch (error) {
      // Final fallback
      freshEvents = generateFallbackEvents("New York", limit)
    }

    // Try to cache the result
    try {
      await cacheService.set(cacheKey, freshEvents, {
        ttl: 1800,
        namespace: "events",
      })
    } catch (cacheError) {
      logger.warn("Failed to cache featured events", {
        component: "event-actions",
        action: "featured_cache_set_warning",
      })
    }

    return freshEvents
  } catch (error) {
    logger.error(
      "Error getting featured events",
      {
        component: "event-actions",
        action: "get_featured_events_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return generateFallbackEvents("New York", limit)
  }
}

/**
 * Get events by category with caching
 */
export async function getEventsByCategory(category: string, limit = 30): Promise<EventDetailProps[]> {
  try {
    const cacheKey = `category_events:${category}:${limit}`

    // Try cache first, but don't fail if cache is unavailable
    let cachedEvents: EventDetailProps[] | null = null
    try {
      cachedEvents = await cacheService.get<EventDetailProps[]>(cacheKey, {
        ttl: 1800, // 30 minutes
        namespace: "events",
      })
    } catch (cacheError) {
      logger.warn("Cache unavailable for category events", {
        component: "event-actions",
        action: "category_cache_warning",
      })
    }

    if (cachedEvents) {
      return cachedEvents
    }

    // Generate fresh data
    let freshEvents: EventDetailProps[]
    try {
      // Try database first
      const dbResult = await eventRepository.getEventsByCategory(category, limit)
      if (dbResult.data.length > 0) {
        freshEvents = dbResult.data.map(transformDatabaseEventToEventDetail)
      } else {
        // Fallback to API
        const apiResult = await searchEnhancedEvents({
          keyword: category,
          location: "New York",
          size: limit,
          categories: [category.toLowerCase()],
        })
        freshEvents = apiResult.events
      }
    } catch (error) {
      // Final fallback
      freshEvents = generateFallbackEvents("New York", limit)
    }

    // Try to cache the result
    try {
      await cacheService.set(cacheKey, freshEvents, {
        ttl: 1800,
        namespace: "events",
      })
    } catch (cacheError) {
      logger.warn("Failed to cache category events", {
        component: "event-actions",
        action: "category_cache_set_warning",
      })
    }

    return freshEvents
  } catch (error) {
    logger.error(
      "Error getting events by category",
      {
        component: "event-actions",
        action: "get_events_by_category_error",
        metadata: { category },
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return generateFallbackEvents("New York", limit)
  }
}
