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



/**
 * Get events by category with caching
 */
export async function getEventsByCategory(category: string, limit = 30): Promise<EventDetailProps[]> {
  try {
    logger.info("Server action: getEventsByCategory called", { category, limit })

    const searchResult = await searchEventsAPI({
      keyword: category,
      categories: [category],
      size: limit,
    })

    const categoryEvents = searchResult.events

    logger.info("Server action: getEventsByCategory completed", {
      category,
      eventCount: categoryEvents.length,
    })

    return categoryEvents
  } catch (error) {
    logger.error("Server action: getEventsByCategory failed", {
      category,
      error,
    })
    return []
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

//     const result = await searchEnhancedEvents({
//       keyword: category,
//       location: "New York",
//       size: limit,
//       categories: [category.toLowerCase()],
//     })
//     freshEvents = apiResult.events
//   } catch (error) {
//     // Final fallback
//     freshEvents = generateFallbackEvents("New York", limit)
//   }

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

// Export testRapidApiConnection
// export { testRapidApiConnection, getEventsByCategory }

// Export types
export type { EventSearchParams }
