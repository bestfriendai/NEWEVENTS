import { EventDetailProps } from "@/components/event-detail-modal"
import { logger } from "@/lib/utils/logger"
import { serverEnv } from "@/lib/env"

// RapidAPI Real-Time Events Search service
export class RapidAPIRealtimeEventsService {
  private apiKey: string
  private apiHost = "real-time-events-search.p.rapidapi.com"
  
  constructor() {
    this.apiKey = serverEnv.RAPIDAPI_KEY || ""
  }

  /**
   * Search for events using the Real-Time Events Search API
   */
  async searchEvents(params: {
    query?: string
    location?: string
    coordinates?: { lat: number; lng: number }
    radius?: number
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<EventDetailProps[]> {
    try {
      if (!this.apiKey) {
        logger.warn("RapidAPI key not configured")
        return []
      }

      const totalLimit = params.limit || 50
      const allEvents: EventDetailProps[] = []
      const pageSize = 10 // API seems to return max 10 per request
      const numPages = Math.ceil(totalLimit / pageSize)

      // Make multiple requests to get more events
      for (let page = 0; page < numPages && allEvents.length < totalLimit; page++) {
        const url = new URL(`https://${this.apiHost}/search-events`)
        
        // Add query parameters
        if (params.query) {
          url.searchParams.set("query", params.query)
        }
        
        if (params.location) {
          url.searchParams.set("location", params.location)
        } else if (params.coordinates) {
          url.searchParams.set("location", `${params.coordinates.lat},${params.coordinates.lng}`)
        }
        
        // Use start for pagination
        url.searchParams.set("start", String(page * pageSize))
        url.searchParams.set("limit", String(pageSize))

        logger.debug(`RapidAPI Real-Time Events Search request (page ${page + 1}/${numPages})`, {
          component: "RapidAPIRealtimeEventsService",
          action: "searchEvents",
          metadata: { url: url.toString().replace(this.apiKey, "***"), page }
        })

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": this.apiHost,
          },
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error")
          logger.error(`RapidAPI Real-Time Events error: ${response.status} - ${errorText}`)
          break // Stop pagination on error
        }

        const data = await response.json()
        
        // Check for different response structures
        let events = []
        if (data.data && Array.isArray(data.data)) {
          events = data.data
        } else if (data.results && Array.isArray(data.results)) {
          events = data.results
        } else if (Array.isArray(data)) {
          events = data
        } else {
          logger.warn("Invalid response from RapidAPI Real-Time Events", {
            responseKeys: Object.keys(data || {})
          })
          break
        }

        if (events.length === 0) {
          // No more events available
          break
        }

        logger.info(`RapidAPI Real-Time Events page ${page + 1} returned ${events.length} events`)
        
        // Transform the events to our format
        const transformedEvents = events.map((event: any) => this.transformEvent(event))
        allEvents.push(...transformedEvents)

        // Add a small delay between requests to avoid rate limiting
        if (page < numPages - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      logger.info(`RapidAPI Real-Time Events total: ${allEvents.length} events collected`, {
        firstEventTitle: allEvents[0]?.title || 'N/A',
        lastEventTitle: allEvents[allEvents.length - 1]?.title || 'N/A',
        totalEvents: allEvents.length
      })
      
      return allEvents.slice(0, totalLimit) // Ensure we don't exceed requested limit
    } catch (error) {
      logger.error("RapidAPI Real-Time Events search failed", {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  /**
   * Get event details by ID
   */
  async getEventDetails(eventId: string): Promise<EventDetailProps | null> {
    try {
      if (!this.apiKey) {
        logger.warn("RapidAPI key not configured")
        return null
      }

      const url = new URL(`https://${this.apiHost}/event-details`)
      url.searchParams.set("event_id", eventId)

      logger.debug("Fetching RapidAPI event details", {
        eventId,
        url: url.toString().replace(this.apiKey, "***")
      })

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-rapidapi-key": this.apiKey,
          "x-rapidapi-host": this.apiHost,
        },
      })

      if (!response.ok) {
        logger.error(`RapidAPI Real-Time Events details error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (!data || !data.data) {
        logger.warn("Invalid event details response", {
          hasData: !!data,
          hasDataField: !!data?.data,
          status: data?.status
        })
        return null
      }

      return this.transformEventDetails(data.data)
    } catch (error) {
      logger.error("RapidAPI Real-Time Events details failed", {
        error: error instanceof Error ? error.message : String(error),
        eventId
      })
      return null
    }
  }

  /**
   * Transform detailed event data (has more fields than search results)
   */
  private transformEventDetails(event: any): EventDetailProps {
    // For event details, we have more complete data
    const numericId = event.event_id ? 
      Math.abs(event.event_id.split("").reduce((a: number, b: string) => {
        a = (a << 5) - a + b.charCodeAt(0)
        return a & a
      }, 0)) : 
      Math.floor(Math.random() * 1000000)

    // Parse dates
    let startDate = new Date()
    let formattedDate = "Date TBA"
    let formattedTime = "Time TBA"
    
    if (event.start_time || event.start_time_utc) {
      try {
        startDate = new Date(event.start_time || event.start_time_utc)
        if (!isNaN(startDate.getTime())) {
          formattedDate = startDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          formattedTime = startDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        }
      } catch (e) {
        logger.debug("Failed to parse date", { date: event.start_time })
      }
    }

    // Extract price from ticket links or default
    let price = "Price TBA"
    if (event.is_free === true) {
      price = "Free"
    }

    // Use the high-quality thumbnail
    const image = event.thumbnail || "/community-event.png"

    // Extract venue info
    const venue = event.venue || {}
    const location = venue.name || "Venue TBA"
    const address = venue.full_address || "Address TBA"

    // Extract coordinates
    let coordinates = undefined
    if (venue.latitude && venue.longitude) {
      coordinates = { lat: Number(venue.latitude), lng: Number(venue.longitude) }
    }

    // Extract all ticket links
    const ticketLinks = []
    if (event.ticket_links && Array.isArray(event.ticket_links)) {
      ticketLinks.push(...event.ticket_links.map((link: any) => ({
        source: link.source || "Tickets",
        link: link.link || "#"
      })))
    }
    
    // Add main event link if different
    if (event.link && !ticketLinks.some(tl => tl.link === event.link)) {
      ticketLinks.unshift({
        source: event.publisher || "Event Page",
        link: event.link
      })
    }

    return {
      id: numericId,
      title: event.name || "Untitled Event",
      description: event.description || "No description available.",
      category: event.tags?.[0] || "Event",
      date: formattedDate,
      time: formattedTime,
      location,
      address,
      price,
      image,
      organizer: {
        name: venue.name || event.publisher || "Event Organizer",
        logo: undefined
      },
      attendees: Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates,
      ticketLinks,
      externalId: `rapidapi_realtime_${event.event_id}`
    } as EventDetailProps
  }

  /**
   * Transform RapidAPI event to our EventDetailProps format
   */
  private transformEvent(event: any): EventDetailProps {
    // Generate a numeric ID from the event ID
    const numericId = event.event_id ? 
      Math.abs(event.event_id.split("").reduce((a: number, b: string) => {
        a = (a << 5) - a + b.charCodeAt(0)
        return a & a
      }, 0)) : 
      Math.floor(Math.random() * 1000000)

    // Parse dates - handle different date formats
    let startDate = new Date()
    let formattedDate = "Date TBA"
    let formattedTime = "Time TBA"
    
    if (event.start_time || event.start_time_utc) {
      try {
        startDate = new Date(event.start_time || event.start_time_utc)
        if (!isNaN(startDate.getTime())) {
          formattedDate = startDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          formattedTime = startDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        }
      } catch (e) {
        logger.debug("Failed to parse date", { date: event.start_time })
      }
    }

    // Extract price from various fields
    let price = "Price TBA"
    if (event.is_free === true || event.is_free === "true") {
      price = "Free"
    } else if (event.min_ticket_price && event.max_ticket_price) {
      if (event.min_ticket_price === event.max_ticket_price) {
        price = `$${event.min_ticket_price}`
      } else {
        price = `$${event.min_ticket_price} - $${event.max_ticket_price}`
      }
    } else if (event.min_ticket_price) {
      price = `From $${event.min_ticket_price}`
    } else if (event.price) {
      price = event.price
    }

    // Extract image - check for valid image URL
    let image = "/community-event.png"
    const possibleImages = [
      event.thumbnail,
      event.image,
      event.images?.[0]?.url,
      event.images?.[0],
      event.logo,
      event.venue?.image
    ]
    
    for (const img of possibleImages) {
      if (img && typeof img === 'string' && img.startsWith('http')) {
        image = img
        break
      }
    }

    // Extract venue info
    const venue = event.venue || {}
    const location = venue.name || event.location || event.venue_name || "Venue TBA"
    const address = venue.full_address || 
                    venue.address || 
                    event.address || 
                    event.venue_address ||
                    "Address TBA"

    // Extract coordinates
    let coordinates = undefined
    if (venue.latitude && venue.longitude) {
      coordinates = { lat: Number(venue.latitude), lng: Number(venue.longitude) }
    } else if (venue.lat && venue.lng) {
      coordinates = { lat: Number(venue.lat), lng: Number(venue.lng) }
    } else if (event.latitude && event.longitude) {
      coordinates = { lat: Number(event.latitude), lng: Number(event.longitude) }
    } else if (event.lat && event.lng) {
      coordinates = { lat: Number(event.lat), lng: Number(event.lng) }
    }

    // Extract ticket links
    const ticketLinks = []
    
    // Add main event link
    if (event.link) {
      ticketLinks.push({
        source: event.publisher || "Event Website",
        link: event.link
      })
    }
    
    // Add ticket links array
    if (event.ticket_links && Array.isArray(event.ticket_links)) {
      ticketLinks.push(...event.ticket_links.map((link: any) => ({
        source: link.source || "Tickets",
        link: link.link || "#"
      })))
    }

    // Use description or fallback
    const description = event.description || 
                       event.summary || 
                       event.details || 
                       "No description available."

    return {
      id: numericId,
      title: event.name || event.title || "Untitled Event",
      description,
      category: event.category || event.labels?.[0] || "Event",
      date: formattedDate,
      time: formattedTime,
      location,
      address,
      price,
      image,
      organizer: {
        name: event.organizer || event.publisher || venue.name || "Event Organizer",
        logo: event.organizer_logo || undefined
      },
      attendees: event.attendee_count || event.phq_attendance || Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates,
      ticketLinks,
      externalId: `rapidapi_realtime_${event.event_id || numericId}`
    } as EventDetailProps
  }
}

// Export singleton instance
export const rapidAPIRealtimeEventsService = new RapidAPIRealtimeEventsService()