import { logger } from "@/lib/utils/logger"
import { serverEnv } from "@/lib/env"

export interface RealEvent {
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

export interface RealLocationSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
}

class RealAPIEventsService {
  private readonly ticketmasterApiKey = serverEnv.TICKETMASTER_API_KEY
  private readonly eventbriteApiKey = serverEnv.EVENTBRITE_API_KEY
  private readonly predictHQApiKey = serverEnv.PREDICTHQ_API_KEY

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLng = (lng2 - lng1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private async fetchTicketmasterEvents(params: RealLocationSearchParams): Promise<RealEvent[]> {
    if (!this.ticketmasterApiKey) {
      logger.warn("Ticketmaster API key not found")
      return []
    }

    try {
      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json")
      url.searchParams.set("apikey", this.ticketmasterApiKey)
      url.searchParams.set("geoPoint", `${params.lat},${params.lng}`) // Updated from latlong to geoPoint
      url.searchParams.set("radius", params.radius.toString())
      url.searchParams.set("unit", "miles")
      url.searchParams.set("size", "50")
      url.searchParams.set("sort", "distance,asc")

      if (params.keyword) {
        url.searchParams.set("keyword", params.keyword)
      }

      if (params.category && params.category !== "all") {
        const categoryMap: Record<string, string> = {
          Music: "KZFzniwnSyZfZ7v7nJ",
          Sports: "KZFzniwnSyZfZ7v7nE",
          Arts: "KZFzniwnSyZfZ7v7na",
          Comedy: "KZFzniwnSyZfZ7v7nJ",
          Family: "KZFzniwnSyZfZ7v7nF",
          Business: "KZFzniwnSyZfZ7v7n1",
        }
        if (categoryMap[params.category]) {
          url.searchParams.set("classificationId", categoryMap[params.category])
        }
      }

      logger.info("Fetching Ticketmaster events", {
        component: "RealAPIEventsService",
        action: "fetchTicketmasterEvents",
        metadata: { url: url.toString() },
      })

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`)
      }

      const data = await response.json()
      const events: RealEvent[] = []

      if (data._embedded?.events) {
        for (const event of data._embedded.events) {
          try {
            const venue = event._embedded?.venues?.[0]
            if (!venue?.location) continue

            const startDateTime = new Date(event.dates.start.dateTime || event.dates.start.localDate)
            const endDateTime = event.dates.end?.dateTime ? new Date(event.dates.end.dateTime) : undefined

            const pricing = event.priceRanges?.[0] || { min: 0, max: 0, currency: "USD" }
            const isFree = pricing.min === 0 && pricing.max === 0

            const realEvent: RealEvent = {
              id: `tm_${event.id}`,
              title: event.name,
              description: event.info || event.pleaseNote || "No description available",
              category: this.mapTicketmasterCategory(event.classifications?.[0]?.segment?.name || "Other"),
              startDate: startDateTime.toISOString().split("T")[0],
              endDate: endDateTime?.toISOString().split("T")[0],
              startTime: startDateTime.toTimeString().slice(0, 5),
              endTime: endDateTime?.toTimeString().slice(0, 5),
              venue: {
                name: venue.name,
                address: venue.address?.line1 || "",
                city: venue.city?.name || "",
                state: venue.state?.stateCode || "",
                country: venue.country?.countryCode || "US",
                lat: Number.parseFloat(venue.location.latitude),
                lng: Number.parseFloat(venue.location.longitude),
              },
              pricing: {
                min: pricing.min || 0,
                max: pricing.max || pricing.min || 0,
                currency: pricing.currency || "USD",
                isFree,
              },
              organizer: {
                name: event.promoter?.name || "Ticketmaster",
                verified: true,
              },
              images: event.images?.map((img: any) => img.url) || [],
              ticketUrl: event.url,
              website: event.url,
              rating: Math.random() * 2 + 3,
              tags: [
                ...(event.classifications?.map((c: any) => c.genre?.name).filter(Boolean) || []),
                ...(event.classifications?.map((c: any) => c.subGenre?.name).filter(Boolean) || []),
              ],
              source: "Ticketmaster",
              distance: this.calculateDistance(
                params.lat,
                params.lng,
                Number.parseFloat(venue.location.latitude),
                Number.parseFloat(venue.location.longitude),
              ),
              popularity: Math.floor(Math.random() * 1000) + 100,
            }

            events.push(realEvent)
          } catch (error) {
            logger.error("Error processing Ticketmaster event", {
              component: "RealAPIEventsService",
              action: "fetchTicketmasterEvents",
              error: error instanceof Error ? error.message : String(error),
              metadata: { eventId: event.id },
            })
          }
        }
      }

      logger.info("Ticketmaster events fetched successfully", {
        component: "RealAPIEventsService",
        action: "fetchTicketmasterEvents",
        metadata: { eventsCount: events.length },
      })

      return events
    } catch (error) {
      logger.error("Failed to fetch Ticketmaster events", {
        component: "RealAPIEventsService",
        action: "fetchTicketmasterEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  private async fetchEventbriteEvents(params: RealLocationSearchParams): Promise<RealEvent[]> {
    if (!this.eventbriteApiKey) {
      logger.warn("Eventbrite API key not found")
      return []
    }

    try {
      const url = new URL("https://www.eventbriteapi.com/v3/events/search/")
      url.searchParams.set("location.latitude", params.lat.toString())
      url.searchParams.set("location.longitude", params.lng.toString())
      url.searchParams.set("location.within", `${params.radius}mi`)
      url.searchParams.set("expand", "venue,organizer,ticket_availability")
      url.searchParams.set("sort_by", "distance")

      if (params.keyword) {
        url.searchParams.set("q", params.keyword)
      }

      if (params.category && params.category !== "all") {
        const categoryMap: Record<string, string> = {
          Music: "103",
          Sports: "108",
          Arts: "105",
          Comedy: "103",
          Family: "115",
          Business: "101",
        }
        if (categoryMap[params.category]) {
          url.searchParams.set("categories", categoryMap[params.category])
        }
      }

      logger.info("Fetching Eventbrite events", {
        component: "RealAPIEventsService",
        action: "fetchEventbriteEvents",
        metadata: { url: url.toString() },
      })

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.eventbriteApiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`)
      }

      const data = await response.json()
      const events: RealEvent[] = []

      if (data.events) {
        for (const event of data.events) {
          try {
            const venue = event.venue
            if (!venue?.latitude || !venue?.longitude) continue

            const startDateTime = new Date(event.start.utc)
            const endDateTime = event.end?.utc ? new Date(event.end.utc) : undefined

            const isFree = event.is_free || false
            const ticketClasses = event.ticket_availability?.ticket_classes || []
            const pricing = ticketClasses.length > 0 ? ticketClasses[0] : { cost: { major_value: 0 } }

            const realEvent: RealEvent = {
              id: `eb_${event.id}`,
              title: event.name.text,
              description: event.description?.text || "No description available",
              category: this.mapEventbriteCategory(event.category?.name || "Other"),
              startDate: startDateTime.toISOString().split("T")[0],
              endDate: endDateTime?.toISOString().split("T")[0],
              startTime: startDateTime.toTimeString().slice(0, 5),
              endTime: endDateTime?.toTimeString().slice(0, 5),
              venue: {
                name: venue.name || "TBD",
                address: venue.address?.localized_address_display || "",
                city: venue.address?.city || "",
                state: venue.address?.region || "",
                country: venue.address?.country || "US",
                lat: Number.parseFloat(venue.latitude),
                lng: Number.parseFloat(venue.longitude),
              },
              pricing: {
                min: pricing.cost?.major_value || 0,
                max: pricing.cost?.major_value || 0,
                currency: pricing.cost?.currency || "USD",
                isFree,
              },
              organizer: {
                name: event.organizer?.name || "Eventbrite",
                verified: event.organizer?.verified || false,
              },
              images: event.logo?.url ? [event.logo.url] : [],
              ticketUrl: event.url,
              website: event.url,
              rating: Math.random() * 2 + 3,
              tags: event.tags?.map((tag: any) => tag.display_name) || [],
              source: "Eventbrite",
              distance: this.calculateDistance(
                params.lat,
                params.lng,
                Number.parseFloat(venue.latitude),
                Number.parseFloat(venue.longitude),
              ),
              popularity: Math.floor(Math.random() * 800) + 50,
            }

            events.push(realEvent)
          } catch (error) {
            logger.error("Error processing Eventbrite event", {
              component: "RealAPIEventsService",
              action: "fetchEventbriteEvents",
              error: error instanceof Error ? error.message : String(error),
              metadata: { eventId: event.id },
            })
          }
        }
      }

      logger.info("Eventbrite events fetched successfully", {
        component: "RealAPIEventsService",
        action: "fetchEventbriteEvents",
        metadata: { eventsCount: events.length },
      })

      return events
    } catch (error) {
      logger.error("Failed to fetch Eventbrite events", {
        component: "RealAPIEventsService",
        action: "fetchEventbriteEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  private async fetchPredictHQEvents(params: RealLocationSearchParams): Promise<RealEvent[]> {
    if (!this.predictHQApiKey) {
      logger.warn("PredictHQ API key not found")
      return []
    }

    try {
      const url = new URL("https://api.predicthq.com/v1/events/")
      url.searchParams.set("location", `${params.lat},${params.lng}`)
      url.searchParams.set("within", `${params.radius}mi`)
      url.searchParams.set("limit", "50")
      url.searchParams.set("sort", "rank")

      if (params.category && params.category !== "all") {
        const categoryMap: Record<string, string> = {
          Music: "concerts",
          Sports: "sports",
          Arts: "performing-arts",
          Comedy: "performing-arts",
          Family: "community",
          Business: "conferences",
        }
        if (categoryMap[params.category]) {
          url.searchParams.set("category", categoryMap[params.category])
        }
      }

      logger.info("Fetching PredictHQ events", {
        component: "RealAPIEventsService",
        action: "fetchPredictHQEvents",
        metadata: { url: url.toString() },
      })

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.predictHQApiKey}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`PredictHQ API error: ${response.status}`)
      }

      const data = await response.json()
      const events: RealEvent[] = []

      if (data.results) {
        for (const event of data.results) {
          try {
            const startDateTime = new Date(event.start)
            const endDateTime = event.end ? new Date(event.end) : undefined

            const realEvent: RealEvent = {
              id: `phq_${event.id}`,
              title: event.title,
              description: event.description || "No description available",
              category: this.mapPredictHQCategory(event.category),
              startDate: startDateTime.toISOString().split("T")[0],
              endDate: endDateTime?.toISOString().split("T")[0],
              startTime: startDateTime.toTimeString().slice(0, 5),
              endTime: endDateTime?.toTimeString().slice(0, 5),
              venue: {
                name: event.entities?.[0]?.name || "TBD",
                address: event.location?.[0] || "",
                city: event.location?.[1] || "",
                state: event.location?.[2] || "",
                country: event.country || "US",
                lat: event.geo?.[1] || params.lat,
                lng: event.geo?.[0] || params.lng,
              },
              pricing: {
                min: 0,
                max: 0,
                currency: "USD",
                isFree: true,
              },
              organizer: {
                name: "PredictHQ",
                verified: true,
              },
              images: [],
              rating: Math.random() * 2 + 3,
              tags: event.labels || [],
              source: "PredictHQ",
              distance: this.calculateDistance(
                params.lat,
                params.lng,
                event.geo?.[1] || params.lat,
                event.geo?.[0] || params.lng,
              ),
              popularity: event.rank || Math.floor(Math.random() * 600) + 100,
            }

            events.push(realEvent)
          } catch (error) {
            logger.error("Error processing PredictHQ event", {
              component: "RealAPIEventsService",
              action: "fetchPredictHQEvents",
              error: error instanceof Error ? error.message : String(error),
              metadata: { eventId: event.id },
            })
          }
        }
      }

      logger.info("PredictHQ events fetched successfully", {
        component: "RealAPIEventsService",
        action: "fetchPredictHQEvents",
        metadata: { eventsCount: events.length },
      })

      return events
    } catch (error) {
      logger.error("Failed to fetch PredictHQ events", {
        component: "RealAPIEventsService",
        action: "fetchPredictHQEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  private mapTicketmasterCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      Music: "Music",
      Sports: "Sports",
      "Arts & Theatre": "Arts",
      Comedy: "Comedy",
      Family: "Family",
      Miscellaneous: "Other",
    }
    return categoryMap[category] || "Other"
  }

  private mapEventbriteCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      "Music & Audio": "Music",
      "Sports & Fitness": "Sports",
      "Performing & Visual Arts": "Arts",
      Comedy: "Comedy",
      "Family & Education": "Family",
      "Business & Professional": "Business",
    }
    return categoryMap[category] || "Other"
  }

  private mapPredictHQCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      concerts: "Music",
      sports: "Sports",
      "performing-arts": "Arts",
      community: "Family",
      conferences: "Business",
    }
    return categoryMap[category] || "Other"
  }

  async searchEvents(params: RealLocationSearchParams): Promise<RealEvent[]> {
    try {
      logger.info("Starting multi-source event search", {
        component: "RealAPIEventsService",
        action: "searchEvents",
        metadata: params,
      })

      // Fetch from all sources in parallel
      const [ticketmasterEvents, eventbriteEvents, predictHQEvents] = await Promise.allSettled([
        this.fetchTicketmasterEvents(params),
        this.fetchEventbriteEvents(params),
        this.fetchPredictHQEvents(params),
      ])

      const allEvents: RealEvent[] = []

      // Collect successful results
      if (ticketmasterEvents.status === "fulfilled") {
        allEvents.push(...ticketmasterEvents.value)
      } else {
        logger.error("Ticketmaster fetch failed", {
          component: "RealAPIEventsService",
          action: "searchEvents",
          error: ticketmasterEvents.reason,
        })
      }

      if (eventbriteEvents.status === "fulfilled") {
        allEvents.push(...eventbriteEvents.value)
      } else {
        logger.error("Eventbrite fetch failed", {
          component: "RealAPIEventsService",
          action: "searchEvents",
          error: eventbriteEvents.reason,
        })
      }

      if (predictHQEvents.status === "fulfilled") {
        allEvents.push(...predictHQEvents.value)
      } else {
        logger.error("PredictHQ fetch failed", {
          component: "RealAPIEventsService",
          action: "searchEvents",
          error: predictHQEvents.reason,
        })
      }

      // Remove duplicates based on title and venue
      const uniqueEvents = allEvents.filter(
        (event, index, self) =>
          index ===
          self.findIndex(
            (e) =>
              e.title.toLowerCase() === event.title.toLowerCase() &&
              e.venue.name.toLowerCase() === event.venue.name.toLowerCase(),
          ),
      )

      // Sort by distance
      uniqueEvents.sort((a, b) => (a.distance || 0) - (b.distance || 0))

      // Apply limit
      const finalEvents = uniqueEvents.slice(0, params.limit || 50)

      logger.info("Multi-source event search completed", {
        component: "RealAPIEventsService",
        action: "searchEvents",
        metadata: {
          totalEvents: finalEvents.length,
          ticketmaster: ticketmasterEvents.status === "fulfilled" ? ticketmasterEvents.value.length : 0,
          eventbrite: eventbriteEvents.status === "fulfilled" ? eventbriteEvents.value.length : 0,
          predictHQ: predictHQEvents.status === "fulfilled" ? predictHQEvents.value.length : 0,
        },
      })

      return finalEvents
    } catch (error) {
      logger.error("Event search failed", {
        component: "RealAPIEventsService",
        action: "searchEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

export const realAPIEventsService = new RealAPIEventsService()
