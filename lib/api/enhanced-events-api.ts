import type { EventDetailProps } from "@/components/event-detail-modal"
import { RAPIDAPI_KEY, RAPIDAPI_HOST, TICKETMASTER_API_KEY } from "@/lib/env"
import { withRetry, formatErrorMessage } from "@/lib/utils"
import { logger, measurePerformance } from "@/lib/utils/logger"
import { checkRateLimit } from "@/lib/utils/api-config"

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
    favoriteCategories?: string[]
    pricePreference?: "free" | "paid" | "any"
    timePreference?: "morning" | "afternoon" | "evening" | "any"
  }
}

// Fallback events data
const FALLBACK_EVENTS: EventDetailProps[] = [
  {
    id: 1,
    title: "Summer Music Festival",
    description: "Join us for an amazing summer music festival featuring top artists.",
    category: "Music",
    date: "July 15, 2024",
    time: "6:00 PM - 11:00 PM",
    location: "Central Park",
    address: "Central Park, New York, NY",
    price: "$45 - $120",
    image: "/event-1.png",
    organizer: { name: "Music Events NYC", avatar: "/avatar-1.png" },
    attendees: 1250,
    isFavorite: false,
    coordinates: { lat: 40.7829, lng: -73.9654 },
  },
  {
    id: 2,
    title: "Art Gallery Opening",
    description: "Discover contemporary art from emerging local artists.",
    category: "Arts",
    date: "July 20, 2024",
    time: "7:00 PM - 10:00 PM",
    location: "Modern Art Gallery",
    address: "123 Art Street, New York, NY",
    price: "Free",
    image: "/event-2.png",
    organizer: { name: "NYC Art Collective", avatar: "/avatar-2.png" },
    attendees: 85,
    isFavorite: false,
    coordinates: { lat: 40.7505, lng: -73.9934 },
  },
  // Add more fallback events...
]

export async function searchEnhancedEvents(params: EnhancedEventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: string
}> {
  return measurePerformance("searchEnhancedEvents", async () => {
    try {
      logger.info("Enhanced events search started", {
        component: "enhanced-events-api",
        action: "search_enhanced_events",
        metadata: { params },
      })

      const sources: string[] = []
      let allEvents: EventDetailProps[] = []

      // Try RapidAPI first
      if (RAPIDAPI_KEY) {
        try {
          const rapidEvents = await searchRapidAPIEvents(params)
          if (rapidEvents.length > 0) {
            allEvents.push(...rapidEvents)
            sources.push("RapidAPI")
          }
        } catch (error) {
          logger.warn("RapidAPI search failed", {
            component: "enhanced-events-api",
            action: "rapidapi_fallback",
            metadata: { error: formatErrorMessage(error) },
          })
        }
      }

      // Try Ticketmaster as fallback
      if (TICKETMASTER_API_KEY && allEvents.length < 10) {
        try {
          const ticketmasterEvents = await searchTicketmasterEvents(params)
          if (ticketmasterEvents.length > 0) {
            allEvents.push(...ticketmasterEvents)
            sources.push("Ticketmaster")
          }
        } catch (error) {
          logger.warn("Ticketmaster search failed", {
            component: "enhanced-events-api",
            action: "ticketmaster_fallback",
            metadata: { error: formatErrorMessage(error) },
          })
        }
      }

      // Use fallback data if no events found
      if (allEvents.length === 0) {
        logger.info("Using fallback events data", {
          component: "enhanced-events-api",
          action: "fallback_data_used",
        })
        allEvents = FALLBACK_EVENTS
        sources.push("Fallback")
      }

      // Remove duplicates and apply user preferences
      const uniqueEvents = deduplicateEvents(allEvents)
      const filteredEvents = applyUserPreferences(uniqueEvents, params.userPreferences)
      const paginatedEvents = paginateEvents(filteredEvents, params.page || 0, params.size || 20)

      logger.info("Enhanced events search completed", {
        component: "enhanced-events-api",
        action: "search_enhanced_events_success",
        metadata: {
          totalEvents: filteredEvents.length,
          returnedEvents: paginatedEvents.length,
          sources,
        },
      })

      return {
        events: paginatedEvents,
        totalCount: filteredEvents.length,
        page: params.page || 0,
        totalPages: Math.ceil(filteredEvents.length / (params.size || 20)),
        sources,
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      logger.error(
        "Enhanced events search failed",
        {
          component: "enhanced-events-api",
          action: "search_enhanced_events_error",
          metadata: { params },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      // Return fallback data even on error
      return {
        events: FALLBACK_EVENTS.slice(0, params.size || 20),
        totalCount: FALLBACK_EVENTS.length,
        page: 0,
        totalPages: 1,
        sources: ["Fallback"],
        error: errorMessage,
      }
    }
  })
}

async function searchRapidAPIEvents(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
  const rateLimitCheck = checkRateLimit("rapidapi")
  if (!rateLimitCheck.allowed) {
    throw new Error("RapidAPI rate limit exceeded")
  }

  const query = params.keyword || "events"
  const location = params.location || "New York"

  const response = await withRetry(
    () =>
      fetch(
        `https://real-time-events-search.p.rapidapi.com/search-events?query=${encodeURIComponent(
          query,
        )}&location=${encodeURIComponent(location)}&date=any&is_virtual=false&start=0`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY || "",
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        },
      ),
    { maxAttempts: 2, baseDelay: 1000 },
  )

  if (!response.ok) {
    throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.status !== "OK" || !data.data?.events) {
    throw new Error("Invalid RapidAPI response format")
  }

  return transformRapidAPIEvents(data.data.events)
}

async function searchTicketmasterEvents(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
  // Implement Ticketmaster API search
  // This is a placeholder - implement based on Ticketmaster API docs
  return []
}

function transformRapidAPIEvents(events: any[]): EventDetailProps[] {
  return events.slice(0, 20).map((event, index) => {
    const venue = event.venue || {}
    const startDate = event.start_time ? new Date(event.start_time) : new Date()

    return {
      id: Math.abs(
        event.event_id?.split("").reduce((a: number, b: string) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0) || Math.floor(Math.random() * 10000) + index,
      ),
      title: event.name || "Event",
      description: event.description || "No description available.",
      category: extractCategory(event.tags || []),
      date: startDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      location: venue.name || "Venue TBA",
      address: venue.full_address || "Address TBA",
      price: event.ticket_links?.length > 0 ? "Tickets Available" : "Price TBA",
      image: event.thumbnail || `/event-${(index % 12) + 1}.png`,
      organizer: {
        name: venue.name || event.publisher || "Event Organizer",
        avatar: `/avatar-${(index % 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 1000) + 50,
      isFavorite: false,
      coordinates:
        venue.latitude && venue.longitude ? { lat: Number(venue.latitude), lng: Number(venue.longitude) } : undefined,
    }
  })
}

function extractCategory(tags: string[]): string {
  if (!tags || tags.length === 0) return "Event"

  const categoryMap: { [key: string]: string } = {
    music: "Music",
    concert: "Music",
    festival: "Music",
    art: "Arts",
    theater: "Arts",
    exhibition: "Arts",
    sport: "Sports",
    game: "Sports",
    food: "Food",
    restaurant: "Food",
    business: "Business",
    conference: "Business",
    networking: "Business",
  }

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerTag.includes(key)) return value
    }
  }

  return tags[0].charAt(0).toUpperCase() + tags[0].slice(1)
}

function deduplicateEvents(events: EventDetailProps[]): EventDetailProps[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = `${event.title.toLowerCase()}-${event.date}-${event.location.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function applyUserPreferences(
  events: EventDetailProps[],
  preferences?: EnhancedEventSearchParams["userPreferences"],
): EventDetailProps[] {
  if (!preferences) return events

  return events.filter((event) => {
    // Filter by favorite categories
    if (preferences.favoriteCategories?.length) {
      const eventCategory = event.category.toLowerCase()
      const hasMatchingCategory = preferences.favoriteCategories.some((cat) =>
        eventCategory.includes(cat.toLowerCase()),
      )
      if (!hasMatchingCategory) return false
    }

    // Filter by price preference
    if (preferences.pricePreference === "free" && !event.price.toLowerCase().includes("free")) {
      return false
    }

    return true
  })
}

function paginateEvents(events: EventDetailProps[], page: number, size: number): EventDetailProps[] {
  const start = page * size
  return events.slice(start, start + size)
}
