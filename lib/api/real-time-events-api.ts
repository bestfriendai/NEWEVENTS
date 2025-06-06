import { API_CONFIG } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { calculateDistance } from "@/lib/api/map-api"

export interface RealTimeEvent {
  id: string
  title: string
  description: string
  category: string
  startDate: string
  endDate?: string
  startTime: string
  endTime?: string
  venue: {
    name: string
    address: string
    city: string
    state: string
    country: string
    lat: number
    lng: number
  }
  pricing: {
    min: number
    max: number
    currency: string
    isFree: boolean
  }
  organizer: {
    name: string
    verified: boolean
  }
  images: string[]
  ticketUrl?: string
  website?: string
  capacity?: number
  attendeeCount?: number
  rating?: number
  tags: string[]
  source: string
  distance?: number
  popularity: number
}

export interface LocationSearchParams {
  lat: number
  lng: number
  radius: number // in miles
  keyword?: string
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
}

class RealTimeEventsAPI {
  private async fetchTicketmasterEvents(params: LocationSearchParams): Promise<RealTimeEvent[]> {
    try {
      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json")

      // Required parameters - Updated to use geoPoint instead of deprecated latlong
      url.searchParams.set("apikey", API_CONFIG.ticketmaster.apiKey)
      url.searchParams.set("geoPoint", `${params.lat},${params.lng}`)
      url.searchParams.set("radius", params.radius.toString())
      url.searchParams.set("unit", "miles")
      url.searchParams.set("size", (params.limit || 50).toString())
      url.searchParams.set("sort", "distance,asc") // Sort by distance for location-based search

      // Optional parameters
      if (params.keyword) {
        url.searchParams.set("keyword", params.keyword)
      }
      if (params.startDate) {
        url.searchParams.set("startDateTime", params.startDate)
      }
      if (params.endDate) {
        url.searchParams.set("endDateTime", params.endDate)
      }
      if (params.category) {
        url.searchParams.set("classificationName", params.category)
      }

      logger.info("Fetching real events from Ticketmaster", {
        component: "RealTimeEventsAPI",
        action: "fetchTicketmasterEvents",
        metadata: { lat: params.lat, lng: params.lng, radius: params.radius },
      })

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data._embedded?.events) {
        logger.warn("No events found from Ticketmaster", {
          component: "RealTimeEventsAPI",
          action: "fetchTicketmasterEvents",
        })
        return []
      }

      const events: RealTimeEvent[] = data._embedded.events.map((event: any) => {
        const venue = event._embedded?.venues?.[0]
        const venueLocation = venue?.location
        const priceRange = event.priceRanges?.[0]
        const classification = event.classifications?.[0]

        const eventLat = venueLocation?.latitude ? Number.parseFloat(venueLocation.latitude) : 0
        const eventLng = venueLocation?.longitude ? Number.parseFloat(venueLocation.longitude) : 0
        const distance = calculateDistance(params.lat, params.lng, eventLat, eventLng)

        return {
          id: `tm_${event.id}`,
          title: event.name || "Untitled Event",
          description: event.info || event.pleaseNote || "",
          category: classification?.segment?.name || "Entertainment",
          startDate: event.dates?.start?.localDate || "",
          endDate: event.dates?.end?.localDate,
          startTime: event.dates?.start?.localTime || "TBD",
          endTime: event.dates?.end?.localTime,
          venue: {
            name: venue?.name || "TBD",
            address: venue?.address?.line1 || "",
            city: venue?.city?.name || "",
            state: venue?.state?.stateCode || "",
            country: venue?.country?.countryCode || "US",
            lat: eventLat,
            lng: eventLng,
          },
          pricing: {
            min: priceRange?.min || 0,
            max: priceRange?.max || 0,
            currency: priceRange?.currency || "USD",
            isFree: !priceRange || priceRange.min === 0,
          },
          organizer: {
            name: event.promoter?.name || "Ticketmaster",
            verified: true,
          },
          images: event.images?.map((img: any) => img.url) || [],
          ticketUrl: event.url,
          website: event.url,
          capacity: venue?.capacity,
          rating: 4.0 + Math.random() * 1.0, // Simulated rating
          tags: [classification?.segment?.name, classification?.genre?.name, classification?.subGenre?.name].filter(
            Boolean,
          ),
          source: "Ticketmaster",
          distance,
          popularity: Math.floor(Math.random() * 1000) + 100,
        }
      })

      logger.info(`Successfully fetched ${events.length} events from Ticketmaster`, {
        component: "RealTimeEventsAPI",
        action: "fetchTicketmasterEvents",
      })

      return events
    } catch (error) {
      logger.error("Error fetching Ticketmaster events", {
        component: "RealTimeEventsAPI",
        action: "fetchTicketmasterEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  private async fetchEventbriteEvents(params: LocationSearchParams): Promise<RealTimeEvent[]> {
    try {
      const url = new URL("https://www.eventbriteapi.com/v3/events/search/")

      // Build location string for Eventbrite
      const locationString = `${params.lat},${params.lng}`

      url.searchParams.set("location.latitude", params.lat.toString())
      url.searchParams.set("location.longitude", params.lng.toString())
      url.searchParams.set("location.within", `${params.radius}mi`)
      url.searchParams.set("expand", "venue,organizer,ticket_availability,category")
      url.searchParams.set("page_size", (params.limit || 50).toString())
      url.searchParams.set("sort_by", "date")

      if (params.keyword) {
        url.searchParams.set("q", params.keyword)
      }
      if (params.startDate) {
        url.searchParams.set("start_date.range_start", params.startDate)
      }
      if (params.endDate) {
        url.searchParams.set("start_date.range_end", params.endDate)
      }

      const headers = {
        Authorization: `Bearer ${API_CONFIG.eventbrite.privateToken}`,
        "Content-Type": "application/json",
      }

      logger.info("Fetching real events from Eventbrite", {
        component: "RealTimeEventsAPI",
        action: "fetchEventbriteEvents",
        metadata: { lat: params.lat, lng: params.lng, radius: params.radius },
      })

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.events || data.events.length === 0) {
        logger.warn("No events found from Eventbrite", {
          component: "RealTimeEventsAPI",
          action: "fetchEventbriteEvents",
        })
        return []
      }

      const events: RealTimeEvent[] = data.events.map((event: any) => {
        const venue = event.venue
        const eventLat = venue?.latitude ? Number.parseFloat(venue.latitude) : 0
        const eventLng = venue?.longitude ? Number.parseFloat(venue.longitude) : 0
        const distance = calculateDistance(params.lat, params.lng, eventLat, eventLng)

        return {
          id: `eb_${event.id}`,
          title: event.name?.text || "Untitled Event",
          description: event.description?.text || event.summary || "",
          category: event.category?.name || "Event",
          startDate: event.start?.local?.split("T")[0] || "",
          endDate: event.end?.local?.split("T")[0],
          startTime: event.start?.local?.split("T")[1]?.substring(0, 5) || "TBD",
          endTime: event.end?.local?.split("T")[1]?.substring(0, 5),
          venue: {
            name: venue?.name || "TBD",
            address: venue?.address?.address_1 || "",
            city: venue?.address?.city || "",
            state: venue?.address?.region || "",
            country: venue?.address?.country || "US",
            lat: eventLat,
            lng: eventLng,
          },
          pricing: {
            min: 0, // Eventbrite doesn't provide pricing in search API
            max: 0,
            currency: "USD",
            isFree: event.is_free || false,
          },
          organizer: {
            name: event.organizer?.name || "Eventbrite",
            verified: false,
          },
          images: event.logo?.url ? [event.logo.url] : [],
          ticketUrl: event.url,
          website: event.url,
          capacity: event.capacity,
          rating: 3.5 + Math.random() * 1.5, // Simulated rating
          tags: [event.category?.name, event.subcategory?.name].filter(Boolean),
          source: "Eventbrite",
          distance,
          popularity: Math.floor(Math.random() * 500) + 50,
        }
      })

      logger.info(`Successfully fetched ${events.length} events from Eventbrite`, {
        component: "RealTimeEventsAPI",
        action: "fetchEventbriteEvents",
      })

      return events
    } catch (error) {
      logger.error("Error fetching Eventbrite events", {
        component: "RealTimeEventsAPI",
        action: "fetchEventbriteEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  private async fetchRapidAPIEvents(params: LocationSearchParams): Promise<RealTimeEvent[]> {
    try {
      const url = new URL("https://real-time-events-search.p.rapidapi.com/search-events")

      // Build location query
      const locationQuery = `${params.lat},${params.lng}`
      url.searchParams.set("location", locationQuery)
      url.searchParams.set("radius", params.radius.toString())
      url.searchParams.set("limit", (params.limit || 50).toString())

      if (params.keyword) {
        url.searchParams.set("query", params.keyword)
      }
      if (params.startDate) {
        url.searchParams.set("start_date", params.startDate)
      }

      const headers = {
        "X-RapidAPI-Key": API_CONFIG.rapidapi.key,
        "X-RapidAPI-Host": API_CONFIG.rapidapi.host,
      }

      logger.info("Fetching real events from RapidAPI", {
        component: "RealTimeEventsAPI",
        action: "fetchRapidAPIEvents",
        metadata: { lat: params.lat, lng: params.lng, radius: params.radius },
      })

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || data.data.length === 0) {
        logger.warn("No events found from RapidAPI", {
          component: "RealTimeEventsAPI",
          action: "fetchRapidAPIEvents",
        })
        return []
      }

      const events: RealTimeEvent[] = await Promise.all(
        data.data.map(async (event: any, index: number) => {
          const eventLat = event.latitude ? Number.parseFloat(event.latitude) : 0
          const eventLng = event.longitude ? Number.parseFloat(event.longitude) : 0
          const distance = calculateDistance(params.lat, params.lng, eventLat, eventLng)

          // Get enhanced pricing information
          let pricing = {
            min: 0,
            max: 0,
            currency: "USD",
            isFree: event.is_free || false,
          }

          try {
            const { rapidAPIEventsService } = await import("./rapidapi-events")
            const priceString = await rapidAPIEventsService.getEnhancedPricing(event)

            // Parse the price string to extract min/max values
            if (priceString === "Free") {
              pricing.isFree = true
            } else if (priceString.includes("$")) {
              const priceMatch = priceString.match(/\$(\d+(?:\.\d{2})?)\s*-\s*\$(\d+(?:\.\d{2})?)/)
              if (priceMatch) {
                pricing.min = parseFloat(priceMatch[1])
                pricing.max = parseFloat(priceMatch[2])
              } else {
                const singlePriceMatch = priceString.match(/\$(\d+(?:\.\d{2})?)/)
                if (singlePriceMatch) {
                  pricing.min = parseFloat(singlePriceMatch[1])
                  pricing.max = pricing.min
                }
              }
            }
          } catch (error) {
            // Fallback to original pricing logic
            pricing.min = event.min_price ? Number.parseFloat(event.min_price) : 0
            pricing.max = event.max_price ? Number.parseFloat(event.max_price) : 0
          }

          return {
            id: `ra_${event.event_id || index}`,
            title: event.title || event.name || "Untitled Event",
            description: event.description || "",
            category: event.category || "Event",
            startDate: event.start_time?.split("T")[0] || event.date || "",
            endDate: event.end_time?.split("T")[0],
            startTime: event.start_time?.split("T")[1]?.substring(0, 5) || "TBD",
            endTime: event.end_time?.split("T")[1]?.substring(0, 5),
            venue: {
              name: event.venue_name || event.venue || "TBD",
              address: event.venue_address || event.location || "",
              city: event.city || "",
              state: event.state || "",
              country: event.country || "US",
              lat: eventLat,
              lng: eventLng,
            },
            pricing,
            organizer: {
              name: event.organizer || "Event Organizer",
              verified: false,
            },
            images: event.thumbnail ? [event.thumbnail] : [],
            ticketUrl: event.link,
            website: event.link,
            rating: 3.0 + Math.random() * 2.0, // Simulated rating
            tags: [event.category, event.type].filter(Boolean),
            source: "RapidAPI",
            distance,
            popularity: Math.floor(Math.random() * 300) + 25,
          }
        })
      )

      logger.info(`Successfully fetched ${events.length} events from RapidAPI`, {
        component: "RealTimeEventsAPI",
        action: "fetchRapidAPIEvents",
      })

      return events
    } catch (error) {
      logger.error("Error fetching RapidAPI events", {
        component: "RealTimeEventsAPI",
        action: "fetchRapidAPIEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  async searchEvents(params: LocationSearchParams): Promise<RealTimeEvent[]> {
    logger.info("Starting real-time event search", {
      component: "RealTimeEventsAPI",
      action: "searchEvents",
      metadata: params,
    })

    const allEvents: RealTimeEvent[] = []

    // Fetch from all providers concurrently
    const providers = [
      this.fetchTicketmasterEvents(params),
      this.fetchEventbriteEvents(params),
      this.fetchRapidAPIEvents(params),
    ]

    const results = await Promise.allSettled(providers)

    results.forEach((result, index) => {
      const providerNames = ["Ticketmaster", "Eventbrite", "RapidAPI"]
      if (result.status === "fulfilled") {
        allEvents.push(...result.value)
        logger.info(`${providerNames[index]} provider succeeded`, {
          component: "RealTimeEventsAPI",
          action: "searchEvents",
          metadata: { provider: providerNames[index], count: result.value.length },
        })
      } else {
        logger.warn(`${providerNames[index]} provider failed`, {
          component: "RealTimeEventsAPI",
          action: "searchEvents",
          error: result.reason,
        })
      }
    })

    // Remove duplicates based on title and date
    const uniqueEvents = allEvents.filter(
      (event, index, self) =>
        index ===
        self.findIndex(
          (e) =>
            e.title.toLowerCase() === event.title.toLowerCase() &&
            e.startDate === event.startDate &&
            e.venue.name.toLowerCase() === event.venue.name.toLowerCase(),
        ),
    )

    // Sort by distance, then by date
    uniqueEvents.sort((a, b) => {
      if (a.distance !== b.distance) {
        return (a.distance || 0) - (b.distance || 0)
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })

    logger.info(`Event search completed`, {
      component: "RealTimeEventsAPI",
      action: "searchEvents",
      metadata: {
        totalFound: allEvents.length,
        uniqueEvents: uniqueEvents.length,
        location: `${params.lat}, ${params.lng}`,
        radius: params.radius,
      },
    })

    return uniqueEvents
  }
}

export const realTimeEventsAPI = new RealTimeEventsAPI()
