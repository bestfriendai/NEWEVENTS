import { logger, formatErrorMessage } from "@/lib/utils/logger"
import { getServerConfig } from "@/lib/env"
import type { EventDetailProps } from "@/components/event-detail-modal"

export interface EventbriteSearchParams {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number
  startDateTime?: string
  endDateTime?: string
  categories?: string[]
  page?: number
  size?: number
}

export interface EventbriteSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  error?: string
}

// Eventbrite API client
class EventbriteAPI {
  private baseUrl = "https://www.eventbriteapi.com/v3"
  private token: string

  constructor() {
    // Only use server-side tokens
    const config = getServerConfig()
    this.token = config.eventbrite.privateToken || config.eventbrite.apiKey || ""
  }

  private async makeRequest(endpoint: string, params: URLSearchParams): Promise<any> {
    if (!this.token) {
      throw new Error("Eventbrite API token not configured")
    }

    const url = `${this.baseUrl}${endpoint}?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed - check API token")
      }
      if (response.status === 404) {
        throw new Error("Endpoint not found - API may be unavailable")
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded")
      }

      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async searchEvents(params: EventbriteSearchParams): Promise<EventbriteSearchResult> {
    try {
      const searchParams = new URLSearchParams()

      // Add search parameters
      if (params.keyword) searchParams.set("q", params.keyword)
      if (params.location) {
        searchParams.set("location.address", params.location)
        searchParams.set("location.within", `${params.radius || 25}mi`)
      }

      // Set date range
      if (params.startDateTime) {
        searchParams.set("start_date.range_start", new Date(params.startDateTime).toISOString())
      } else {
        // Default to today
        searchParams.set("start_date.range_start", new Date().toISOString())
      }

      if (params.endDateTime) {
        searchParams.set("start_date.range_end", new Date(params.endDateTime).toISOString())
      }

      // Add other parameters
      searchParams.set("expand", "venue,organizer,ticket_availability")
      searchParams.set("page_size", String(Math.min(params.size || 20, 50)))
      searchParams.set("sort_by", "date")
      searchParams.set("page", String((params.page || 0) + 1))

      const data = await this.makeRequest("/events/search/", searchParams)

      const events = data.events ? data.events.map((event: any) => this.transformEvent(event)) : []

      return {
        events,
        totalCount: data.pagination?.object_count || events.length,
        page: params.page || 0,
        totalPages: data.pagination?.page_count || 1,
      }
    } catch (error) {
      logger.error("Eventbrite search failed", { error: formatErrorMessage(error) })
      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        error: formatErrorMessage(error),
      }
    }
  }

  async getEventDetails(eventId: string): Promise<EventDetailProps | null> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set("expand", "venue,organizer,ticket_availability,description")

      const data = await this.makeRequest(`/events/${eventId}/`, searchParams)
      return this.transformEvent(data)
    } catch (error) {
      logger.error("Failed to get Eventbrite event details", {
        eventId,
        error: formatErrorMessage(error),
      })
      return null
    }
  }

  private transformEvent(event: any): EventDetailProps {
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

    // Extract price
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
      attendees: Math.floor(Math.random() * 1000) + 50,
      isFavorite: false,
      coordinates:
        venue.latitude && venue.longitude ? { lat: Number(venue.latitude), lng: Number(venue.longitude) } : undefined,
      ticketLinks: event.url ? [{ source: "Eventbrite", link: event.url }] : [],
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set("page_size", "1")

      await this.makeRequest("/events/search/", searchParams)
      return true
    } catch (error) {
      logger.error("Eventbrite connection test failed", { error: formatErrorMessage(error) })
      return false
    }
  }
}

// Create a server-side only instance
export const eventbriteAPI = new EventbriteAPI()

// Export convenience functions for server-side use only
export async function searchEventbriteEvents(params: EventbriteSearchParams): Promise<EventDetailProps[]> {
  const result = await eventbriteAPI.searchEvents(params)
  return result.events
}

export async function getEventbriteEventDetails(eventId: string): Promise<EventDetailProps | null> {
  return eventbriteAPI.getEventDetails(eventId)
}

export async function testEventbriteConnection(): Promise<boolean> {
  return eventbriteAPI.testConnection()
}
