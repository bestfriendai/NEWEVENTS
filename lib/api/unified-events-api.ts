import type { Event, EventFilters, ApiResponse } from "@/types/event.types"
import { logger } from "@/lib/utils/logger"
import { serverEnv } from "@/lib/env"

interface EventsApiConfig {
  ticketmaster: {
    apiKey: string
    baseUrl: string
  }
  predicthq: {
    apiKey: string
    baseUrl: string
  }
  eventbrite: {
    apiKey: string
    baseUrl: string
  }
}

class UnifiedEventsApi {
  private config: EventsApiConfig

  constructor() {
    this.config = {
      ticketmaster: {
        apiKey: serverEnv.TICKETMASTER_API_KEY || "",
        baseUrl: "https://app.ticketmaster.com/discovery/v2",
      },
      predicthq: {
        apiKey: serverEnv.PREDICTHQ_API_KEY || "",
        baseUrl: "https://api.predicthq.com/v1",
      },
      eventbrite: {
        apiKey: serverEnv.EVENTBRITE_API_KEY || "",
        baseUrl: "https://www.eventbriteapi.com/v3",
      },
    }
  }

  async fetchEvents(filters: EventFilters): Promise<ApiResponse<Event[]>> {
    try {
      const results = await Promise.allSettled([
        this.fetchTicketmasterEvents(filters),
        this.fetchPredictHQEvents(filters),
        this.fetchEventbriteEvents(filters),
      ])

      const events: Event[] = []
      const errors: string[] = []

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          events.push(...result.value.data)
        } else if (result.status === "rejected") {
          const source = ["Ticketmaster", "PredictHQ", "Eventbrite"][index]
          errors.push(`${source}: ${result.reason}`)
          logger.error(`Failed to fetch from ${source}:`, result.reason)
        }
      })

      // Remove duplicates based on name and date
      const uniqueEvents = this.removeDuplicateEvents(events)

      return {
        success: true,
        data: uniqueEvents,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      logger.error("Failed to fetch events:", error)
      return {
        success: false,
        error: "Failed to fetch events from all sources",
        data: [],
      }
    }
  }

  private async fetchTicketmasterEvents(filters: EventFilters): Promise<ApiResponse<Event[]>> {
    if (!this.config.ticketmaster.apiKey) {
      throw new Error("Ticketmaster API key not configured")
    }

    const params = new URLSearchParams({
      apikey: this.config.ticketmaster.apiKey,
      size: "50",
      ...(filters.location && { city: filters.location }),
      ...(filters.category && { classificationName: filters.category }),
      ...(filters.dateRange?.start && { startDateTime: filters.dateRange.start }),
      ...(filters.dateRange?.end && { endDateTime: filters.dateRange.end }),
    })

    const response = await fetch(`${this.config.ticketmaster.baseUrl}/events.json?${params}`)

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`)
    }

    const data = await response.json()
    const events = this.transformTicketmasterEvents(data._embedded?.events || [])

    return { success: true, data: events }
  }

  private async fetchPredictHQEvents(filters: EventFilters): Promise<ApiResponse<Event[]>> {
    if (!this.config.predicthq.apiKey) {
      throw new Error("PredictHQ API key not configured")
    }

    const params = new URLSearchParams({
      limit: "50",
      ...(filters.location && { "location.place_id": filters.location }),
      ...(filters.category && { category: filters.category }),
      ...(filters.dateRange?.start && { "start.gte": filters.dateRange.start }),
      ...(filters.dateRange?.end && { "start.lte": filters.dateRange.end }),
    })

    const response = await fetch(`${this.config.predicthq.baseUrl}/events?${params}`, {
      headers: {
        Authorization: `Bearer ${this.config.predicthq.apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`PredictHQ API error: ${response.status}`)
    }

    const data = await response.json()
    const events = this.transformPredictHQEvents(data.results || [])

    return { success: true, data: events }
  }

  private async fetchEventbriteEvents(filters: EventFilters): Promise<ApiResponse<Event[]>> {
    if (!this.config.eventbrite.apiKey) {
      throw new Error("Eventbrite API key not configured")
    }

    const params = new URLSearchParams({
      "location.address": filters.location || "San Francisco",
      "start_date.range_start": filters.dateRange?.start || new Date().toISOString(),
      "start_date.range_end": filters.dateRange?.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      expand: "venue,category",
    })

    const response = await fetch(`${this.config.eventbrite.baseUrl}/events/search?${params}`, {
      headers: {
        Authorization: `Bearer ${this.config.eventbrite.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status}`)
    }

    const data = await response.json()
    const events = this.transformEventbriteEvents(data.events || [])

    return { success: true, data: events }
  }

  private transformTicketmasterEvents(events: any[]): Event[] {
    return events.map((event) => ({
      id: `tm_${event.id}`,
      title: event.name,
      description: event.info || event.pleaseNote || "",
      date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
      location: {
        name: event._embedded?.venues?.[0]?.name || "",
        address: event._embedded?.venues?.[0]?.address?.line1 || "",
        city: event._embedded?.venues?.[0]?.city?.name || "",
        coordinates: event._embedded?.venues?.[0]?.location
          ? {
              lat: Number.parseFloat(event._embedded.venues[0].location.latitude),
              lng: Number.parseFloat(event._embedded.venues[0].location.longitude),
            }
          : undefined,
      },
      category: event.classifications?.[0]?.segment?.name || "Other",
      price: event.priceRanges?.[0]
        ? {
            min: event.priceRanges[0].min,
            max: event.priceRanges[0].max,
            currency: event.priceRanges[0].currency,
          }
        : undefined,
      image: event.images?.[0]?.url,
      url: event.url,
      source: "ticketmaster",
    }))
  }

  private transformPredictHQEvents(events: any[]): Event[] {
    return events.map((event) => ({
      id: `phq_${event.id}`,
      title: event.title,
      description: event.description || "",
      date: event.start,
      location: {
        name: event.location?.[0] || "",
        address: event.location?.[1] || "",
        city: event.location?.[2] || "",
        coordinates: event.geo
          ? {
              lat: event.geo.geometry.coordinates[1],
              lng: event.geo.geometry.coordinates[0],
            }
          : undefined,
      },
      category: event.category,
      image: `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(event.title)}`,
      source: "predicthq",
    }))
  }

  private transformEventbriteEvents(events: any[]): Event[] {
    return events.map((event) => ({
      id: `eb_${event.id}`,
      title: event.name?.text || "",
      description: event.description?.text || "",
      date: event.start?.utc,
      location: {
        name: event.venue?.name || "",
        address: event.venue?.address?.localized_address_display || "",
        city: event.venue?.address?.city || "",
        coordinates:
          event.venue?.latitude && event.venue?.longitude
            ? {
                lat: Number.parseFloat(event.venue.latitude),
                lng: Number.parseFloat(event.venue.longitude),
              }
            : undefined,
      },
      category: event.category?.name || "Other",
      price: event.ticket_availability?.minimum_ticket_price
        ? {
            min: event.ticket_availability.minimum_ticket_price.major_value,
            max: event.ticket_availability.maximum_ticket_price?.major_value,
            currency: event.ticket_availability.minimum_ticket_price.currency,
          }
        : undefined,
      image: event.logo?.url,
      url: event.url,
      source: "eventbrite",
    }))
  }

  private removeDuplicateEvents(events: Event[]): Event[] {
    const seen = new Set<string>()
    return events.filter((event) => {
      const key = `${event.title.toLowerCase()}_${event.date}_${event.location.city.toLowerCase()}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }
}

export const unifiedEventsApi = new UnifiedEventsApi()
