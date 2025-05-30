import type { EventDetailProps } from "@/components/event-detail-modal"
import { logger, measurePerformance, formatErrorMessage } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"

export interface EnhancedEventSearchParams {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number
  startDateTime?: string
  endDateTime?: string
  categories?: string[]
  page?: number
  size?: number
  sort?: string
  userPreferences?: {
    favoriteCategories: string[]
    pricePreference: "free" | "low" | "medium" | "high" | "any"
    timePreference: "morning" | "afternoon" | "evening" | "night" | "any"
  }
}

export interface EnhancedEventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: string
  responseTime?: number
}

import { eventsService } from "@/lib/services/events-service"
import { calculateDistance } from "@/lib/utils/event-utils"

// This API now uses real data from Supabase

// Enhanced search that combines multiple sources
export async function searchEnhancedEvents(params: EnhancedEventSearchParams): Promise<EnhancedEventSearchResult> {
  return measurePerformance("searchEnhancedEvents", async () => {
    const startTime = Date.now()

    try {
      logger.info("Enhanced events search started", {
        component: "enhanced-events-api",
        action: "search_start",
        metadata: { params },
      })

      // Generate cache key with location awareness
      const locationKey = params.coordinates
        ? `${params.coordinates.lat.toFixed(2)},${params.coordinates.lng.toFixed(2)}`
        : params.location || "default"
      const cacheKey = `enhanced_events:${locationKey}:${JSON.stringify(params)}`

      // Check cache first
      const cached = memoryCache.get<EnhancedEventSearchResult>(cacheKey)
      if (cached) {
        logger.info("Enhanced events search cache hit", {
          component: "enhanced-events-api",
          action: "cache_hit",
          metadata: { eventCount: cached.events.length },
        })
        return cached
      }

      // Use real events service to search for events with improved location parameters
      const searchParams = {
        lat: params.coordinates?.lat,
        lng: params.coordinates?.lng,
        radius: params.radius || 50, // Increased from 25 to 50 miles
        category: params.categories?.[0], // Use first category if provided
        limit: (params.page || 0) * (params.size || 20) + (params.size || 20), // Get enough for pagination
        offset: 0,
        sort: params.coordinates ? "distance" : "popularity", // Sort by distance when coordinates are provided
      }

      const eventsResult = await eventsService.searchEvents(searchParams)

      if (eventsResult.error) {
        throw new Error(eventsResult.error)
      }

      let filteredEvents = eventsResult.events

      // Apply keyword filtering
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        filteredEvents = filteredEvents.filter(
          (event) =>
            event.title.toLowerCase().includes(keyword) ||
            event.description.toLowerCase().includes(keyword) ||
            event.category.toLowerCase().includes(keyword),
        )
      }

      // Apply location filtering with improved distance calculation
      if (params.location) {
        const location = params.location.toLowerCase()
        filteredEvents = filteredEvents.filter(
          (event) => event.location.toLowerCase().includes(location) || event.address.toLowerCase().includes(location),
        )
      } else if (params.coordinates && params.radius) {
        // Filter by distance when coordinates are provided
        filteredEvents = filteredEvents.filter((event) => {
          if (!event.coordinates) return false
          const distance = calculateDistance(
            params.coordinates!.lat,
            params.coordinates!.lng,
            event.coordinates.lat,
            event.coordinates.lng,
          )
          return distance <= (params.radius || 50)
        })
      }

      // Apply user preferences filtering
      if (params.userPreferences) {
        filteredEvents = applyUserPreferences(filteredEvents, params.userPreferences)
      }

      // Sort events with improved sorting
      const sortedEvents = sortEvents(
        filteredEvents,
        params.sort || (params.coordinates ? "distance" : "relevance"),
        params.coordinates,
      )

      // Apply pagination
      const page = params.page || 0
      const size = params.size || 20
      const startIndex = page * size
      const paginatedEvents = sortedEvents.slice(startIndex, startIndex + size)

      const responseTime = Date.now() - startTime

      const result: EnhancedEventSearchResult = {
        events: paginatedEvents,
        totalCount: sortedEvents.length,
        page,
        totalPages: Math.ceil(sortedEvents.length / size),
        sources: ["Supabase Database"],
        responseTime,
      }

      // Cache successful results for 10 minutes
      if (result.events.length > 0) {
        memoryCache.set(cacheKey, result, 10 * 60 * 1000)
      }

      logger.info("Enhanced events search completed", {
        component: "enhanced-events-api",
        action: "search_complete",
        metadata: {
          totalEvents: result.events.length,
          sources: result.sources,
          responseTime,
        },
      })

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = formatErrorMessage(error)

      logger.error(
        "Enhanced events search failed",
        {
          component: "enhanced-events-api",
          action: "search_error",
          metadata: { params, responseTime },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        sources: [],
        error: errorMessage,
        responseTime,
      }
    }
  })
}

// Apply user preferences to filter events
function applyUserPreferences(
  events: EventDetailProps[],
  preferences: EnhancedEventSearchParams["userPreferences"],
): EventDetailProps[] {
  if (!preferences) return events

  return events.filter((event) => {
    // Filter by favorite categories
    if (preferences.favoriteCategories.length > 0) {
      const eventCategory = event.category.toLowerCase()
      const hasMatchingCategory = preferences.favoriteCategories.some((cat) =>
        eventCategory.includes(cat.toLowerCase()),
      )
      if (!hasMatchingCategory) return false
    }

    // Filter by price preference
    if (preferences.pricePreference !== "any") {
      const price = event.price.toLowerCase()
      switch (preferences.pricePreference) {
        case "free":
          if (!price.includes("free")) return false
          break
        case "low":
          if (price.includes("free")) break
          // Check for prices under $50
          const lowPriceMatch = price.match(/\$(\d+)/)
          if (!lowPriceMatch || Number.parseInt(lowPriceMatch[1]) > 50) return false
          break
        // Add more price filtering logic as needed
      }
    }

    return true
  })
}

// Sort events based on different criteria
function sortEvents(
  events: EventDetailProps[],
  sortBy: string,
  coordinates?: { lat: number; lng: number },
): EventDetailProps[] {
  const sortedEvents = [...events]

  switch (sortBy) {
    case "date":
      return sortedEvents.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })

    case "popularity":
      return sortedEvents.sort((a, b) => b.attendees - a.attendees)

    case "price":
      return sortedEvents.sort((a, b) => {
        const priceA = extractPriceValue(a.price)
        const priceB = extractPriceValue(b.price)
        return priceA - priceB
      })

    case "distance":
      if (coordinates) {
        return sortedEvents.sort((a, b) => {
          if (!a.coordinates || !b.coordinates) return 0
          const distanceA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates.lat, a.coordinates.lng)
          const distanceB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates.lat, b.coordinates.lng)
          return distanceA - distanceB
        })
      }
      break

    case "relevance":
    default:
      // Keep original order for relevance
      return sortedEvents
  }
  return sortedEvents
}

// Extract numeric price value for sorting
function extractPriceValue(priceString: string): number {
  if (priceString.toLowerCase().includes("free")) return 0
  if (priceString.toLowerCase().includes("tba")) return 999999

  const match = priceString.match(/\$(\d+(?:\.\d{2})?)/)
  return match ? Number.parseFloat(match[1]) : 999999
}

// Get featured events with location awareness
export async function getFeaturedEvents(
  limit = 3,
  coordinates?: { lat: number; lng: number },
): Promise<EventDetailProps[]> {
  return measurePerformance("getFeaturedEvents", async () => {
    try {
      logger.info("Fetching featured events", { limit, coordinates })

      // Create location-aware cache key
      const locationKey = coordinates ? `${coordinates.lat.toFixed(2)},${coordinates.lng.toFixed(2)}` : "default"
      const cacheKey = `enhanced_featured_events:${locationKey}:${limit}`

      const cached = memoryCache.get<EventDetailProps[]>(cacheKey)
      if (cached) {
        logger.info("Featured events cache hit")
        return cached
      }

      // Get upcoming events as featured events with location awareness
      const searchParams = coordinates
        ? {
            lat: coordinates.lat,
            lng: coordinates.lng,
            radius: 50, // 50 mile radius for featured events
            limit: limit * 2, // Get more than needed to filter for best
            sort: "distance", // Sort by distance when coordinates are provided
          }
        : {
            limit: limit * 2,
            sort: "popularity",
          }

      const upcomingResult = await eventsService.getUpcomingEvents(searchParams)

      // Sort by a combination of proximity (if coordinates provided) and popularity
      let featuredEvents = upcomingResult.events

      if (coordinates) {
        // Sort by a weighted score of distance and popularity
        featuredEvents = featuredEvents.sort((a, b) => {
          if (!a.coordinates || !b.coordinates) return b.attendees - a.attendees

          const distanceA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates.lat, a.coordinates.lng)
          const distanceB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates.lat, b.coordinates.lng)

          // Weight: 60% distance, 40% popularity
          const scoreA = distanceA * 0.6 - a.attendees * 0.4
          const scoreB = distanceB * 0.6 - b.attendees * 0.4

          return scoreA - scoreB
        })
      } else {
        // Sort by popularity only
        featuredEvents = featuredEvents.sort((a, b) => b.attendees - a.attendees)
      }

      // Take the top events
      featuredEvents = featuredEvents.slice(0, limit)

      // Cache for 30 minutes
      memoryCache.set(cacheKey, featuredEvents, 30 * 60 * 1000)

      logger.info("Featured events fetched successfully", {
        count: featuredEvents.length,
        withLocation: !!coordinates,
      })

      return featuredEvents
    } catch (error) {
      logger.error("Failed to fetch featured events", {
        error: formatErrorMessage(error),
      })
      return []
    }
  })
}

// Get events by category
export async function getEventsByCategory(category: string): Promise<EventDetailProps[]> {
  return measurePerformance("getEventsByCategory", async () => {
    try {
      logger.info("Fetching events by category", { category })

      const cacheKey = `events_by_category:${category}`
      const cached = memoryCache.get<EventDetailProps[]>(cacheKey)
      if (cached) {
        logger.info("Events by category cache hit", { category })
        return cached
      }

      // Get events by category from the service
      const categoryResult = await eventsService.getEventsByCategory(category, 20)
      const categoryEvents = categoryResult.events

      // Cache for 15 minutes
      memoryCache.set(cacheKey, categoryEvents, 15 * 60 * 1000)

      logger.info("Events by category fetched successfully", {
        category,
        count: categoryEvents.length,
      })

      return categoryEvents
    } catch (error) {
      logger.error("Failed to fetch events by category", {
        category,
        error: formatErrorMessage(error),
      })
      return []
    }
  })
}

// Export types
export type { EnhancedEventSearchParams, EnhancedEventSearchResult }
