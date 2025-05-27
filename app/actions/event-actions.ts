"use server"

import {
  searchEvents as searchEventsAPI,
  getFeaturedEvents as getFeaturedEventsAPI,
  type EventSearchParams,
} from "@/lib/api/events-api"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: {
    message: string
    code?: string
  }
  cached?: boolean
  responseTime?: number
}

// Zod schemas for validation
// const EventSearchParamsSchema = z.object({
//   keyword: z.string().optional(),
//   location: z.string().optional(),
//   radius: z.number().min(1).max(100).optional(),
//   startDate: z.string().optional(),
//   endDate: z.string().optional(),
//   categories: z.array(z.string()).optional(),
//   page: z.number().min(0).optional(),
//   size: z.number().min(1).max(100).optional(),
//   sort: z.string().optional(),
// })

/**
 * Enhanced event fetching with multi-level caching and database integration
 */
export async function fetchEvents(params: {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number
  size?: number
  page?: number
  sort?: string
  categories?: string[]
}): Promise<EventSearchResult> {
  try {
    logger.info("Server action: fetchEvents called", { params })

    // Convert to API parameters
    const searchParams: EventSearchParams = {
      keyword: params.keyword,
      location: params.location,
      coordinates: params.coordinates,
      radius: params.radius || 25,
      size: params.size || 20,
      page: params.page || 0,
      sort: params.sort || "date",
      categories: params.categories,
    }

    // If we have coordinates but no location string, create one
    if (params.coordinates && !params.location) {
      searchParams.location = `${params.coordinates.lat},${params.coordinates.lng}`
    }

    const result = await searchEventsAPI(searchParams)

    // Transform the result to match our interface
    return {
      events: result.events,
      totalCount: result.totalCount,
      page: result.page,
      totalPages: result.totalPages,
      sources: result.sources,
      error: result.error ? { message: result.error } : undefined,
      cached: result.cached,
      responseTime: result.responseTime,
    }
  } catch (error) {
    logger.error("Server action: fetchEvents failed", { error, params })

    return {
      events: [],
      totalCount: 0,
      page: 0,
      totalPages: 0,
      sources: [],
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch events",
        code: "FETCH_ERROR",
      },
    }
  }
}

/**
 * Search events from database
 */
// async function searchEventsFromDatabase(params: EventSearchParams): Promise<EventSearchResult> {
//   try {
//     const searchOptions: EventSearchOptions = {
//       limit: params.size || 20,
//       offset: (params.page || 0) * (params.size || 20),
//       orderBy: "popularity_score",
//       orderDirection: "desc",
//       isActive: true,
//     }

//     // Add search filters
//     if (params.keyword) {
//       searchOptions.searchText = params.keyword
//     }

//     if (params.categories && params.categories.length > 0) {
//       searchOptions.category = params.categories[0] // For now, use first category
//     }

//     if (params.location) {
//       // In a real implementation, you'd geocode the location first
//       searchOptions.location = {
//         lat: 40.7128, // Default to NYC
//         lng: -74.006,
//         radius: params.radius || 25,
//       }
//     }

//     if (params.startDate && params.endDate) {
//       searchOptions.dateRange = {
//         start: params.startDate,
//         end: params.endDate,
//       }
//     }

//     const result = await eventRepository.searchEvents(searchOptions)

//     if (result.error) {
//       throw new Error(result.error)
//     }

//     // Transform database events to EventDetailProps format
//     const transformedEvents = result.data.map(transformDatabaseEventToEventDetail)

//     return {
//       events: transformedEvents,
//       totalCount: result.count,
//       hasMore: result.hasMore,
//       page: params.page || 0,
//     }
//   } catch (error) {
//     logger.error(
//       "Database search error",
//       {
//         component: "event-actions",
//         action: "database_search_error",
//       },
//       error instanceof Error ? error : new Error(String(error)),
//     )

//     return {
//       events: [],
//       totalCount: 0,
//       hasMore: false,
//       page: 0,
//     }
//   }
// }

/**
 * Search events from external APIs
 */
// async function searchEventsFromAPI(params: EventSearchParams): Promise<EventSearchResult> {
//   try {
//     const enhancedParams = {
//       keyword: params.keyword,
//       location: params.location,
//       radius: params.radius,
//       startDateTime: params.startDate,
//       endDateTime: params.endDate,
//       categories: params.categories,
//       page: params.page,
//       size: params.size,
//       userPreferences: {
//         favoriteCategories: params.categories || [],
//         pricePreference: "any" as const,
//         timePreference: "any" as const,
//       },
//     }

//     const result = await searchEnhancedEvents(enhancedParams)

//     return {
//       events: result.events,
//       totalCount: result.totalCount,
//       hasMore: (result.page + 1) * (params.size || 20) < result.totalCount,
//       page: result.page,
//       source: result.sources?.join(", ") || "API",
//     }
//   } catch (error) {
//     logger.error(
//       "API search error",
//       {
//         component: "event-actions",
//         action: "api_search_error",
//       },
//       error instanceof Error ? error : new Error(String(error)),
//     )

//     throw error
//   }
// }

/**
 * Store events in database for future use
 */
// async function storeEventsInDatabase(events: EventDetailProps[]): Promise<void> {
//   try {
//     const dbEvents = events.map(transformEventDetailToDatabaseEvent)

//     // Use bulk insert for better performance
//     const result = await eventRepository.bulkInsertEvents(dbEvents)

//     if (result.error) {
//       logger.warn("Failed to store some events in database", {
//         component: "event-actions",
//         action: "store_events_warning",
//         metadata: { error: result.error },
//       })
//     } else {
//       logger.info("Successfully stored events in database", {
//         component: "event-actions",
//         action: "store_events_success",
//         metadata: { count: result.data?.length || 0 },
//       })
//     }
//   } catch (error) {
//     logger.error(
//       "Error storing events in database",
//       {
//         component: "event-actions",
//         action: "store_events_error",
//       },
//       error instanceof Error ? error : new Error(String(error)),
//     )
//   }
// }

/**
 * Transform database event to EventDetailProps
 */
// function transformDatabaseEventToEventDetail(dbEvent: any): EventDetailProps {
//   return {
//     id: dbEvent.id,
//     title: dbEvent.title || "Untitled Event",
//     description: dbEvent.description || "No description available",
//     category: dbEvent.category || "Event",
//     date: dbEvent.start_date
//       ? new Date(dbEvent.start_date).toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         })
//       : "Date TBA",
//     time: dbEvent.start_date
//       ? new Date(dbEvent.start_date).toLocaleTimeString("en-US", {
//           hour: "numeric",
//           minute: "2-digit",
//           hour12: true,
//         })
//       : "Time TBA",
//     location: dbEvent.location_name || "Location TBA",
//     address: dbEvent.location_address || "Address TBA",
//     price:
//       dbEvent.price_min && dbEvent.price_max
//         ? `$${dbEvent.price_min} - $${dbEvent.price_max}`
//         : dbEvent.price_min
//           ? `From $${dbEvent.price_min}`
//           : "Price TBA",
//     image: dbEvent.image_url || `/event-${(dbEvent.id % 12) + 1}.png`,
//     organizer: {
//       name: dbEvent.organizer_name || "Event Organizer",
//       avatar: dbEvent.organizer_avatar || `/avatar-${(dbEvent.id % 6) + 1}.png`,
//     },
//     attendees: dbEvent.attendee_count || 0,
//     isFavorite: false, // This would be determined by user context
//     coordinates:
//       dbEvent.location_lat && dbEvent.location_lng
//         ? {
//             lat: Number(dbEvent.location_lat),
//             lng: Number(dbEvent.location_lng),
//           }
//         : undefined,
//     ticketLinks: dbEvent.ticket_links || [],
//   }
// }

/**
 * Transform EventDetailProps to database event
 */
// function transformEventDetailToDatabaseEvent(event: EventDetailProps): any {
//   return {
//     external_id: `external_${event.id}`,
//     title: event.title,
//     description: event.description,
//     category: event.category,
//     start_date: event.date && event.time ? new Date(`${event.date} ${event.time}`).toISOString() : null,
//     location_name: event.location,
//     location_address: event.address,
//     location_lat: event.coordinates?.lat,
//     location_lng: event.coordinates?.lng,
//     image_url: event.image,
//     organizer_name: event.organizer.name,
//     organizer_avatar: event.organizer.avatar,
//     attendee_count: event.attendees,
//     ticket_links: event.ticketLinks || [],
//     source_provider: "api_import",
//     popularity_score: Math.random() * 100, // Simple popularity calculation
//     is_active: true,
//   }
// }

/**
 * Generate fallback events (keeping existing implementation)
 */
// function generateFallbackEvents(location: string, count: number): EventDetailProps[] {
//   logger.info("Generating fallback events", {
//     component: "event-actions",
//     action: "generate_fallback",
//     metadata: { location, count },
//   })

//   const categories = ["Music", "Arts", "Sports", "Food", "Business"]
//   const venues = ["Arena", "Theater", "Stadium", "Hall", "Center", "Park", "Gallery", "Club"]

//   return Array.from({ length: count }, (_, index) => {
//     const category = categories[index % categories.length]!
//     const venue = venues[index % venues.length]!
//     const futureDate = new Date()
//     futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1)

//     return {
//       id: 9000 + index,
//       title: `${category} Event in ${location}`,
//       description: `Join us for an amazing ${category.toLowerCase()} event in ${location}.`,
//       category,
//       date: futureDate.toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//       }),
//       time: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
//       location: `${venue} ${index + 1}`,
//       address: `${location} Area`,
//       price: Math.random() > 0.3 ? `$${Math.floor(Math.random() * 100) + 10}` : "Free",
//       image: `/event-${(index % 12) + 1}.png`,
//       organizer: {
//         name: `${location} Events`,
//         avatar: `/avatar-${(index % 6) + 1}.png`,
//       },
//       attendees: Math.floor(Math.random() * 500) + 50,
//       isFavorite: false,
//       coordinates: {
//         lat: 40.7128 + (Math.random() - 0.5) * 0.1,
//         lng: -74.006 + (Math.random() - 0.5) * 0.1,
//       },
//     }
//   })
// }

/**
 * Get featured events with caching
 */
export async function getFeaturedEvents(limit = 6): Promise<EventDetailProps[]> {
  try {
    logger.info("Server action: getFeaturedEvents called", { limit })

    const events = await getFeaturedEventsAPI(limit)

    logger.info("Server action: getFeaturedEvents completed", {
      eventCount: events.length,
    })

    return events
  } catch (error) {
    logger.error("Server action: getFeaturedEvents failed", { error, limit })
    return []
  }
}

// Test function to check if APIs are working
export async function testEventAPIs(): Promise<{
  ticketmaster: boolean
  rapidapi: boolean
  eventbrite: boolean
  predicthq: boolean
  errors: string[]
}> {
  try {
    logger.info("Testing event APIs")

    const errors: string[] = []
    const results = {
      ticketmaster: false,
      rapidapi: false,
      eventbrite: false,
      predicthq: false,
    }

    // Test with a simple search
    const testResult = await searchEventsAPI({
      keyword: "music",
      location: "New York, NY",
      size: 1,
    })

    // Check which sources returned data
    if (testResult.sources.includes("Ticketmaster")) {
      results.ticketmaster = true
    }
    if (testResult.sources.includes("RapidAPI")) {
      results.rapidapi = true
    }
    if (testResult.sources.includes("Eventbrite")) {
      results.eventbrite = true
    }
    if (testResult.sources.includes("PredictHQ")) {
      results.predicthq = true
    }

    if (testResult.error) {
      errors.push(testResult.error)
    }

    logger.info("API test completed", { results, errors })

    return { ...results, errors }
  } catch (error) {
    logger.error("API test failed", { error })
    return {
      ticketmaster: false,
      rapidapi: false,
      eventbrite: false,
      predicthq: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}
/**
 * Get events by category with caching
 */
// export async function getEventsByCategory(category: string, limit = 30): Promise<EventDetailProps[]> {
//   try {
//     const cacheKey = `category_events:${category}:${limit}`

//     // Try cache first, but don't fail if cache is unavailable
//     let cachedEvents: EventDetailProps[] | null = null
//     try {
//       cachedEvents = await cacheService.get<EventDetailProps[]>(cacheKey, {
//         ttl: 1800, // 30 minutes
//         namespace: "events",
//       })
//     } catch (cacheError) {
//       logger.warn("Cache unavailable for category events", {
//         component: "event-actions",
//         action: "category_cache_warning",
//       })
//     }

//     if (cachedEvents) {
//       return cachedEvents
//     }

//     // Generate fresh data
//     let freshEvents: EventDetailProps[]
//     try {
//       // Try database first
//       const dbResult = await eventRepository.getEventsByCategory(category, limit)
//       if (dbResult.data.length > 0) {
//         freshEvents = dbResult.data.map(transformDatabaseEventToEventDetail)
//       } else {
//         // Fallback to API
//         const apiResult = await searchEnhancedEvents({
//           keyword: category,
//           location: "New York",
//           size: limit,
//           categories: [category.toLowerCase()],
//         })
//         freshEvents = apiResult.events
//       }
//     } catch (error) {
//       // Final fallback
//       freshEvents = generateFallbackEvents("New York", limit)
//     }

//     // Try to cache the result
//     try {
//       await cacheService.set(cacheKey, freshEvents, {
//         ttl: 1800,
//         namespace: "events",
//       })
//     } catch (cacheError) {
//       logger.warn("Failed to cache category events", {
//         component: "event-actions",
//         action: "category_cache_set_warning",
//       })
//     }

//     return freshEvents
//   } catch (error) {
//     logger.error(
//       "Error getting events by category",
//       {
//         component: "event-actions",
//         action: "get_events_by_category_error",
//         metadata: { category },
//       },
//       error instanceof Error ? error : new Error(String(error)),
//     )

//     return generateFallbackEvents("New York", limit)
//   }
// }
