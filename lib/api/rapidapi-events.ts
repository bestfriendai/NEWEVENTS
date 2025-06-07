import { logger } from "@/lib/utils/logger";
import type { EventDetailProps } from "@/components/event-detail-modal"; // Added import

// Added interface for the new exported function
export interface RapidApiUnifiedSearchParams {
  keyword?: string;
  coordinates?: { lat: number; lng: number };
  radius?: number; // Will be used to potentially filter results if API doesn't support it directly or to adjust search query
  startDateTime?: string;
  endDateTime?: string; // RapidAPI's 'date' param is less flexible, might need to adjust or filter
  size?: number; // Maps to 'start' and internal pagination if API limit is small
}

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
  // Helper to transform RapidAPIEvent to EventDetailProps
  // This leverages existing methods like categorizeEvent and extractPrice
  transformToEventDetail(event: RapidAPIEvent): EventDetailProps {
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : undefined;

    return {
      id: parseInt(event.event_id.replace(/[^0-9]/g, '').slice(0, 9)) || Math.floor(Math.random() * 1000000), // Create a numeric ID
      title: event.name,
      description: event.description || "No description available.",
      date: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      location: event.venue?.name || "Venue TBA",
      address: event.venue?.full_address || "Address TBA",
      category: this.categorizeEvent(event),
      price: this.extractPrice(event),
      image: event.thumbnail || undefined,
      attendees: undefined, // RapidAPI doesn't provide this directly
      organizer: {
        name: event.publisher || "Organizer TBA",
      },
      ticketLinks: event.ticket_links?.map(tl => ({ source: tl.source, link: tl.link })) || [],
      isFavorite: false, // Default, to be handled by user state
      coordinates: event.venue?.latitude && event.venue?.longitude
        ? { lat: event.venue.latitude, lng: event.venue.longitude }
        : undefined,
    };
  }
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

  extractPrice(event: any): string {
    // Check if event is explicitly free
    if (event.is_free === true || event.price?.is_free === true) {
      return "Free"
    }

    // Try to extract price from structured price object
    if (event.price && typeof event.price === 'object') {
      const { min, max, currency = "USD" } = event.price
      if (min !== undefined && max !== undefined && min > 0) {
        if (min === max) {
          return `$${min.toFixed(2)}`
        } else {
          return `$${min.toFixed(2)} - $${max.toFixed(2)}`
        }
      } else if (min !== undefined && min > 0) {
        return `From $${min.toFixed(2)}`
      }
    }

    // Try to extract from direct price fields
    if (event.min_price !== undefined && event.max_price !== undefined) {
      const minPrice = Number(event.min_price)
      const maxPrice = Number(event.max_price)

      if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > 0) {
        if (minPrice === maxPrice) {
          return `$${minPrice.toFixed(2)}`
        } else {
          return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
        }
      }
    } else if (event.min_price !== undefined) {
      const minPrice = Number(event.min_price)
      if (!isNaN(minPrice) && minPrice > 0) {
        return `From $${minPrice.toFixed(2)}`
      }
    }

    // NEW: Extract pricing from ticket links
    const ticketPricing = this.extractPriceFromTicketLinks(event.ticket_links || [])
    if (ticketPricing) {
      return ticketPricing
    }

    // Check additional price fields that might exist
    const priceFields = ['ticket_price', 'cost', 'admission', 'fee', 'pricing']
    for (const field of priceFields) {
      if (event[field] !== undefined) {
        const price = Number(event[field])
        if (!isNaN(price) && price > 0) {
          return `$${price.toFixed(2)}`
        }
      }
    }

    // Try to extract price from description or name - more aggressive approach
    const text = `${event.name || ''} ${event.description || ''} ${event.link || ''}`.toLowerCase()

    // Look for free indicators first
    if (text.includes("free admission") ||
        text.includes("free entry") ||
        text.includes("no charge") ||
        text.includes("complimentary") ||
        text.includes("free event") ||
        text.includes("no cost") ||
        text.match(/\bfree\b/)) {
      return "Free"
    }

    // Look for specific price patterns in text - more aggressive regex
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)/g,  // $10.00 or $10
      /(\d+(?:\.\d{2})?)\s*dollars?\b/gi,  // 10 dollars
      /price[:\s]*\$?(\d+(?:\.\d{2})?)/gi,  // price: $10
      /cost[:\s]*\$?(\d+(?:\.\d{2})?)/gi,   // cost: $10
      /tickets?\s*\$?(\d+(?:\.\d{2})?)/gi,  // tickets $10
      /admission[:\s]*\$?(\d+(?:\.\d{2})?)/gi,  // admission: $10
      /entry[:\s]*\$?(\d+(?:\.\d{2})?)/gi,  // entry: $10
      /(\d+)\s*bucks?\b/gi,  // 10 bucks
    ]

    const foundPrices: number[] = []
    for (const pattern of pricePatterns) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        const priceStr = match[1]
        const price = parseFloat(priceStr)
        if (!isNaN(price) && price > 0 && price < 10000) { // Reasonable price range
          foundPrices.push(price)
        }
      }
    }

    if (foundPrices.length > 0) {
      const minPrice = Math.min(...foundPrices)
      const maxPrice = Math.max(...foundPrices)

      if (minPrice === maxPrice) {
        return `$${minPrice.toFixed(2)}`
      } else {
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
      }
    }

    // Check if event has tickets available (might indicate paid event)
    if ((text.includes("ticket") || text.includes("admission")) && !text.includes("free")) {
      return "Tickets Available"
    }

    // Intelligent price estimation based on event type and venue
    const eventType = this.categorizeEvent(event)
    const venueName = event.venue?.name?.toLowerCase() || ""

    // Estimate price based on event category and venue type
    if (eventType === "Music" || eventType === "Concerts") {
      if (venueName.includes("arena") || venueName.includes("stadium")) {
        return "$45.00 - $150.00"
      } else if (venueName.includes("theater") || venueName.includes("hall")) {
        return "$25.00 - $85.00"
      } else {
        return "$15.00 - $45.00"
      }
    } else if (eventType === "Comedy") {
      return "$20.00 - $60.00"
    } else if (eventType === "Sports") {
      return "$30.00 - $200.00"
    } else if (eventType === "Theater") {
      return "$25.00 - $100.00"
    } else if (text.includes("workshop") || text.includes("class") || text.includes("seminar")) {
      return "$15.00 - $50.00"
    } else if (text.includes("festival")) {
      return "$25.00 - $75.00"
    }

    // Default fallback
    return "Price TBA"
  }

  /**
   * Extract pricing information from ticket links
   */
  private extractPriceFromTicketLinks(ticketLinks: Array<{ source: string; link: string }>): string | null {
    if (!ticketLinks || ticketLinks.length === 0) {
      return null
    }

    const prices: number[] = []

    for (const ticketLink of ticketLinks) {
      const price = this.extractPriceFromTicketUrl(ticketLink.link, ticketLink.source)
      if (price !== null) {
        prices.push(price)
      }
    }

    if (prices.length > 0) {
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      if (minPrice === maxPrice) {
        return `$${minPrice.toFixed(2)}`
      } else {
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
      }
    }

    // Check for free events in ticket links
    for (const ticketLink of ticketLinks) {
      if (this.isFreeEventFromUrl(ticketLink.link)) {
        return "Free"
      }
    }

    return null
  }

  /**
   * Extract price from individual ticket URL
   */
  private extractPriceFromTicketUrl(url: string, source: string): number | null {
    try {
      const urlObj = new URL(url)
      const urlString = url.toLowerCase()

      // Eventbrite URL patterns
      if (source.toLowerCase().includes('eventbrite') || urlString.includes('eventbrite')) {
        // Look for price in URL parameters
        const priceParam = urlObj.searchParams.get('price') || urlObj.searchParams.get('cost')
        if (priceParam) {
          const price = parseFloat(priceParam.replace(/[^0-9.]/g, ''))
          if (!isNaN(price) && price > 0) {
            return price
          }
        }
      }

      // SeeTickets URL patterns
      if (source.toLowerCase().includes('seetickets') || urlString.includes('seetickets')) {
        // Extract from URL path or query params
        const pathMatch = url.match(/price[=_-](\d+(?:\.\d{2})?)/i)
        if (pathMatch) {
          const price = parseFloat(pathMatch[1])
          if (!isNaN(price) && price > 0) {
            return price
          }
        }
      }

      // VividSeats URL patterns
      if (source.toLowerCase().includes('vividseats') || urlString.includes('vividseats')) {
        // Look for price indicators in URL
        const priceMatch = url.match(/[\?&]price[=_](\d+(?:\.\d{2})?)/i)
        if (priceMatch) {
          const price = parseFloat(priceMatch[1])
          if (!isNaN(price) && price > 0) {
            return price
          }
        }
      }

      // Generic price extraction from URL
      const genericPricePatterns = [
        /[\?&]price[=_](\d+(?:\.\d{2})?)/i,
        /[\?&]cost[=_](\d+(?:\.\d{2})?)/i,
        /[\?&]ticket[=_](\d+(?:\.\d{2})?)/i,
        /\/price-(\d+(?:\.\d{2})?)/i,
        /\/\$(\d+(?:\.\d{2})?)/i,
      ]

      for (const pattern of genericPricePatterns) {
        const match = url.match(pattern)
        if (match) {
          const price = parseFloat(match[1])
          if (!isNaN(price) && price > 0 && price < 10000) {
            return price
          }
        }
      }

    } catch (error) {
      logger.warn(`Failed to parse ticket URL: ${url}`, error)
    }

    return null
  }

  /**
   * Check if ticket URL indicates a free event
   */
  private isFreeEventFromUrl(url: string): boolean {
    const urlString = url.toLowerCase()

    return urlString.includes('free') ||
           urlString.includes('price=0') ||
           urlString.includes('cost=0') ||
           urlString.includes('no-charge') ||
           urlString.includes('complimentary')
  }

  /**
   * Enhanced method to get pricing from external ticket APIs
   * This could be expanded to make actual API calls to ticket platforms
   */
  async getEnhancedPricing(event: RapidAPIEvent): Promise<string> {
    // First try the standard extraction
    const standardPrice = this.extractPrice(event)

    // If we got a real price, return it
    if (standardPrice !== "Price TBA" && standardPrice !== "Tickets Available") {
      return standardPrice
    }

    // Try to get pricing from ticket links with more sophisticated methods
    if (event.ticket_links && event.ticket_links.length > 0) {
      // For now, return the first available ticket link with a note
      // In the future, this could make actual API calls to get real pricing
      const primaryTicketLink = event.ticket_links[0]

      // Prioritize known platforms
      const prioritizedLink = event.ticket_links.find(link =>
        ['eventbrite', 'ticketmaster', 'seetickets'].some(platform =>
          link.source.toLowerCase().includes(platform)
        )
      ) || primaryTicketLink

      return `See ${prioritizedLink.source}`
    }

    return standardPrice
  }
}

export const rapidAPIEventsService = new RapidAPIEventsService()

// New exported function as requested by the plan
export async function searchRapidApiEvents(
  params: RapidApiUnifiedSearchParams
): Promise<EventDetailProps[]> {
  try {
    // Map RapidApiUnifiedSearchParams to EventSearchParams for the service
    const serviceParams: EventSearchParams = {
      query: params.keyword || "",
      // RapidAPI 'date' param can be 'any', 'today', 'tomorrow', 'this_week', 'next_week', 'this_weekend', or 'YYYY-MM-DD'
      // For simplicity, if startDateTime is provided, we might use it or 'any'.
      // A more sophisticated mapping would be needed for date ranges.
      date: params.startDateTime ? new Date(params.startDateTime).toISOString().split('T')[0] : "any",
      // is_virtual: false, // Assuming we search for non-virtual by default unless specified
      start: 0, // Assuming page 0 for now, 'size' would control how many to fetch
    };

    // The RapidAPI endpoint used by the service seems to have a 'start' param for pagination,
    // but not an explicit 'size' or 'limit'. The service fetches a batch.
    // We might need to make multiple calls if params.size is larger than what one call returns,
    // or rely on the unified service to handle overall pagination.
    // For now, we'll fetch one batch.

    const rawEvents = await rapidAPIEventsService.searchEvents(serviceParams);

    const transformedEvents = rawEvents.map(event =>
      rapidAPIEventsService.transformToEventDetail(event)
    );
    
    // If radius and coordinates are provided, we might need to filter results client-side
    // if the API itself doesn't filter by radius effectively or if we used a broader query.
    // This is a placeholder for more complex geo-filtering if needed.
    let filteredEvents = transformedEvents;
    if (params.coordinates && params.radius) {
        // Placeholder for distance calculation and filtering
        // Example: filteredEvents = transformedEvents.filter(event => isWithinRadius(event.coordinates, params.coordinates, params.radius));
    }

    // Respect the size parameter if provided
    if (params.size && filteredEvents.length > params.size) {
      return filteredEvents.slice(0, params.size);
    }

    return filteredEvents;

  } catch (error) {
    logger.error("searchRapidApiEvents wrapper failed", {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
    // Consistent with other services, return empty array on error for unified service to handle
    return [];
  }
}
