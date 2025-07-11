import { API_CONFIG } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import type { Event, EventSearchParams } from "@/types/event.types";
import type { EventDetailProps as EventDetail } from "@/components/event-detail-modal";

// Removed local EventSearchParams, using imported one

interface EventsResponse {
  events: EventDetail[]
  totalCount: number
  hasMore: boolean
}

class RealEventsAPI {
  private async fetchFromTicketmaster(params: EventSearchParams): Promise<EventsResponse> {
    try {
      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json")
      url.searchParams.set("apikey", API_CONFIG.ticketmaster.apiKey)
      url.searchParams.set("size", String(params.limit || 20))
      url.searchParams.set("page", String(params.page || 0))

      if (params.keyword) {
        url.searchParams.set("keyword", params.keyword)
      }

      if (params.location) {
        url.searchParams.set("city", params.location)
      }

      if (params.startDate) {
        url.searchParams.set("startDateTime", params.startDate)
      }

      if (params.endDate) {
        url.searchParams.set("endDateTime", params.endDate)
      }

      if (params.categories && params.categories.length > 0) {
        url.searchParams.set("classificationName", params.categories.join(","))
      }

      logger.info("Fetching events from Ticketmaster", {
        component: "RealEventsAPI",
        action: "fetchFromTicketmaster",
        metadata: { url: url.toString() },
      })

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`)
      }

      const data = await response.json()

      const events: EventDetail[] =
        data._embedded?.events?.map((event: any) => ({
          id: event.id,
          external_id: event.id,
          title: event.name,
          description: event.info || event.pleaseNote || "",
          category: event.classifications?.[0]?.segment?.name || "Entertainment",
          start_date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
          end_date: event.dates?.end?.dateTime || event.dates?.end?.localDate,
          location_name: event._embedded?.venues?.[0]?.name || "",
          location_address: `${event._embedded?.venues?.[0]?.address?.line1 || ""} ${event._embedded?.venues?.[0]?.city?.name || ""}`,
          location_lat: Number.parseFloat(event._embedded?.venues?.[0]?.location?.latitude || "0"),
          location_lng: Number.parseFloat(event._embedded?.venues?.[0]?.location?.longitude || "0"),
          price_min: event.priceRanges?.[0]?.min || 0,
          price_max: event.priceRanges?.[0]?.max || 0,
          price_currency: event.priceRanges?.[0]?.currency || "USD",
          image_url: event.images?.[0]?.url || "",
          organizer_name: event.promoter?.name || "",
          ticket_links: [{ url: event.url, provider: "Ticketmaster" }],
          source_provider: "ticketmaster",
          source_data: event,
          popularity_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        })) || []

      return {
        events,
        totalCount: data.page?.totalElements || events.length,
        hasMore: (data.page?.number || 0) < (data.page?.totalPages || 1) - 1,
      }
    } catch (error) {
      logger.error("Error fetching from Ticketmaster", {
        component: "RealEventsAPI",
        action: "fetchFromTicketmaster",
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private async fetchFromEventbrite(params: EventSearchParams): Promise<EventsResponse> {
    try {
      const url = new URL("https://www.eventbriteapi.com/v3/events/search/")

      const headers = {
        Authorization: `Bearer ${API_CONFIG.eventbrite.privateToken}`,
        "Content-Type": "application/json",
      }

      if (params.keyword) {
        url.searchParams.set("q", params.keyword)
      }

      if (params.location) {
        url.searchParams.set("location.address", params.location)
      }

      if (params.startDate) {
        url.searchParams.set("start_date.range_start", params.startDate)
      }

      if (params.endDate) {
        url.searchParams.set("start_date.range_end", params.endDate)
      }

      url.searchParams.set("expand", "venue,organizer,ticket_availability")
      url.searchParams.set("page_size", String(params.limit || 20))

      logger.info("Fetching events from Eventbrite", {
        component: "RealEventsAPI",
        action: "fetchFromEventbrite",
        metadata: { url: url.toString() },
      })

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`)
      }

      const data = await response.json()

      const events: EventDetail[] =
        data.events?.map((event: any) => ({
          id: event.id,
          external_id: event.id,
          title: event.name?.text || "",
          description: event.description?.text || "",
          category: event.category?.name || "Event",
          start_date: event.start?.utc,
          end_date: event.end?.utc,
          location_name: event.venue?.name || "",
          location_address: `${event.venue?.address?.address_1 || ""} ${event.venue?.address?.city || ""}`,
          location_lat: Number.parseFloat(event.venue?.latitude || "0"),
          location_lng: Number.parseFloat(event.venue?.longitude || "0"),
          price_min: 0, // Eventbrite doesn't provide price in search
          price_max: 0,
          price_currency: "USD",
          image_url: event.logo?.url || "",
          organizer_name: event.organizer?.name || "",
          ticket_links: [{ url: event.url, provider: "Eventbrite" }],
          source_provider: "eventbrite",
          source_data: event,
          popularity_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        })) || []

      return {
        events,
        totalCount: data.pagination?.object_count || events.length,
        hasMore: data.pagination?.has_more_items || false,
      }
    } catch (error) {
      logger.error("Error fetching from Eventbrite", {
        component: "RealEventsAPI",
        action: "fetchFromEventbrite",
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private async fetchFromRapidAPI(params: EventSearchParams): Promise<EventsResponse> {
    try {
      const url = new URL("https://real-time-events-search.p.rapidapi.com/search-events")

      if (params.keyword) {
        url.searchParams.set("query", params.keyword)
      }

      if (params.location) {
        url.searchParams.set("location", params.location)
      }

      if (params.startDate) {
        url.searchParams.set("start_date", params.startDate.split("T")[0])
      }

      url.searchParams.set("limit", String(params.limit || 20))

      const headers = {
        "X-RapidAPI-Key": API_CONFIG.rapidapi.key,
        "X-RapidAPI-Host": API_CONFIG.rapidapi.host,
      }

      logger.info("Fetching events from RapidAPI", {
        component: "RealEventsAPI",
        action: "fetchFromRapidAPI",
        metadata: { url: url.toString() },
      })

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        throw new Error(`RapidAPI error: ${response.status}`)
      }

      const data = await response.json()

      const events: EventDetail[] =
        data.data?.map((event: any, index: number) => ({
          id: `rapid_${index}_${Date.now()}`,
          external_id: event.event_id || `rapid_${index}`,
          title: event.title || event.name || "",
          description: event.description || "",
          category: event.category || "Event",
          start_date: event.start_time || event.date,
          end_date: event.end_time,
          location_name: event.venue_name || event.venue || "",
          location_address: event.venue_address || event.location || "",
          location_lat: Number.parseFloat(event.latitude || "0"),
          location_lng: Number.parseFloat(event.longitude || "0"),
          price_min: Number.parseFloat(event.min_price || "0"),
          price_max: Number.parseFloat(event.max_price || "0"),
          price_currency: "USD",
          image_url: event.thumbnail || event.image || "",
          organizer_name: event.organizer || "",
          ticket_links: event.link ? [{ url: event.link, provider: "External" }] : [],
          source_provider: "rapidapi",
          source_data: event,
          popularity_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        })) || []

      return {
        events,
        totalCount: data.total || events.length,
        hasMore: false,
      }
    } catch (error) {
      logger.error("Error fetching from RapidAPI", {
        component: "RealEventsAPI",
        action: "fetchFromRapidAPI",
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async searchEvents(params: EventSearchParams): Promise<EventsResponse> {
    const results: EventDetail[] = []
    let totalCount = 0
    let hasMore = false

    // Try multiple providers and combine results
    const providers = [
      { name: "ticketmaster", fetch: () => this.fetchFromTicketmaster(params) },
      { name: "eventbrite", fetch: () => this.fetchFromEventbrite(params) },
      { name: "rapidapi", fetch: () => this.fetchFromRapidAPI(params) },
    ]

    for (const provider of providers) {
      try {
        const response = await provider.fetch()
        results.push(...response.events)
        totalCount += response.totalCount
        hasMore = hasMore || response.hasMore

        logger.info(`Successfully fetched ${response.events.length} events from ${provider.name}`, {
          component: "RealEventsAPI",
          action: "searchEvents",
          metadata: { provider: provider.name, count: response.events.length },
        })
      } catch (error) {
        logger.warn(`Failed to fetch from ${provider.name}`, {
          component: "RealEventsAPI",
          action: "searchEvents",
          error: error instanceof Error ? error.message : String(error),
          metadata: { provider: provider.name },
        })
        // Continue with other providers
      }
    }

    // Deduplicate events by their 'id' to prevent React key errors
    const eventMap: { [id: number]: EventDetail } = {};
    for (const event of results) {
      if (event.id !== undefined && !eventMap[event.id]) {
        eventMap[event.id] = event;
      } else if (event.id === undefined) {
        logger.warn('Event found with undefined ID in RealEventsAPI.searchEvents', { eventData: event });
      } else {
        // Optionally log that a duplicate ID was found and skipped if that's useful information
        // logger.info(`Duplicate event ID ${event.id} found and skipped in RealEventsAPI.searchEvents.`, { existing: eventMap[event.id], newEvent: event });
      }
    }
    const uniqueEventsById: EventDetail[] = Object.values(eventMap);

    // Sort by date (applied to the ID-deduplicated list)
    uniqueEventsById.sort((a, b) => {
      // EventDetailProps uses 'date' (string) and 'time' (string)
      // Combining date and time for more precise sorting if time is available, otherwise just date.
      const dateTimeStrA = a.time ? `${a.date} ${a.time}` : a.date;
      const dateTimeStrB = b.time ? `${b.date} ${b.time}` : b.date;

      const dateA = dateTimeStrA ? new Date(dateTimeStrA).getTime() : 0;
      const dateB = dateTimeStrB ? new Date(dateTimeStrB).getTime() : 0;
      
      // Handle cases where dates might be invalid or missing
      if (dateA === 0 && dateB === 0) return 0;
      if (dateA === 0) return 1; // Put events with no/invalid date at the end
      if (dateB === 0) return -1; // Put events with no/invalid date at the end
      return dateA - dateB;
    });

    // The original totalCount might be misleading after ID-based deduplication.
    // If an accurate count of unique events is needed, it should be uniqueEventsById.length.
    // For now, we'll return the original totalCount, but this might need review based on product requirements.
    return {
      events: uniqueEventsById,
      totalCount: uniqueEventsById.length, // Reflecting the count of truly unique events after ID deduplication
      hasMore,
    };
  }
}

export const realEventsAPI = new RealEventsAPI()
