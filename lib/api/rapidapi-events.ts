import { logger } from "@/lib/utils/logger"

interface RapidAPIEvent {
  event_id: string
  name: string
  link: string
  description: string
  start_time: string
  end_time: string
  is_virtual: boolean
  thumbnail: string
  publisher: string
  ticket_links: Array<{
    source: string
    link: string
  }>
  info_links: Array<{
    source: string
    link: string
  }>
  venue: {
    google_id: string
    name: string
    phone_number: string
    website: string
    full_address: string
    latitude: number
    longitude: number
    city: string
    state: string
    country: string
    subtype: string
    subtypes: string[]
  }
  tags: string[]
  language: string
  // Price information (may not always be available)
  price?: {
    min?: number
    max?: number
    currency?: string
    is_free?: boolean
  }
  // Alternative price fields that might be present
  min_price?: number
  max_price?: number
  is_free?: boolean
}

interface EventSearchParams {
  query: string
  date?: string
  is_virtual?: boolean
  start?: number
}

interface EventSearchResponse {
  status: string
  request_id: string
  data: RapidAPIEvent[]
}

class RapidAPIEventsService {
  private readonly baseUrl = "https://real-time-events-search.p.rapidapi.com"
  private readonly apiKey = process.env.RAPIDAPI_KEY || ""
  private readonly apiHost = "real-time-events-search.p.rapidapi.com"

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": this.apiKey,
        "X-RapidAPI-Host": this.apiHost,
      },
    })

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async searchEvents(params: EventSearchParams): Promise<RapidAPIEvent[]> {
    try {
      const searchParams = {
        query: params.query,
        date: params.date || "any",
        is_virtual: params.is_virtual?.toString() || "false",
        start: params.start?.toString() || "0",
      }

      const response = await this.makeRequest<EventSearchResponse>("/search-events", searchParams)

      if (response.status === "OK" && response.data) {
        return response.data
      }

      return []
    } catch (error) {
      logger.error("Failed to search events:", error)
      throw error
    }
  }

  async getEventDetails(eventId: string): Promise<RapidAPIEvent | null> {
    try {
      const response = await this.makeRequest<{ status: string; data: RapidAPIEvent }>("/event-details", {
        event_id: eventId,
      })

      if (response.status === "OK" && response.data) {
        return response.data
      }

      return null
    } catch (error) {
      logger.error("Failed to get event details:", error)
      throw error
    }
  }

  categorizeEvent(event: RapidAPIEvent): string {
    const tags = event.tags?.map((tag) => tag.toLowerCase()) || []
    const venueSubtype = event.venue?.subtype?.toLowerCase() || ""
    const venueSubtypes = event.venue?.subtypes?.map((st) => st.toLowerCase()) || []
    const name = event.name?.toLowerCase() || ""
    const description = event.description?.toLowerCase() || ""

    // Concert categorization
    if (
      tags.some((tag) => ["concert", "music", "show", "live music"].includes(tag)) ||
      ["concert_hall", "live_music_venue", "music_venue"].includes(venueSubtype) ||
      venueSubtypes.some((st) => ["concert_hall", "live_music_venue"].includes(st))
    ) {
      return "Concerts"
    }

    // Club Events categorization
    if (
      venueSubtype === "night_club" ||
      venueSubtypes.includes("night_club") ||
      tags.some((tag) => ["clubbing", "dj", "nightlife", "club"].includes(tag)) ||
      name.includes("club") ||
      description.includes("club")
    ) {
      // Check if it's during evening/night hours
      const startTime = new Date(event.start_time)
      const hour = startTime.getHours()
      if (hour >= 18 || hour <= 6) {
        return "Club Events"
      }
    }

    // Day Parties categorization
    if (
      tags.some((tag) => ["party", "social", "day party"].includes(tag)) ||
      name.includes("day party") ||
      description.includes("day party")
    ) {
      const startTime = new Date(event.start_time)
      const hour = startTime.getHours()
      if (hour >= 12 && hour <= 18) {
        return "Day Parties"
      }
    }

    // General Parties
    if (
      tags.some((tag) => ["party", "celebration"].includes(tag)) ||
      name.includes("party") ||
      description.includes("party")
    ) {
      return "Parties"
    }

    // General Events (default)
    return "General Events"
  }

  extractPrice(event: RapidAPIEvent): string {
    // Check if event is explicitly free
    if (event.is_free === true || event.price?.is_free === true) {
      return "Free"
    }

    // Try to extract price from structured price object
    if (event.price) {
      const { min, max, currency = "USD" } = event.price
      if (min !== undefined && max !== undefined) {
        if (min === max) {
          return `$${min}`
        } else {
          return `$${min} - $${max}`
        }
      } else if (min !== undefined) {
        return `From $${min}`
      }
    }

    // Try to extract from direct price fields
    if (event.min_price !== undefined && event.max_price !== undefined) {
      if (event.min_price === event.max_price) {
        return `$${event.min_price}`
      } else {
        return `$${event.min_price} - $${event.max_price}`
      }
    } else if (event.min_price !== undefined) {
      return `From $${event.min_price}`
    }

    // Try to extract price from description or name
    const text = `${event.name} ${event.description}`.toLowerCase()

    // Look for free indicators
    if (text.includes("free") || text.includes("no charge") || text.includes("complimentary")) {
      return "Free"
    }

    // Look for price patterns in text
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/g)
    if (priceMatch && priceMatch.length > 0) {
      const prices = priceMatch.map(p => parseFloat(p.replace('$', '')))
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      if (minPrice === maxPrice) {
        return `$${minPrice}`
      } else {
        return `$${minPrice} - $${maxPrice}`
      }
    }

    // Default fallback
    return "Price TBA"
  }
}

export const rapidAPIEventsService = new RapidAPIEventsService()
