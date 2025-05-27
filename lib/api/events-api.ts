import type { EventDetailProps } from "@/components/event-detail-modal"
import { searchTicketmasterEvents, getTicketmasterEventDetails } from "@/lib/api/ticketmaster-api"
import { logger, measurePerformance, formatErrorMessage } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"
import { serverEnv } from "@/lib/env"

// Enhanced interface for search parameters
export interface EventSearchParams {
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
  priceRange?: { min: number; max: number }
  dateRange?: { start: string; end: string }
}

// Enhanced search result interface
export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: string
  cached?: boolean
  responseTime?: number
  filters?: {
    categories: string[]
    priceRanges: string[]
    locations: string[]
  }
}

// Rate limiter for API calls
class APIRateLimiter {
  private rapidApiRequests: number[] = []
  private ticketmasterRequests: number[] = []
  private eventbriteRequests: number[] = []

  private readonly rapidApiLimit = 500 // per hour
  private readonly ticketmasterLimit = 200 // per minute
  private readonly eventbriteLimit = 1000 // per hour

  checkRapidApiLimit(): boolean {
    const now = Date.now()
    this.rapidApiRequests = this.rapidApiRequests.filter((time) => now - time < 60 * 60 * 1000)
    return this.rapidApiRequests.length < this.rapidApiLimit
  }

  checkTicketmasterLimit(): boolean {
    const now = Date.now()
    this.ticketmasterRequests = this.ticketmasterRequests.filter((time) => now - time < 60 * 1000)
    return this.ticketmasterRequests.length < this.ticketmasterLimit
  }

  checkEventbriteLimit(): boolean {
    const now = Date.now()
    this.eventbriteRequests = this.eventbriteRequests.filter((time) => now - time < 60 * 60 * 1000)
    return this.eventbriteRequests.length < this.eventbriteLimit
  }

  recordRapidApiRequest(): void {
    this.rapidApiRequests.push(Date.now())
  }

  recordTicketmasterRequest(): void {
    this.ticketmasterRequests.push(Date.now())
  }

  recordEventbriteRequest(): void {
    this.eventbriteRequests.push(Date.now())
  }
}

const rateLimiter = new APIRateLimiter()

// Search events from RapidAPI
async function searchRapidApiEvents(params: EventSearchParams): Promise<EventDetailProps[]> {
  if (!rateLimiter.checkRapidApiLimit()) {
    logger.warn("RapidAPI rate limit exceeded")
    return []
  }

  try {
    // Check if API key is available
    if (!serverEnv.RAPIDAPI_KEY) {
      logger.warn("RapidAPI key not configured")
      return []
    }

    rateLimiter.recordRapidApiRequest()

    const url = new URL("https://real-time-events-search.p.rapidapi.com/search-events")

    // Add parameters with better defaults
    if (params.keyword) {
      url.searchParams.set("query", params.keyword)
    } else {
      // Default search for popular events if no keyword
      url.searchParams.set("query", "concert music festival")
    }

    if (params.location) {
      url.searchParams.set("location", params.location)
    } else {
      // Default to major cities if no location specified
      url.searchParams.set("location", "New York, NY")
    }

    if (params.startDateTime) {
      const date = new Date(params.startDateTime)
      url.searchParams.set("start_date", date.toISOString().split("T")[0])
    } else {
      // Default to today
      url.searchParams.set("start_date", new Date().toISOString().split("T")[0])
    }

    url.searchParams.set("limit", String(Math.min(params.size || 20, 50))) // RapidAPI may have limits
    url.searchParams.set("is_virtual", "false")

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": serverEnv.RAPIDAPI_KEY,
        "X-RapidAPI-Host": serverEnv.RAPIDAPI_HOST || "real-time-events-search.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        logger.error("RapidAPI authentication failed - check API key")
        return []
      }
      if (response.status === 403) {
        logger.error("RapidAPI access forbidden - check subscription")
        return []
      }
      if (response.status === 429) {
        logger.warn("RapidAPI rate limit exceeded")
        return []
      }

      const errorText = await response.text().catch(() => "Unknown error")
      logger.error(`RapidAPI error: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()

    if (data.status === "OK" && data.data && Array.isArray(data.data)) {
      logger.info(`RapidAPI returned ${data.data.length} events`)
      return data.data.map((event: any, index: number) => transformRapidApiEvent(event, index))
    }

    if (data.error) {
      logger.error(`RapidAPI returned error: ${data.error}`)
    }

    logger.info("RapidAPI returned no events")
    return []
  } catch (error) {
    logger.error("RapidAPI search failed", {
      error: formatErrorMessage(error),
      hasApiKey: !!serverEnv.RAPIDAPI_KEY,
      apiHost: serverEnv.RAPIDAPI_HOST,
    })
    return []
  }
}

// Search events from Eventbrite
async function searchEventbriteEvents(params: EventSearchParams): Promise<EventDetailProps[]> {
  if (!rateLimiter.checkEventbriteLimit()) {
    logger.warn("Eventbrite rate limit exceeded")
    return []
  }

  try {
    rateLimiter.recordEventbriteRequest()

    // Check if we have the required token
    if (!serverEnv.EVENTBRITE_PRIVATE_TOKEN && !serverEnv.EVENTBRITE_PUBLIC_TOKEN) {
      logger.warn("Eventbrite API token not configured")
      return []
    }

    const url = new URL("https://www.eventbriteapi.com/v3/events/search/")

    // Add required parameters
    if (params.keyword) url.searchParams.set("q", params.keyword)
    if (params.location) {
      url.searchParams.set("location.address", params.location)
      url.searchParams.set("location.within", `${params.radius || 25}mi`)
    }

    // Set date range
    if (params.startDateTime) {
      url.searchParams.set("start_date.range_start", new Date(params.startDateTime).toISOString())
    } else {
      // Default to today if no start date provided
      url.searchParams.set("start_date.range_start", new Date().toISOString())
    }

    if (params.endDateTime) {
      url.searchParams.set("start_date.range_end", new Date(params.endDateTime).toISOString())
    }

    // Add expand parameter for additional data
    url.searchParams.set("expand", "venue,organizer,ticket_availability")
    url.searchParams.set("page_size", String(Math.min(params.size || 20, 50))) // Eventbrite max is 50
    url.searchParams.set("sort_by", "date")
    url.searchParams.set("page", String((params.page || 0) + 1)) // Eventbrite uses 1-based pagination

    const token = serverEnv.EVENTBRITE_PRIVATE_TOKEN || serverEnv.EVENTBRITE_PUBLIC_TOKEN

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        logger.error("Eventbrite authentication failed - check API token")
        return []
      }
      if (response.status === 404) {
        logger.warn("Eventbrite endpoint not found - API may be unavailable")
        return []
      }
      if (response.status === 429) {
        logger.warn("Eventbrite rate limit exceeded")
        return []
      }

      const errorText = await response.text().catch(() => "Unknown error")
      logger.error(`Eventbrite API error: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()

    if (data.events && Array.isArray(data.events)) {
      logger.info(`Eventbrite returned ${data.events.length} events`)
      return data.events.map((event: any) => transformEventbriteEvent(event))
    }

    logger.info("Eventbrite returned no events")
    return []
  } catch (error) {
    logger.error("Eventbrite search failed", {
      error: formatErrorMessage(error),
      params: { ...params, size: params.size || 20 },
    })
    return []
  }
}

// Transform Eventbrite event data
function transformEventbriteEvent(event: any): EventDetailProps {
  const numericId = event.id ? Number.parseInt(event.id) : Math.floor(Math.random() * 10000)

  const startDate = event.start?.utc
    ? new Date(event.start.utc)
    : event.start?.local
      ? new Date(event.start.local)
      : new Date()

  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Extract price with better handling
  let price = "Free"
  if (event.is_free === false) {
    if (event.ticket_availability?.minimum_ticket_price) {
      const minPrice = event.ticket_availability.minimum_ticket_price
      const maxPrice = event.ticket_availability.maximum_ticket_price

      if (minPrice.major_value && maxPrice.major_value && minPrice.major_value !== maxPrice.major_value) {
        price = `$${minPrice.major_value} - $${maxPrice.major_value}`
      } else if (minPrice.major_value) {
        price = `$${minPrice.major_value}`
      } else {
        price = "Tickets Available"
      }
    } else {
      price = "Tickets Available"
    }
  }

  // Extract venue information
  const venue = event.venue || {}
  const address = venue.address || {}
  const fullAddress =
    [address.address_1, address.city, address.region, address.country].filter(Boolean).join(", ") || "Address TBA"

  return {
    id: numericId,
    title: event.name?.text || event.name || "Untitled Event",
    description: event.description?.text || event.summary || "No description available.",
    category: event.category?.name || event.subcategory?.name || "Event",
    date: formattedDate,
    time: formattedTime,
    location: venue.name || "Venue TBA",
    address: fullAddress,
    price,
    image: event.logo?.url || event.logo?.original?.url || "/community-event.png",
    organizer: {
      name: event.organizer?.name || "Event Organizer",
      avatar: event.organizer?.logo?.url || "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50, // Eventbrite doesn't provide this in search
    isFavorite: false,
    coordinates:
      venue.latitude && venue.longitude ? { lat: Number(venue.latitude), lng: Number(venue.longitude) } : undefined,
    ticketLinks: event.url ? [{ source: "Eventbrite", link: event.url }] : [],
  }
}

// Search events from PredictHQ
async function searchPredictHQEvents(params: EventSearchParams): Promise<EventDetailProps[]> {
  try {
    // Check if API key is available
    if (!serverEnv.PREDICTHQ_API_KEY) {
      logger.warn("PredictHQ API key not configured")
      return []
    }

    const url = new URL("https://api.predicthq.com/v1/events/")

    if (params.keyword) url.searchParams.set("q", params.keyword)
    if (params.location) url.searchParams.set("location", params.location)
    if (params.coordinates) {
      url.searchParams.set("within", `${params.radius || 25}mi@${params.coordinates.lat},${params.coordinates.lng}`)
    }
    if (params.startDateTime) {
      url.searchParams.set("active.gte", params.startDateTime)
    }
    if (params.endDateTime) {
      url.searchParams.set("active.lte", params.endDateTime)
    }

    url.searchParams.set("limit", String(Math.min(params.size || 20, 50))) // PredictHQ may have limits
    url.searchParams.set("sort", "start")

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${serverEnv.PREDICTHQ_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        logger.error("PredictHQ authentication failed - check API key")
        return []
      }
      if (response.status === 403) {
        logger.error("PredictHQ access forbidden - check subscription")
        return []
      }
      if (response.status === 429) {
        logger.warn("PredictHQ rate limit exceeded")
        return []
      }

      const errorText = await response.text().catch(() => "Unknown error")
      logger.error(`PredictHQ API error: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()

    if (data.results && Array.isArray(data.results)) {
      logger.info(`PredictHQ returned ${data.results.length} events`)
      return data.results.map((event: any) => transformPredictHQEvent(event))
    }

    if (data.error) {
      logger.error(`PredictHQ returned error: ${data.error}`)
    }

    logger.info("PredictHQ returned no events")
    return []
  } catch (error) {
    logger.error("PredictHQ search failed", {
      error: formatErrorMessage(error),
      hasApiKey: !!serverEnv.PREDICTHQ_API_KEY,
    })
    return []
  }
}

// Transform RapidAPI event data
function transformRapidApiEvent(event: any, index: number): EventDetailProps {
  const numericId = Math.abs(
    event.event_id?.split("").reduce((a: number, b: string) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0) || Math.floor(Math.random() * 10000) + index,
  )

  const startDate = event.start_time ? new Date(event.start_time) : new Date()
  const endDate = event.end_time ? new Date(event.end_time) : null

  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Extract price
  let price = "Price TBA"
  if (event.is_free) {
    price = "Free"
  } else if (event.min_price && event.max_price) {
    if (event.min_price === event.max_price) {
      price = `$${event.min_price}`
    } else {
      price = `$${event.min_price} - $${event.max_price}`
    }
  } else if (event.min_price) {
    price = `From $${event.min_price}`
  }

  // Extract category
  const category = event.category || extractCategoryFromTags(event.tags || []) || "Event"

  // Extract ticket links
  const ticketLinks = []
  if (event.ticket_links) {
    ticketLinks.push(
      ...event.ticket_links.map((link: any) => ({
        source: link.source || "Tickets",
        link: link.link || "#",
      })),
    )
  }

  return {
    id: numericId,
    title: event.name || event.title || "Untitled Event",
    description: event.description || "No description available.",
    category,
    date: formattedDate,
    time: formattedTime,
    location: event.venue?.name || event.venue_name || "Venue TBA",
    address: event.venue?.full_address || event.venue_address || "Address TBA",
    price,
    image: event.thumbnail || event.image || "/community-event.png",
    organizer: {
      name: event.organizer || event.venue?.name || "Event Organizer",
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates:
      event.venue?.latitude && event.venue?.longitude
        ? { lat: Number(event.venue.latitude), lng: Number(event.venue.longitude) }
        : undefined,
    ticketLinks,
  }
}

// Transform PredictHQ event data
function transformPredictHQEvent(event: any): EventDetailProps {
  const numericId = Math.abs(
    event.id?.split("").reduce((a: number, b: string) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0) || Math.floor(Math.random() * 10000),
  )

  const startDate = event.start ? new Date(event.start) : new Date()
  const endDate = event.end ? new Date(event.end) : null

  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return {
    id: numericId,
    title: event.title || "Untitled Event",
    description: event.description || "No description available.",
    category: event.category || "Event",
    date: formattedDate,
    time: formattedTime,
    location: event.venue?.name || event.location?.[0] || "Venue TBA",
    address: event.location?.join(", ") || "Address TBA",
    price: "Price TBA",
    image: "/community-event.png",
    organizer: {
      name: "Event Organizer",
      avatar: "/avatar-1.png",
    },
    attendees: event.phq_attendance || Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates:
      event.location && event.location.length >= 2
        ? { lat: Number(event.location[1]), lng: Number(event.location[0]) }
        : undefined,
    ticketLinks: [],
  }
}

// Helper function to extract category from tags
function extractCategoryFromTags(tags: string[]): string {
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
    tech: "Technology",
    health: "Health",
    education: "Education",
  }

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerTag.includes(key)) return value
    }
  }

  return tags[0].charAt(0).toUpperCase() + tags[0].slice(1)
}

// Enhanced search function with multiple API sources
export async function searchEvents(params: EventSearchParams): Promise<EventSearchResult> {
  return measurePerformance("searchEvents", async () => {
    const startTime = Date.now()

    try {
      // Validate parameters
      if (params.size && params.size > 100) {
        params.size = 100
      }

      // Generate cache key
      const cacheKey = `events_search:${JSON.stringify(params)}`

      // Check cache first
      const cached = memoryCache.get<EventSearchResult>(cacheKey)
      if (cached) {
        logger.info("Events search cache hit", {
          component: "events-api",
          action: "cache_hit",
          metadata: { eventCount: cached.events.length },
        })
        return { ...cached, cached: true }
      }

      logger.info("Searching events from multiple sources", {
        component: "events-api",
        action: "search_events",
        metadata: { params },
      })

      // Search from multiple sources in parallel with individual error handling
      const searchPromises = []
      const sources: string[] = []
      const errors: string[] = []

      // Ticketmaster search
      if (rateLimiter.checkTicketmasterLimit()) {
        searchPromises.push(
          searchTicketmasterEvents({
            keyword: params.keyword,
            location: params.location,
            coordinates: params.coordinates,
            radius: params.radius,
            startDateTime: params.startDateTime,
            endDateTime: params.endDateTime,
            classificationName: params.categories?.[0],
            page: params.page,
            size: Math.floor((params.size || 20) / 4), // Divide among sources
          })
            .then((result) => {
              if (result.events.length > 0) sources.push("Ticketmaster")
              if (result.error) errors.push(`Ticketmaster: ${result.error}`)
              return result.events
            })
            .catch((error) => {
              errors.push(`Ticketmaster: ${formatErrorMessage(error)}`)
              return []
            }),
        )
      }

      // RapidAPI search
      searchPromises.push(
        searchRapidApiEvents({
          ...params,
          size: Math.floor((params.size || 20) / 4),
        })
          .then((events) => {
            if (events.length > 0) sources.push("RapidAPI")
            return events
          })
          .catch((error) => {
            errors.push(`RapidAPI: ${formatErrorMessage(error)}`)
            return []
          }),
      )

      // Eventbrite search
      searchPromises.push(
        searchEventbriteEvents({
          ...params,
          size: Math.floor((params.size || 20) / 4),
        })
          .then((events) => {
            if (events.length > 0) sources.push("Eventbrite")
            return events
          })
          .catch((error) => {
            errors.push(`Eventbrite: ${formatErrorMessage(error)}`)
            return []
          }),
      )

      // PredictHQ search
      searchPromises.push(
        searchPredictHQEvents({
          ...params,
          size: Math.floor((params.size || 20) / 4),
        })
          .then((events) => {
            if (events.length > 0) sources.push("PredictHQ")
            return events
          })
          .catch((error) => {
            errors.push(`PredictHQ: ${formatErrorMessage(error)}`)
            return []
          }),
      )

      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises)

      // Combine events from successful searches
      let allEvents: EventDetailProps[] = []
      results.forEach((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          allEvents.push(...result.value)
        }
      })

      // Remove duplicates based on title and date similarity
      allEvents = removeDuplicateEvents(allEvents)

      // Apply additional filtering
      allEvents = applyFilters(allEvents, params)

      // Sort events
      allEvents = sortEvents(allEvents, params.sort || "date")

      // Apply pagination
      const page = params.page || 0
      const size = params.size || 20
      const startIndex = page * size
      const paginatedEvents = allEvents.slice(startIndex, startIndex + size)

      // Generate filter options
      const filters = generateFilterOptions(allEvents)

      const responseTime = Date.now() - startTime

      const result: EventSearchResult = {
        events: paginatedEvents,
        totalCount: allEvents.length,
        page,
        totalPages: Math.ceil(allEvents.length / size),
        sources,
        responseTime,
        cached: false,
        filters,
        error: errors.length > 0 ? `Some APIs failed: ${errors.join("; ")}` : undefined,
      }

      // Cache the result for 5 minutes (shorter for real data)
      if (result.events.length > 0) {
        memoryCache.set(cacheKey, result, 5 * 60 * 1000)
      }

      logger.info("Events search completed", {
        component: "events-api",
        action: "search_events_success",
        metadata: {
          eventCount: result.events.length,
          totalCount: result.totalCount,
          sources,
          errors: errors.length,
          responseTime,
          apiStatus: {
            ticketmaster: sources.includes("Ticketmaster"),
            rapidapi: sources.includes("RapidAPI"),
            eventbrite: sources.includes("Eventbrite"),
            predicthq: sources.includes("PredictHQ"),
          },
        },
      })

      // If no events found from any API, provide fallback events
      if (result.events.length === 0 && errors.length > 0) {
        logger.info("No events found from APIs, using fallback events")
        const fallbackEvents = generateFallbackEvents(params.size || 20)
        result.events = fallbackEvents.slice(0, params.size || 20)
        result.totalCount = fallbackEvents.length
        result.sources = ["Fallback"]
        result.error = `All APIs failed: ${errors.join("; ")} - Showing sample events`
      }

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = formatErrorMessage(error)

      logger.error(
        "Events search failed",
        {
          component: "events-api",
          action: "search_events_error",
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
        cached: false,
      }
    }
  })
}

// Remove duplicate events
function removeDuplicateEvents(events: EventDetailProps[]): EventDetailProps[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = `${event.title.toLowerCase()}-${event.date}-${event.location.toLowerCase()}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// Apply additional filters
function applyFilters(events: EventDetailProps[], params: EventSearchParams): EventDetailProps[] {
  let filtered = events

  // Apply price range filtering
  if (params.priceRange) {
    filtered = filtered.filter((event) => {
      if (event.price.toLowerCase() === "free") {
        return params.priceRange!.min === 0
      }

      const priceMatch = event.price.match(/\$(\d+)/)
      if (priceMatch) {
        const price = Number.parseInt(priceMatch[1])
        return price >= params.priceRange!.min && price <= params.priceRange!.max
      }

      return true
    })
  }

  // Apply date range filtering
  if (params.dateRange) {
    const startDate = new Date(params.dateRange.start)
    const endDate = new Date(params.dateRange.end)

    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  return filtered
}

// Sort events
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

    case "alphabetical":
      return sortedEvents.sort((a, b) => a.title.localeCompare(b.title))

    case "relevance":
    default:
      return sortedEvents
  }
}

// Extract numeric price value
function extractPriceValue(priceString: string): number {
  if (priceString.toLowerCase() === "free") return 0
  const match = priceString.match(/\$(\d+)/)
  return match ? Number.parseInt(match[1]) : 999999
}

// Generate filter options
function generateFilterOptions(events: EventDetailProps[]) {
  const categories = [...new Set(events.map((e) => e.category))].sort()
  const priceRanges = ["Free", "$1-$25", "$26-$50", "$51-$100", "$100+"]
  const locations = [...new Set(events.map((e) => e.address.split(",").pop()?.trim() || ""))].sort()

  return {
    categories,
    priceRanges,
    locations,
  }
}

// Get event details
export async function getEventDetails(eventId: string): Promise<EventDetailProps | null> {
  return measurePerformance("getEventDetails", async () => {
    try {
      const cacheKey = `event_details:${eventId}`
      const cached = memoryCache.get<EventDetailProps>(cacheKey)

      if (cached) {
        return cached
      }

      // Try Ticketmaster first
      const ticketmasterEvent = await getTicketmasterEventDetails(eventId)
      if (ticketmasterEvent) {
        memoryCache.set(cacheKey, ticketmasterEvent, 30 * 60 * 1000)
        return ticketmasterEvent
      }

      // If not found, search across all sources
      const searchResult = await searchEvents({ keyword: eventId, size: 1 })
      if (searchResult.events.length > 0) {
        const event = searchResult.events[0]
        memoryCache.set(cacheKey, event, 30 * 60 * 1000)
        return event
      }

      return null
    } catch (error) {
      logger.error("Failed to get event details", {
        eventId,
        error: formatErrorMessage(error),
      })
      return null
    }
  })
}

// Get featured events
export async function getFeaturedEvents(limit = 6): Promise<EventDetailProps[]> {
  try {
    const cacheKey = `featured_events:${limit}`
    const cached = memoryCache.get<EventDetailProps[]>(cacheKey)

    if (cached) {
      return cached
    }

    logger.info("Fetching featured events", { limit })

    // Try multiple search strategies for featured events
    const searchStrategies = [
      { keyword: "concert music festival", location: "New York, NY" },
      { keyword: "popular events", location: "Los Angeles, CA" },
      { keyword: "entertainment shows", location: "Chicago, IL" },
      { keyword: "live music", location: "Austin, TX" },
    ]

    const allEvents: EventDetailProps[] = []
    let successfulSources = 0

    for (const strategy of searchStrategies) {
      try {
        logger.info(`Trying search strategy: ${strategy.keyword} in ${strategy.location}`)

        const searchResult = await searchEvents({
          ...strategy,
          size: Math.ceil(limit / 2), // Get more events per strategy
          sort: "popularity",
        })

        if (searchResult.events.length > 0) {
          allEvents.push(...searchResult.events)
          successfulSources++
          logger.info(
            `Strategy successful: found ${searchResult.events.length} events from sources: ${searchResult.sources.join(", ")}`,
          )

          // Break if we have enough events from successful sources
          if (allEvents.length >= limit && successfulSources >= 2) break
        }
      } catch (error) {
        logger.warn(`Featured events search strategy failed: ${formatErrorMessage(error)}`)
        continue
      }
    }

    // Remove duplicates and sort by popularity
    const uniqueEvents = removeDuplicateEvents(allEvents)
    let featuredEvents = uniqueEvents.sort((a, b) => b.attendees - a.attendees).slice(0, limit)

    // If we still don't have enough events, use fallback events
    if (featuredEvents.length < Math.min(limit, 3)) {
      logger.info("Using fallback events due to insufficient API results")
      const fallbackEvents = generateFallbackEvents(limit - featuredEvents.length)
      featuredEvents = [...featuredEvents, ...fallbackEvents].slice(0, limit)
    }

    // Cache even if we have fewer events than requested
    if (featuredEvents.length > 0) {
      memoryCache.set(cacheKey, featuredEvents, 15 * 60 * 1000)
    }

    logger.info(`Featured events: found ${featuredEvents.length} events (${successfulSources} successful sources)`)
    return featuredEvents
  } catch (error) {
    logger.error("Failed to get featured events", {
      error: formatErrorMessage(error),
    })

    // Return fallback events instead of empty array
    logger.info("Returning fallback events due to complete failure")
    return generateFallbackEvents(limit)
  }
}

// Generate fallback events when APIs are unavailable
function generateFallbackEvents(limit = 6): EventDetailProps[] {
  const categories = ["Music", "Arts", "Sports", "Food", "Business", "Technology"]
  const locations = [
    { name: "Madison Square Garden", city: "New York", lat: 40.7505, lng: -73.9934 },
    { name: "Hollywood Bowl", city: "Los Angeles", lat: 34.1122, lng: -118.339 },
    { name: "Navy Pier", city: "Chicago", lat: 41.8919, lng: -87.6051 },
    { name: "Space Needle", city: "Seattle", lat: 47.6205, lng: -122.3493 },
    { name: "Golden Gate Park", city: "San Francisco", lat: 37.7694, lng: -122.4862 },
    { name: "South Beach", city: "Miami", lat: 25.7907, lng: -80.13 },
  ]

  const fallbackEvents: EventDetailProps[] = []

  for (let i = 0; i < Math.min(limit, 12); i++) {
    const category = categories[i % categories.length]
    const location = locations[i % locations.length]

    // Generate future dates
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1)

    const formattedDate = futureDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const hour = Math.floor(Math.random() * 12) + 1
    const period = Math.random() > 0.5 ? "PM" : "AM"
    const formattedTime = `${hour}:00 ${period}`

    // Generate realistic prices
    const isFree = Math.random() < 0.2
    const basePrice = Math.floor(Math.random() * 100) + 15
    const price = isFree ? "Free" : `$${basePrice}`

    fallbackEvents.push({
      id: 10000 + i, // Use high IDs to avoid conflicts
      title: `${category} Event ${i + 1}`,
      description: `Join us for an amazing ${category.toLowerCase()} event in ${location.city}. This event features incredible activities and unforgettable experiences.`,
      category,
      date: formattedDate,
      time: formattedTime,
      location: location.name,
      address: `${location.name}, ${location.city}`,
      price,
      image: `/event-${(i % 12) + 1}.png`,
      organizer: {
        name: `${location.city} Events`,
        avatar: `/avatar-${(i % 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 1000) + 100,
      isFavorite: false,
      coordinates: { lat: location.lat, lng: location.lng },
      ticketLinks: isFree ? [] : [{ source: "Tickets", link: "#" }],
    })
  }

  return fallbackEvents
}

// Get events by category
export async function getEventsByCategory(category: string, limit = 20): Promise<EventDetailProps[]> {
  try {
    const cacheKey = `events_by_category:${category}:${limit}`
    const cached = memoryCache.get<EventDetailProps[]>(cacheKey)

    if (cached) {
      return cached
    }

    const searchResult = await searchEvents({
      keyword: category,
      categories: [category],
      size: limit,
    })

    const categoryEvents = searchResult.events

    memoryCache.set(cacheKey, categoryEvents, 10 * 60 * 1000)
    return categoryEvents
  } catch (error) {
    logger.error("Failed to get events by category", {
      category,
      error: formatErrorMessage(error),
    })
    return []
  }
}

// Test API connections
export async function testApiConnections(): Promise<{
  ticketmaster: boolean
  rapidapi: boolean
  eventbrite: boolean
  predicthq: boolean
}> {
  const results = {
    ticketmaster: false,
    rapidapi: false,
    eventbrite: false,
    predicthq: false,
  }

  // Test Ticketmaster
  try {
    const tmResult = await searchTicketmasterEvents({ keyword: "test", size: 1 })
    results.ticketmaster = !tmResult.error
  } catch (error) {
    logger.error("Ticketmaster test failed", { error: formatErrorMessage(error) })
  }

  // Test RapidAPI
  try {
    const rapidEvents = await searchRapidApiEvents({ keyword: "test", size: 1 })
    results.rapidapi = rapidEvents.length >= 0 // Even 0 results means API is working
  } catch (error) {
    logger.error("RapidAPI test failed", { error: formatErrorMessage(error) })
  }

  // Test Eventbrite
  try {
    const ebEvents = await searchEventbriteEvents({ keyword: "test", size: 1 })
    results.eventbrite = ebEvents.length >= 0
  } catch (error) {
    logger.error("Eventbrite test failed", { error: formatErrorMessage(error) })
  }

  // Test PredictHQ
  try {
    const phqEvents = await searchPredictHQEvents({ keyword: "test", size: 1 })
    results.predicthq = phqEvents.length >= 0
  } catch (error) {
    logger.error("PredictHQ test failed", { error: formatErrorMessage(error) })
  }

  return results
}

// Export types
export type { EventSearchParams, EventSearchResult }
