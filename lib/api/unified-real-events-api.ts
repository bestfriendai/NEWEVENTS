import { API_CONFIG } from "@/lib/env"
import { logger } from "@/lib/utils/logger"
import { getSupabaseApiConfig } from "./supabase-env-config"
import type { Event, EventSearchParams } from "@/types/event.types"

interface EventsResponse {
  events: Event[]
  totalCount: number
  hasMore: boolean
}

interface TicketmasterEvent {
  id: string
  name: string
  info?: string
  pleaseNote?: string
  classifications?: Array<{ segment?: { name?: string } }>
  dates?: {
    start?: { dateTime?: string; localDate?: string }
    end?: { dateTime?: string; localDate?: string }
  }
  _embedded?: {
    venues?: Array<{
      name?: string
      address?: { line1?: string }
      city?: { name?: string }
      location?: { latitude?: string; longitude?: string }
    }>
  }
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>
  images?: Array<{ url?: string }>
  promoter?: { name?: string }
  url?: string
}

interface EventbriteEvent {
  id: string
  name?: { text?: string }
  description?: { text?: string }
  category?: { name?: string }
  start?: { utc?: string }
  end?: { utc?: string }
  venue?: {
    name?: string
    address?: { address_1?: string; city?: string }
    latitude?: string
    longitude?: string
  }
  logo?: { url?: string }
  organizer?: { name?: string }
  url?: string
}

interface RapidAPIEvent {
  event_id?: string
  title?: string
  name?: string
  description?: string
  category?: string
  start_time?: string
  end_time?: string
  date?: string
  venue_name?: string
  venue?: string
  venue_address?: string
  location?: string
  latitude?: string
  longitude?: string
  min_price?: string
  max_price?: string
  thumbnail?: string
  image?: string
  organizer?: string
  link?: string
}

class UnifiedRealEventsAPI {
  private apiConfig: any = null
  private configPromise: Promise<any> | null = null

  private async getApiConfig() {
    if (this.apiConfig) {
      return this.apiConfig
    }

    if (!this.configPromise) {
      this.configPromise = this.loadApiConfig()
    }

    return await this.configPromise
  }

  private async loadApiConfig() {
    try {
      const supabaseConfig = await getSupabaseApiConfig()
      
      // Merge Supabase config with local config, prioritizing Supabase values
      this.apiConfig = {
        ticketmaster: {
          apiKey: supabaseConfig.TICKETMASTER_API_KEY || API_CONFIG.ticketmaster.apiKey
        },
        eventbrite: {
          privateToken: supabaseConfig.EVENTBRITE_PRIVATE_TOKEN || API_CONFIG.eventbrite.privateToken
        },
        rapidapi: {
          key: supabaseConfig.RAPIDAPI_KEY || API_CONFIG.rapidapi.key,
          host: API_CONFIG.rapidapi.host
        }
      }

      logger.info("API configuration loaded from Supabase", {
        component: "UnifiedRealEventsAPI",
        action: "loadApiConfig",
        metadata: {
          hasTicketmaster: !!this.apiConfig.ticketmaster.apiKey,
          hasEventbrite: !!this.apiConfig.eventbrite.privateToken,
          hasRapidAPI: !!this.apiConfig.rapidapi.key
        }
      })

      return this.apiConfig
    } catch (error) {
      logger.error("Failed to load API config from Supabase, falling back to local config", {
        component: "UnifiedRealEventsAPI",
        action: "loadApiConfig",
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Fallback to local configuration
      this.apiConfig = API_CONFIG
      return this.apiConfig
    }
  }

  private async fetchFromTicketmaster(params: EventSearchParams): Promise<EventsResponse> {
    try {
      const config = await this.getApiConfig()
      
      if (!config.ticketmaster.apiKey || config.ticketmaster.apiKey.includes('your-')) {
        logger.warn("Ticketmaster API key not configured", {
          component: "UnifiedRealEventsAPI",
          action: "fetchFromTicketmaster"
        })
        return { events: [], totalCount: 0, hasMore: false }
      }

      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json")
      url.searchParams.set("apikey", config.ticketmaster.apiKey)
      url.searchParams.set("size", String(params.limit || 50))
      url.searchParams.set("page", String(params.page || 0))

      if (params.keyword || params.query) {
        url.searchParams.set("keyword", params.keyword || params.query || "")
      }

      if (params.location) {
        url.searchParams.set("city", params.location)
      }

      if (params.lat && params.lng) {
        url.searchParams.set("latlong", `${params.lat},${params.lng}`)
        if (params.radius) {
          url.searchParams.set("radius", String(params.radius))
        }
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

      // Add specific categories for party events
      if (params.categories && params.categories.length > 0) {
        url.searchParams.set("classificationName", params.categories.join(","))
      }

      logger.info("Fetching events from Ticketmaster", {
        component: "UnifiedRealEventsAPI",
        action: "fetchFromTicketmaster",
        metadata: { url: url.toString().replace(config.ticketmaster.apiKey, "***") }
      })

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const events: Event[] = data._embedded?.events?.map((event: TicketmasterEvent) => ({
        id: `tm_${event.id}`,
        title: event.name || "",
        description: event.info || event.pleaseNote || "",
        date: event.dates?.start?.dateTime || event.dates?.start?.localDate || "",
        location: {
          name: event._embedded?.venues?.[0]?.name || "",
          address: event._embedded?.venues?.[0]?.address?.line1 || "",
          city: event._embedded?.venues?.[0]?.city?.name || "",
          coordinates: {
            lat: parseFloat(event._embedded?.venues?.[0]?.location?.latitude || "0"),
            lng: parseFloat(event._embedded?.venues?.[0]?.location?.longitude || "0")
          }
        },
        category: event.classifications?.[0]?.segment?.name || "Entertainment",
        price: event.priceRanges?.[0] ? {
          min: event.priceRanges[0].min || 0,
          max: event.priceRanges[0].max,
          currency: event.priceRanges[0].currency || "USD"
        } : undefined,
        image: event.images?.[0]?.url || "",
        url: event.url || "",
        source: "ticketmaster",
        tags: [event.classifications?.[0]?.segment?.name?.toLowerCase() || "entertainment"],
        latitude: parseFloat(event._embedded?.venues?.[0]?.location?.latitude || "0"),
        longitude: parseFloat(event._embedded?.venues?.[0]?.location?.longitude || "0"),
        rating: Math.random() * 1 + 4 // Mock rating between 4-5
      })) || []

      return {
        events,
        totalCount: data.page?.totalElements || events.length,
        hasMore: (data.page?.number || 0) < (data.page?.totalPages || 1) - 1
      }
    } catch (error) {
      logger.error("Error fetching from Ticketmaster", {
        component: "UnifiedRealEventsAPI",
        action: "fetchFromTicketmaster",
        error: error instanceof Error ? error.message : String(error)
      })
      return { events: [], totalCount: 0, hasMore: false }
    }
  }

  private async fetchFromEventbrite(params: EventSearchParams): Promise<EventsResponse> {
    try {
      const config = await this.getApiConfig()
      
      if (!config.eventbrite.privateToken || config.eventbrite.privateToken.includes('your-')) {
        logger.warn("Eventbrite API key not configured", {
          component: "UnifiedRealEventsAPI",
          action: "fetchFromEventbrite"
        })
        return { events: [], totalCount: 0, hasMore: false }
      }

      const url = new URL("https://www.eventbriteapi.com/v3/events/search/")

      const headers = {
        Authorization: `Bearer ${config.eventbrite.privateToken}`,
        "Content-Type": "application/json"
      }

      if (params.keyword || params.query) {
        url.searchParams.set("q", params.keyword || params.query || "")
      }

      if (params.location) {
        url.searchParams.set("location.address", params.location)
      }

      if (params.lat && params.lng) {
        url.searchParams.set("location.latitude", String(params.lat))
        url.searchParams.set("location.longitude", String(params.lng))
        if (params.radius) {
          url.searchParams.set("location.within", `${params.radius}mi`)
        }
      }

      if (params.startDate) {
        url.searchParams.set("start_date.range_start", params.startDate)
      }

      if (params.endDate) {
        url.searchParams.set("start_date.range_end", params.endDate)
      }

      url.searchParams.set("expand", "venue,organizer,ticket_availability")
      url.searchParams.set("page_size", String(params.limit || 50))

      logger.info("Fetching events from Eventbrite", {
        component: "UnifiedRealEventsAPI",
        action: "fetchFromEventbrite",
        metadata: { url: url.toString() }
      })

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const events: Event[] = data.events?.map((event: EventbriteEvent) => ({
        id: `eb_${event.id}`,
        title: event.name?.text || "",
        description: event.description?.text || "",
        date: event.start?.utc || "",
        location: {
          name: event.venue?.name || "",
          address: event.venue?.address?.address_1 || "",
          city: event.venue?.address?.city || "",
          coordinates: {
            lat: parseFloat(event.venue?.latitude || "0"),
            lng: parseFloat(event.venue?.longitude || "0")
          }
        },
        category: event.category?.name || "Event",
        image: event.logo?.url || "",
        url: event.url || "",
        source: "eventbrite",
        tags: [event.category?.name?.toLowerCase() || "event"],
        latitude: parseFloat(event.venue?.latitude || "0"),
        longitude: parseFloat(event.venue?.longitude || "0"),
        rating: Math.random() * 1 + 4 // Mock rating between 4-5
      })) || []

      return {
        events,
        totalCount: data.pagination?.object_count || events.length,
        hasMore: data.pagination?.has_more_items || false
      }
    } catch (error) {
      logger.error("Error fetching from Eventbrite", {
        component: "UnifiedRealEventsAPI",
        action: "fetchFromEventbrite",
        error: error instanceof Error ? error.message : String(error)
      })
      return { events: [], totalCount: 0, hasMore: false }
    }
  }

  private async fetchFromRapidAPI(params: EventSearchParams): Promise<EventsResponse> {
    try {
      const config = await this.getApiConfig()
      
      if (!config.rapidapi.key || config.rapidapi.key.includes('your-')) {
        logger.warn("RapidAPI key not configured", {
          component: "UnifiedRealEventsAPI",
          action: "fetchFromRapidAPI"
        })
        return { events: [], totalCount: 0, hasMore: false }
      }

      const url = new URL("https://real-time-events-search.p.rapidapi.com/search-events")

      // RapidAPI requires a query parameter
      const query = params.keyword || params.query || "events music concert festival show"
      url.searchParams.set("query", query)

      // RapidAPI requires more specific location than just "United States"
      if (params.location && params.location !== "United States") {
        url.searchParams.set("location", params.location)
      } else if (params.lat && params.lng) {
        // Use coordinates if available
        url.searchParams.set("location", `${params.lat},${params.lng}`)
      } else {
        // Default to a major city if location is too generic
        url.searchParams.set("location", "New York")
      }

      // RapidAPI uses "start" for pagination offset, not date filtering
      url.searchParams.set("start", "0")
      url.searchParams.set("limit", String(params.limit || 50))

      const headers = {
        "X-RapidAPI-Key": config.rapidapi.key,
        "X-RapidAPI-Host": config.rapidapi.host
      }

      logger.info("Fetching events from RapidAPI", {
        component: "UnifiedRealEventsAPI",
        action: "fetchFromRapidAPI",
        metadata: { url: url.toString() }
      })

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        logger.error("RapidAPI request failed", {
          component: "UnifiedRealEventsAPI",
          action: "fetchFromRapidAPI",
          metadata: {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            url: url.toString().replace(config.rapidapi.key, "***")
          }
        })
        throw new Error(`RapidAPI error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      // Validate response structure
      if (!data || (!data.data && !Array.isArray(data))) {
        logger.warn("Invalid RapidAPI response structure", {
          component: "UnifiedRealEventsAPI",
          action: "fetchFromRapidAPI",
          metadata: { responseKeys: Object.keys(data || {}) }
        })
        return { events: [], totalCount: 0, hasMore: false }
      }

      const eventsArray = Array.isArray(data) ? data : (data.data || [])
      
      const events: Event[] = eventsArray.map((event: any, index: number) => ({
        id: `rapid_${event.event_id || event.id || index}_${Date.now()}`,
        title: event.name || event.title || "",
        description: event.description || "",
        date: event.start_time || event.date || "",
        location: {
          name: event.venue?.name || event.venue_name || "",
          address: event.venue?.full_address || event.venue_address || event.location || "",
          city: event.venue?.city || event.location || "",
          coordinates: {
            lat: parseFloat(event.venue?.latitude || event.latitude || "0"),
            lng: parseFloat(event.venue?.longitude || event.longitude || "0")
          }
        },
        category: event.category || event.labels?.[0] || "Event",
        price: event.is_free === true ? {
          min: 0,
          max: 0,
          currency: "USD"
        } : (event.min_ticket_price || event.max_ticket_price) ? {
          min: parseFloat(event.min_ticket_price || event.min_price || "0"),
          max: event.max_ticket_price ? parseFloat(event.max_ticket_price) : undefined,
          currency: "USD"
        } : undefined,
        image: event.thumbnail || event.image || "",
        url: event.link || event.url || "",
        source: "rapidapi",
        tags: event.tags || event.labels || [event.category?.toLowerCase() || "event"],
        latitude: parseFloat(event.venue?.latitude || event.latitude || "0"),
        longitude: parseFloat(event.venue?.longitude || event.longitude || "0"),
        rating: Math.random() * 1 + 4 // Mock rating between 4-5
      }))

      return {
        events,
        totalCount: data.total || events.length,
        hasMore: false
      }
    } catch (error) {
      logger.error("Error fetching from RapidAPI", {
        component: "UnifiedRealEventsAPI",
        action: "fetchFromRapidAPI",
        error: error instanceof Error ? error.message : String(error)
      })
      return { events: [], totalCount: 0, hasMore: false }
    }
  }

  async searchEvents(params: EventSearchParams): Promise<EventsResponse> {
    const results: Event[] = []
    let totalCount = 0
    let hasMore = false

    // Enhanced search parameters with defaults
    const searchParams: EventSearchParams = {
      limit: 20,
      page: 0,
      location: "United States",
      ...params
    }

    // For party events, enhance the search
    if (params.category === "Party" || params.categories?.includes("Party")) {
      searchParams.keyword = searchParams.keyword || "party nightlife music festival"
      searchParams.categories = ["Music", "Entertainment", "Arts & Theatre"]
    }

    // Try multiple providers and combine results
    const providers = [
      { name: "ticketmaster", fetch: () => this.fetchFromTicketmaster(searchParams) },
      { name: "eventbrite", fetch: () => this.fetchFromEventbrite(searchParams) },
      { name: "rapidapi", fetch: () => this.fetchFromRapidAPI(searchParams) }
    ]

    const fetchPromises = providers.map(async (provider) => {
      try {
        const response = await provider.fetch()
        logger.info(`Successfully fetched ${response.events.length} events from ${provider.name}`, {
          component: "UnifiedRealEventsAPI",
          action: "searchEvents",
          metadata: { provider: provider.name, count: response.events.length }
        })
        return { provider: provider.name, response }
      } catch (error) {
        logger.warn(`Failed to fetch from ${provider.name}`, {
          component: "UnifiedRealEventsAPI",
          action: "searchEvents",
          error: error instanceof Error ? error.message : String(error),
          metadata: { provider: provider.name }
        })
        return { provider: provider.name, response: { events: [], totalCount: 0, hasMore: false } }
      }
    })

    // Execute all API calls in parallel
    const providerResults = await Promise.allSettled(fetchPromises)

    // Process results
    for (const result of providerResults) {
      if (result.status === 'fulfilled') {
        const { response } = result.value
        results.push(...response.events)
        totalCount += response.totalCount
        hasMore = hasMore || response.hasMore
      }
    }

    // Deduplicate events by title and date to avoid duplicates across APIs
    const uniqueEvents = results.filter((event, index, self) => 
      index === self.findIndex(e => 
        e.title.toLowerCase() === event.title.toLowerCase() && 
        e.date === event.date &&
        e.location.city === event.location.city
      )
    )

    // Sort by date (upcoming events first)
    uniqueEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      const now = Date.now()
      
      // Prioritize future events
      if (dateA >= now && dateB >= now) {
        return dateA - dateB
      } else if (dateA >= now) {
        return -1
      } else if (dateB >= now) {
        return 1
      } else {
        return dateB - dateA // Recent past events
      }
    })

    logger.info(`Total events fetched: ${uniqueEvents.length} (deduplicated from ${results.length})`, {
      component: "UnifiedRealEventsAPI",
      action: "searchEvents",
      metadata: { 
        total: uniqueEvents.length, 
        original: results.length,
        searchParams 
      }
    })

    return {
      events: uniqueEvents.slice(0, searchParams.limit),
      totalCount: uniqueEvents.length,
      hasMore: uniqueEvents.length > (searchParams.limit || 20)
    }
  }

  async getPartyEvents(location?: string, limit = 50): Promise<Event[]> {
    const searchParams: EventSearchParams = {
      keyword: "party music festival nightlife",
      categories: ["Music", "Entertainment"],
      location: location || "United States",
      limit,
      sortBy: "date"
    }

    const response = await this.searchEvents(searchParams)
    return response.events.filter(event => 
      event.category.toLowerCase().includes("music") ||
      event.category.toLowerCase().includes("entertainment") ||
      event.tags?.some(tag => 
        ["party", "music", "festival", "dance", "nightlife", "club"].includes(tag.toLowerCase())
      )
    )
  }

  async getFeaturedEvents(location?: string, limit = 20): Promise<Event[]> {
    const searchParams: EventSearchParams = {
      location: location || "United States",
      limit,
      sortBy: "popularity"
    }

    const response = await this.searchEvents(searchParams)
    // Return events with higher ratings or more attendees
    return response.events.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit)
  }
}

export const unifiedRealEventsAPI = new UnifiedRealEventsAPI()
export default unifiedRealEventsAPI