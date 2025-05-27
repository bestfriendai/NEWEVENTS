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

// Mock event data for testing
const mockEvents: EventDetailProps[] = [
  {
    id: 1,
    title: "Summer Music Festival",
    description: "Join us for an amazing outdoor music festival featuring top artists from around the world.",
    category: "Music",
    date: "July 15, 2024",
    time: "6:00 PM",
    location: "Central Park",
    address: "Central Park, New York, NY",
    price: "$75 - $150",
    image: "/event-1.png",
    organizer: {
      name: "Music Events Co",
      avatar: "/avatar-1.png",
    },
    attendees: 2500,
    isFavorite: false,
    coordinates: { lat: 40.7829, lng: -73.9654 },
    ticketLinks: [{ source: "Ticketmaster", link: "https://ticketmaster.com" }],
  },
  {
    id: 2,
    title: "Tech Conference 2024",
    description: "The biggest tech conference of the year with industry leaders and innovative startups.",
    category: "Technology",
    date: "August 22, 2024",
    time: "9:00 AM",
    location: "Convention Center",
    address: "123 Convention Ave, San Francisco, CA",
    price: "$200 - $500",
    image: "/event-2.png",
    organizer: {
      name: "Tech Events Inc",
      avatar: "/avatar-2.png",
    },
    attendees: 5000,
    isFavorite: false,
    coordinates: { lat: 37.7749, lng: -122.4194 },
    ticketLinks: [{ source: "Eventbrite", link: "https://eventbrite.com" }],
  },
  {
    id: 3,
    title: "Food & Wine Festival",
    description: "Taste the best cuisine from local restaurants and wineries in this amazing food festival.",
    category: "Food",
    date: "September 10, 2024",
    time: "12:00 PM",
    location: "Waterfront Park",
    address: "456 Harbor St, Seattle, WA",
    price: "$50 - $100",
    image: "/event-3.png",
    organizer: {
      name: "Culinary Events",
      avatar: "/avatar-3.png",
    },
    attendees: 1200,
    isFavorite: false,
    coordinates: { lat: 47.6062, lng: -122.3321 },
    ticketLinks: [{ source: "Local Tickets", link: "https://localtickets.com" }],
  },
]

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

      // Generate cache key
      const cacheKey = `enhanced_events:${JSON.stringify(params)}`

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

      // For now, use mock data - in production this would call real APIs
      let filteredEvents = [...mockEvents]

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

      // Apply location filtering
      if (params.location) {
        const location = params.location.toLowerCase()
        filteredEvents = filteredEvents.filter(
          (event) => event.location.toLowerCase().includes(location) || event.address.toLowerCase().includes(location),
        )
      }

      // Apply category filtering
      if (params.categories && params.categories.length > 0) {
        filteredEvents = filteredEvents.filter((event) =>
          params.categories!.some((cat) => event.category.toLowerCase().includes(cat.toLowerCase())),
        )
      }

      // Apply user preferences filtering
      if (params.userPreferences) {
        filteredEvents = applyUserPreferences(filteredEvents, params.userPreferences)
      }

      // Sort events
      const sortedEvents = sortEvents(filteredEvents, params.sort || "relevance")

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
        sources: ["Mock Data"], // In production: ["Ticketmaster", "RapidAPI", etc.]
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
function sortEvents(events: EventDetailProps[], sortBy: string): EventDetailProps[] {
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

    case "relevance":
    default:
      // Keep original order for relevance
      return sortedEvents
  }
}

// Extract numeric price value for sorting
function extractPriceValue(priceString: string): number {
  if (priceString.toLowerCase().includes("free")) return 0
  if (priceString.toLowerCase().includes("tba")) return 999999

  const match = priceString.match(/\$(\d+(?:\.\d{2})?)/)
  return match ? Number.parseFloat(match[1]) : 999999
}

// Get featured events
export async function getFeaturedEvents(): Promise<EventDetailProps[]> {
  return measurePerformance("getFeaturedEvents", async () => {
    try {
      logger.info("Fetching featured events")

      // Check cache first
      const cached = memoryCache.get<EventDetailProps[]>("featured_events")
      if (cached) {
        logger.info("Featured events cache hit")
        return cached
      }

      // For now, return first 3 mock events as featured
      const featuredEvents = mockEvents.slice(0, 3)

      // Cache for 30 minutes
      memoryCache.set("featured_events", featuredEvents, 30 * 60 * 1000)

      logger.info("Featured events fetched successfully", {
        count: featuredEvents.length,
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

      // Filter mock events by category
      const categoryEvents = mockEvents.filter((event) => event.category.toLowerCase().includes(category.toLowerCase()))

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
