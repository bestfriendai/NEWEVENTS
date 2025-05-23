import type { EventDetailProps } from "@/components/event-detail-modal"
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from "@/lib/env"
import { geocodeAddress, calculateDistance } from "@/lib/api/map-api"
import { searchTicketmasterEvents } from "@/lib/api/ticketmaster-api"

// Enhanced interface for search parameters
export interface EnhancedEventSearchParams {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number // in miles
  startDateTime?: string
  endDateTime?: string
  categories?: string[]
  page?: number
  size?: number
  sort?: string
  priceRange?: { min: number; max: number }
  includeOnline?: boolean
  userPreferences?: {
    favoriteCategories?: string[]
    pricePreference?: "free" | "paid" | "any"
    timePreference?: "morning" | "afternoon" | "evening" | "any"
  }
}

// API provider types
type ApiProvider = "rapidapi" | "ticketmaster" | "eventbrite" | "predicthq"

// Event source tracking
interface EventSource {
  provider: ApiProvider
  originalId: string
  confidence: number
  lastUpdated: Date
}

// Enhanced event interface with source tracking
interface EnhancedEventDetail extends EventDetailProps {
  source: EventSource
  relevanceScore: number
  distance?: number
}

// Location cache for performance
const locationCache = new Map<string, { lat: number; lng: number; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Helper function to get coordinates from location string
async function getCoordinatesFromLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  const cached = locationCache.get(location)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { lat: cached.lat, lng: cached.lng }
  }

  // Check if location is already coordinates
  const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/
  const coordsMatch = location.match(coordsRegex)
  if (coordsMatch) {
    const lat = Number.parseFloat(coordsMatch[1])
    const lng = Number.parseFloat(coordsMatch[3])
    return { lat, lng }
  }

  // Geocode the location
  try {
    const geocoded = await geocodeAddress(location)
    if (geocoded) {
      // Cache the result
      locationCache.set(location, {
        lat: geocoded.lat,
        lng: geocoded.lng,
        timestamp: Date.now(),
      })
      return { lat: geocoded.lat, lng: geocoded.lng }
    }
  } catch (error) {
    console.error("Error geocoding location:", error)
  }

  return null
}

// Enhanced RapidAPI Events Search - Pull more events with multiple queries
async function searchRapidApiEvents(params: EnhancedEventSearchParams): Promise<EnhancedEventDetail[]> {
  try {
    console.log("Searching RapidAPI events with params:", params)

    const coordinates = params.coordinates || (await getCoordinatesFromLocation(params.location || "New York"))
    if (!coordinates) {
      console.warn("Could not get coordinates for RapidAPI search")
      return []
    }

    const allEvents: EnhancedEventDetail[] = []
    const maxPages = 3 // Get multiple pages of results
    const eventsPerPage = 50 // Increased from 20

    // Multiple search strategies to get more diverse events
    const searchQueries = [
      params.keyword ? `${params.keyword} in ${params.location || ""}`.trim() : `events in ${params.location || ""}`,
      `concerts in ${params.location || ""}`,
      `festivals in ${params.location || ""}`,
      `shows in ${params.location || ""}`,
      `entertainment in ${params.location || ""}`,
    ]

    // Remove duplicates and limit queries
    const uniqueQueries = [...new Set(searchQueries)].slice(0, 3)

    for (const query of uniqueQueries) {
      for (let page = 0; page < maxPages; page++) {
        try {
          const queryParams = new URLSearchParams()
          queryParams.append("query", query)
          queryParams.append("date", "any")
          queryParams.append("is_virtual", "false")
          queryParams.append("start", (page * eventsPerPage).toString())

          console.log(
            `RapidAPI request: ${query}, page ${page}, URL: https://real-time-events-search.p.rapidapi.com/search-events?${queryParams.toString()}`,
          )

          const response = await fetch(
            `https://real-time-events-search.p.rapidapi.com/search-events?${queryParams.toString()}`,
            {
              method: "GET",
              headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
              },
            },
          )

          if (!response.ok) {
            console.error(`RapidAPI error for query "${query}":`, response.status, response.statusText)
            continue
          }

          const data = await response.json()
          console.log(`RapidAPI response for "${query}", page ${page}:`, data)

          if (data.status === "OK" && data.data) {
            const events = Array.isArray(data.data) ? data.data : [data.data]
            const transformedEvents = events
              .map((event: any) => transformRapidApiEvent(event, coordinates))
              .filter(Boolean)

            allEvents.push(...transformedEvents)

            // If we got fewer events than requested, no point in getting more pages
            if (events.length < eventsPerPage) {
              break
            }
          }

          // Add delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching RapidAPI events for query "${query}", page ${page}:`, error)
        }
      }
    }

    console.log(`RapidAPI total events found: ${allEvents.length}`)
    return allEvents
  } catch (error) {
    console.error("RapidAPI search error:", error)
    return []
  }
}

// Update the transform function to handle the real API structure
function transformRapidApiEvent(
  apiEvent: any,
  userCoordinates: { lat: number; lng: number },
): EnhancedEventDetail | null {
  try {
    // Extract venue information
    const venue = apiEvent.venue || {}
    const coordinates =
      venue.latitude !== undefined && venue.longitude !== undefined
        ? { lat: Number(venue.latitude), lng: Number(venue.longitude) }
        : undefined

    // Calculate distance if coordinates are available
    const distance = coordinates
      ? calculateDistance(userCoordinates.lat, userCoordinates.lng, coordinates.lat, coordinates.lng)
      : undefined

    // Calculate relevance score
    const relevanceScore = calculateRelevanceScore(apiEvent, userCoordinates, distance)

    // Generate numeric ID
    const numericId = Math.abs(
      apiEvent.event_id?.split("").reduce((a: number, b: string) => {
        a = (a << 5) - a + b.charCodeAt(0)
        return a & a
      }, 0) || Math.floor(Math.random() * 10000),
    )

    // Format dates
    const startDate = apiEvent.start_time ? new Date(apiEvent.start_time) : new Date()
    const endDate = apiEvent.end_time ? new Date(apiEvent.end_time) : null

    const formattedDate = startDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const formattedTime = endDate
      ? `${startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })} - ${endDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`
      : `${startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })} onwards`

    // Extract ticket links
    const ticketLinks = []

    if (apiEvent.ticket_links) {
      ticketLinks.push(
        ...apiEvent.ticket_links.map((link: any) => ({
          source: link.source || "Ticket Provider",
          link: link.link,
        })),
      )
    }

    // Add info links if no ticket links
    if (ticketLinks.length === 0 && apiEvent.info_links) {
      ticketLinks.push(
        ...apiEvent.info_links.slice(0, 3).map((link: any) => ({
          source: link.source || "Event Info",
          link: link.link,
        })),
      )
    }

    return {
      id: numericId,
      title: apiEvent.name || "Untitled Event",
      description: apiEvent.description || "No description available.",
      category: extractCategory(apiEvent.tags || []),
      date: formattedDate,
      time: formattedTime,
      location: venue.name || "Venue TBA",
      address: venue.full_address || "Address TBA",
      price: ticketLinks.length > 0 ? "Tickets Available" : "Price TBA",
      image: apiEvent.thumbnail || "/community-event.png",
      organizer: {
        name: venue.name || apiEvent.publisher || "Event Organizer",
        avatar: "/avatar-1.png",
      },
      attendees: Math.floor(Math.random() * 1000) + 50,
      isFavorite: false,
      coordinates,
      ticketLinks,
      source: {
        provider: "rapidapi",
        originalId: apiEvent.event_id || numericId.toString(),
        confidence: 0.9,
        lastUpdated: new Date(),
      },
      relevanceScore,
      distance,
    }
  } catch (error) {
    console.error("Error transforming RapidAPI event:", error)
    return null
  }
}

// Enhanced duplicate detection
function createEventSignature(event: EnhancedEventDetail): string {
  // Create a more sophisticated signature
  const title = event.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  const date = event.date.replace(/[^0-9]/g, "")
  const location = event.location
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  // Create multiple signatures for fuzzy matching
  const signatures = [
    `${title}-${date}-${location}`,
    `${title.substring(0, 20)}-${date}-${location.substring(0, 15)}`,
    `${title}-${date}`,
  ]

  return signatures[0] // Use the most specific signature
}

function areSimilarEvents(event1: EnhancedEventDetail, event2: EnhancedEventDetail): boolean {
  // Check title similarity
  const title1 = event1.title.toLowerCase().replace(/[^a-z0-9\s]/g, "")
  const title2 = event2.title.toLowerCase().replace(/[^a-z0-9\s]/g, "")

  // Simple similarity check - if titles are very similar
  const titleSimilarity = calculateStringSimilarity(title1, title2)

  // Check date similarity
  const dateSimilarity = event1.date === event2.date

  // Check location similarity
  const location1 = event1.location.toLowerCase().replace(/[^a-z0-9\s]/g, "")
  const location2 = event2.location.toLowerCase().replace(/[^a-z0-9\s]/g, "")
  const locationSimilarity = calculateStringSimilarity(location1, location2)

  // Consider events similar if title is very similar AND (same date OR same location)
  return titleSimilarity > 0.8 && (dateSimilarity || locationSimilarity > 0.7)
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Enhanced duplicate removal
function removeDuplicateEvents(events: EnhancedEventDetail[]): EnhancedEventDetail[] {
  const uniqueEvents: EnhancedEventDetail[] = []

  for (const event of events) {
    let isDuplicate = false

    for (let i = 0; i < uniqueEvents.length; i++) {
      if (areSimilarEvents(event, uniqueEvents[i])) {
        isDuplicate = true
        // Keep the event with higher confidence or better source
        if (
          event.source.confidence > uniqueEvents[i].source.confidence ||
          (event.source.confidence === uniqueEvents[i].source.confidence && event.source.provider === "ticketmaster")
        ) {
          uniqueEvents[i] = event
        }
        break
      }
    }

    if (!isDuplicate) {
      uniqueEvents.push(event)
    }
  }

  return uniqueEvents
}

// Helper functions for data extraction and formatting
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

function calculateRelevanceScore(event: any, userCoordinates: { lat: number; lng: number }, distance?: number): number {
  let score = 0.5 // Base score

  // Distance factor (closer = higher score)
  if (distance !== undefined) {
    if (distance <= 5) score += 0.3
    else if (distance <= 15) score += 0.2
    else if (distance <= 30) score += 0.1
  }

  // Recency factor (newer events = higher score)
  if (event.start_time || event.start || event.dates?.start) {
    const eventDate = new Date(event.start_time || event.start || event.dates.start.localDate)
    const now = new Date()
    const daysDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff >= 0 && daysDiff <= 7)
      score += 0.2 // This week
    else if (daysDiff > 7 && daysDiff <= 30) score += 0.1 // This month
  }

  return Math.min(score, 1.0)
}

// Main enhanced search function
export async function searchEnhancedEvents(params: EnhancedEventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: string
}> {
  try {
    console.log("Enhanced event search with params:", params)

    // Get user coordinates
    const coordinates = params.coordinates || (await getCoordinatesFromLocation(params.location || "New York"))
    if (!coordinates) {
      throw new Error("Could not determine location for event search")
    }

    const enhancedParams = { ...params, coordinates }

    // Search all available APIs in parallel with increased limits
    const searchPromises = [
      searchRapidApiEvents(enhancedParams),
      searchTicketmasterEvents({
        keyword: params.keyword,
        location: params.location,
        coordinates: params.coordinates,
        radius: params.radius || 50,
        size: 50, // Increased size
        page: params.page,
      }).then((result) =>
        result.events.map((event) => ({
          ...event,
          source: {
            provider: "ticketmaster" as ApiProvider,
            originalId: event.id.toString(),
            confidence: 0.95,
            lastUpdated: new Date(),
          },
          relevanceScore: 0.8,
          distance: undefined,
        })),
      ),
    ]

    const results = await Promise.allSettled(searchPromises)
    const sources: string[] = []
    const allEvents: EnhancedEventDetail[] = []

    // Collect results from all sources
    results.forEach((result, index) => {
      const providerNames = ["RapidAPI", "Ticketmaster"]
      if (result.status === "fulfilled" && result.value.length > 0) {
        sources.push(providerNames[index])
        allEvents.push(...result.value)
      }
    })

    console.log(`Found ${allEvents.length} events from ${sources.length} sources:`, sources)

    // Remove duplicates with enhanced detection
    const uniqueEvents = removeDuplicateEvents(allEvents)
    console.log(`After deduplication: ${uniqueEvents.length} events`)

    // Apply additional filtering based on user preferences
    const filteredEvents = applyUserPreferences(uniqueEvents, params.userPreferences)

    // Sort by relevance score and distance
    filteredEvents.sort((a, b) => {
      // Primary sort by relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Secondary sort by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      // Tertiary sort by source confidence
      return b.source.confidence - a.source.confidence
    })

    // Apply pagination
    const page = params.page || 0
    const size = params.size || 20
    const startIndex = page * size
    const endIndex = startIndex + size
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

    // Convert to standard EventDetailProps format
    const events: EventDetailProps[] = paginatedEvents.map((event) => {
      const { source, relevanceScore, distance, ...standardEvent } = event
      return standardEvent
    })

    return {
      events,
      totalCount: filteredEvents.length,
      page,
      totalPages: Math.ceil(filteredEvents.length / size),
      sources,
    }
  } catch (error) {
    console.error("Enhanced event search error:", error)
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      sources: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Apply user preferences to filter events
function applyUserPreferences(
  events: EnhancedEventDetail[],
  preferences?: EnhancedEventSearchParams["userPreferences"],
): EnhancedEventDetail[] {
  if (!preferences) return events

  let filtered = [...events]

  // Filter by favorite categories
  if (preferences.favoriteCategories && preferences.favoriteCategories.length > 0) {
    filtered = filtered.map((event) => {
      if (preferences.favoriteCategories!.includes(event.category.toLowerCase())) {
        event.relevanceScore += 0.2 // Boost score for preferred categories
      }
      return event
    })
  }

  // Filter by price preference
  if (preferences.pricePreference === "free") {
    filtered = filtered.filter((event) => event.price.toLowerCase().includes("free"))
  } else if (preferences.pricePreference === "paid") {
    filtered = filtered.filter((event) => !event.price.toLowerCase().includes("free"))
  }

  // Filter by time preference
  if (preferences.timePreference && preferences.timePreference !== "any") {
    filtered = filtered.filter((event) => {
      if (!event.time || event.time === "Time TBA") return true

      const timeStr = event.time.toLowerCase()
      switch (preferences.timePreference) {
        case "morning":
          return timeStr.includes("am") && !timeStr.includes("12:")
        case "afternoon":
          return (
            timeStr.includes("pm") &&
            (timeStr.includes("12:") ||
              timeStr.includes("1:") ||
              timeStr.includes("2:") ||
              timeStr.includes("3:") ||
              timeStr.includes("4:") ||
              timeStr.includes("5:"))
          )
        case "evening":
          return (
            timeStr.includes("pm") &&
            (timeStr.includes("6:") ||
              timeStr.includes("7:") ||
              timeStr.includes("8:") ||
              timeStr.includes("9:") ||
              timeStr.includes("10:") ||
              timeStr.includes("11:"))
          )
        default:
          return true
      }
    })
  }

  return filtered
}

// Get personalized events for a user
export async function getPersonalizedEvents(
  coordinates: { lat: number; lng: number },
  userPreferences: EnhancedEventSearchParams["userPreferences"],
  radius = 25,
  limit = 20,
): Promise<{
  events: EventDetailProps[]
  sources: string[]
  error?: string
}> {
  try {
    // Create search params with user coordinates and preferences
    const params: EnhancedEventSearchParams = {
      coordinates,
      radius,
      size: limit,
      userPreferences,
    }

    // Search for events
    const result = await searchEnhancedEvents(params)

    return {
      events: result.events,
      sources: result.sources,
      error: result.error,
    }
  } catch (error) {
    console.error("Error getting personalized events:", error)
    return {
      events: [],
      sources: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Export additional helper functions
export { getCoordinatesFromLocation, calculateRelevanceScore }
