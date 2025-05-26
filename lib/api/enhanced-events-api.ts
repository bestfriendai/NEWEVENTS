/**
 * Enhanced Events API Integration
 * Provides unified interface for multiple event providers with intelligent fallback
 */

import { logger } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { env } from "@/lib/env"

export interface EnhancedEventSearchParams {
  keyword?: string
  location?: string
  radius?: number
  startDateTime?: string
  endDateTime?: string
  categories?: string[]
  page?: number
  size?: number
  userPreferences?: {
    favoriteCategories: string[]
    pricePreference: "free" | "low" | "medium" | "high" | "any"
    timePreference: "morning" | "afternoon" | "evening" | "night" | "any"
  }
}

export interface EnhancedEventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  sources: string[]
  performance: {
    totalTime: number
    apiCalls: number
    cacheHits: number
  }
}

export interface EventProvider {
  name: string
  priority: number
  isEnabled: boolean
  rateLimit: {
    requestsPerMinute: number
    currentCount: number
    resetTime: number
  }
}

class EnhancedEventsAPI {
  private providers: EventProvider[]
  private performanceMetrics = {
    totalRequests: 0,
    totalTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    errors: 0,
  }

  constructor() {
    this.providers = [
      {
        name: "Ticketmaster",
        priority: 1,
        isEnabled: !!env.TICKETMASTER_API_KEY,
        rateLimit: { requestsPerMinute: 5000, currentCount: 0, resetTime: 0 },
      },
      {
        name: "Eventbrite",
        priority: 2,
        isEnabled: !!(env.EVENTBRITE_PRIVATE_TOKEN || env.EVENTBRITE_API_KEY),
        rateLimit: { requestsPerMinute: 1000, currentCount: 0, resetTime: 0 },
      },
      {
        name: "PredictHQ",
        priority: 3,
        isEnabled: !!env.PREDICTHQ_API_KEY,
        rateLimit: { requestsPerMinute: 500, currentCount: 0, resetTime: 0 },
      },
    ]

    logger.debug("Initialized EnhancedEventsAPI providers", {
      component: "EnhancedEventsAPI",
      action: "constructor",
      metadata: {
        providers: this.providers.map((p) => ({
          name: p.name,
          isEnabled: p.isEnabled,
          hasKey: !!(p.name === "Ticketmaster"
            ? env.TICKETMASTER_API_KEY
            : p.name === "Eventbrite"
              ? env.EVENTBRITE_PRIVATE_TOKEN || env.EVENTBRITE_API_KEY
              : env.PREDICTHQ_API_KEY),
        })),
      },
    })
  }

  /**
   * Search events across multiple providers with intelligent aggregation
   */
  async searchEvents(params: EnhancedEventSearchParams): Promise<EnhancedEventSearchResult> {
    const startTime = performance.now()
    const timerEnd = logger.time("Enhanced event search", {
      component: "EnhancedEventsAPI",
      action: "searchEvents",
      metadata: { params },
    })

    try {
      this.performanceMetrics.totalRequests++

      // Create cache key
      const cacheKey = this.createCacheKey(params)

      // Try cache first
      const cached = memoryCache.get<EnhancedEventSearchResult>(cacheKey)
      if (cached) {
        this.performanceMetrics.cacheHits++
        logger.info("Cache hit for enhanced event search", {
          component: "EnhancedEventsAPI",
          action: "cache_hit",
          metadata: { cacheKey },
        })

        timerEnd()
        return {
          ...cached,
          performance: {
            ...cached.performance,
            totalTime: performance.now() - startTime,
          },
        }
      }

      // Get available providers
      const availableProviders = this.getAvailableProviders()

      logger.info("Available providers for search in EnhancedEventsAPI", {
        component: "EnhancedEventsAPI",
        action: "providers_check",
        metadata: {
          providers: availableProviders.map((p) => p.name),
          totalProviders: this.providers.length,
          enabledCount: availableProviders.length,
        },
      })

      if (availableProviders.length === 0) {
        logger.error("No event providers are enabled or configured correctly in EnhancedEventsAPI", {
          component: "EnhancedEventsAPI",
          action: "no_providers_error",
          metadata: {
            allProviders: this.providers.map((p) => ({
              name: p.name,
              isEnabled: p.isEnabled,
              hasKey: !!(p.name === "Ticketmaster"
                ? env.TICKETMASTER_API_KEY
                : p.name === "Eventbrite"
                  ? env.EVENTBRITE_PRIVATE_TOKEN || env.EVENTBRITE_API_KEY
                  : env.PREDICTHQ_API_KEY),
            })),
          },
        })
        throw new Error(
          "No event providers available or enabled in EnhancedEventsAPI. Check server environment variables.",
        )
      }

      // Search across providers in parallel
      const searchPromises = availableProviders.map((provider) => this.searchProvider(provider, params))

      const results = await Promise.allSettled(searchPromises)

      // Log individual provider results for debugging
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.warn(`Provider ${availableProviders[index].name} failed during Promise.allSettled`, {
            component: "EnhancedEventsAPI",
            action: "provider_promise_rejected",
            metadata: {
              provider: availableProviders[index].name,
              reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
            },
          })
        } else {
          logger.info(`Provider ${availableProviders[index].name} succeeded`, {
            component: "EnhancedEventsAPI",
            action: "provider_promise_fulfilled",
            metadata: {
              provider: availableProviders[index].name,
              eventCount: result.value.events.length,
            },
          })
        }
      })

      // Aggregate results
      const aggregatedResult = this.aggregateResults(results, params)

      // Cache the result
      memoryCache.set(cacheKey, aggregatedResult, 300000) // 5 minutes

      const totalTime = performance.now() - startTime
      this.performanceMetrics.totalTime += totalTime
      this.performanceMetrics.apiCalls += availableProviders.length

      logger.info("Enhanced event search completed", {
        component: "EnhancedEventsAPI",
        action: "search_completed",
        metadata: {
          eventCount: aggregatedResult.events.length,
          sources: aggregatedResult.sources,
          totalTime,
          successfulProviders: results.filter((r) => r.status === "fulfilled").length,
          failedProviders: results.filter((r) => r.status === "rejected").length,
        },
      })

      timerEnd()

      return {
        ...aggregatedResult,
        performance: {
          totalTime,
          apiCalls: availableProviders.length,
          cacheHits: 0,
        },
      }
    } catch (error) {
      this.performanceMetrics.errors++

      logger.error(
        "Critical error in EnhancedEventsAPI searchEvents",
        {
          component: "EnhancedEventsAPI",
          action: "search_error_main_catch",
          metadata: { params },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      timerEnd()
      throw error
    }
  }

  /**
   * Search a specific provider
   */
  private async searchProvider(
    provider: EventProvider,
    params: EnhancedEventSearchParams,
  ): Promise<{ events: EventDetailProps[]; source: string }> {
    try {
      // Check rate limit
      if (!this.checkRateLimit(provider)) {
        throw new Error(`Rate limit exceeded for ${provider.name}`)
      }

      logger.debug(`Attempting to search with provider: ${provider.name}`, {
        component: "EnhancedEventsAPI",
        action: "search_provider_start",
        metadata: { provider: provider.name, params },
      })

      let events: EventDetailProps[] = []

      switch (provider.name) {
        case "Ticketmaster":
          events = await this.searchTicketmaster(params)
          break
        case "Eventbrite":
          events = await this.searchEventbrite(params)
          break
        case "PredictHQ":
          events = await this.searchPredictHQ(params)
          break
        default:
          logger.warn(`Unknown provider encountered: ${provider.name}`)
          throw new Error(`Unknown provider: ${provider.name}`)
      }

      // Update rate limit
      this.updateRateLimit(provider)

      logger.info(`Provider ${provider.name} search completed successfully`, {
        component: "EnhancedEventsAPI",
        action: "search_provider_success",
        metadata: { provider: provider.name, eventCount: events.length },
      })

      return { events, source: provider.name }
    } catch (error) {
      logger.error(`Provider ${provider.name} search failed within searchProvider`, {
        component: "EnhancedEventsAPI",
        action: "provider_search_error_detail",
        metadata: {
          provider: provider.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      })
      throw error // Re-throw the error to be caught by Promise.allSettled
    }
  }

  /**
   * Search Ticketmaster API
   */
  private async searchTicketmaster(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
    const apiKey = env.TICKETMASTER_API_KEY
    if (!apiKey) {
      logger.error("Ticketmaster API key is NOT configured for server-side use in searchTicketmaster")
      throw new Error("Ticketmaster API key not configured")
    }

    const searchParams = new URLSearchParams({
      apikey: apiKey,
      keyword: params.keyword || "",
      city: params.location || "",
      size: String(Math.min(params.size || 20, 200)),
      page: String(params.page || 0),
      sort: "relevance,desc",
    })

    if (params.startDateTime) searchParams.append("startDateTime", params.startDateTime)
    if (params.endDateTime) searchParams.append("endDateTime", params.endDateTime)
    if (params.categories && params.categories.length > 0)
      searchParams.append("classificationName", params.categories[0])

    const fullUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${searchParams}`
    logger.debug("Fetching from Ticketmaster URL", {
      component: "EnhancedEventsAPI",
      action: "ticketmaster_fetch",
      metadata: { url: fullUrl.replace(apiKey, "[REDACTED]") },
    })

    const response = await fetch(fullUrl, {
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error("Ticketmaster API request FAILED", {
        component: "EnhancedEventsAPI",
        action: "ticketmaster_api_error",
        metadata: {
          status: response.status,
          statusText: response.statusText,
          body: errorBody.substring(0, 500), // Limit error body length
          url: fullUrl.replace(apiKey, "[REDACTED]"),
        },
      })
      throw new Error(`Ticketmaster API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    if (!data._embedded?.events) {
      logger.info("No events found in Ticketmaster response", {
        component: "EnhancedEventsAPI",
        action: "ticketmaster_no_events",
        metadata: { params: searchParams.toString().replace(apiKey, "[REDACTED]") },
      })
      return []
    }

    const transformedEvents = data._embedded.events.map((event: any) => this.transformTicketmasterEvent(event))
    logger.info(`Ticketmaster returned ${transformedEvents.length} events`, {
      component: "EnhancedEventsAPI",
      action: "ticketmaster_success",
      metadata: { eventCount: transformedEvents.length },
    })

    return transformedEvents
  }

  /**
   * Search Eventbrite API
   */
  private async searchEventbrite(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
    const apiKey = env.EVENTBRITE_PRIVATE_TOKEN || env.EVENTBRITE_API_KEY
    if (!apiKey) {
      logger.error("Eventbrite API key or Private Token is NOT configured for server-side use")
      throw new Error("Eventbrite API key or Private Token not configured")
    }

    const searchParams = new URLSearchParams({
      q: params.keyword || "",
      "location.address": params.location || "",
      "location.within": `${params.radius || 25}km`,
      expand: "venue,organizer,ticket_availability",
      page: String((params.page || 0) + 1),
    })

    if (params.startDateTime) searchParams.append("start_date.range_start", params.startDateTime)
    if (params.endDateTime) searchParams.append("start_date.range_end", params.endDateTime)
    if (params.categories && params.categories.length > 0) {
      searchParams.append("categories", params.categories.join(","))
    }

    const fullUrl = `https://www.eventbriteapi.com/v3/events/search/?${searchParams}`
    logger.debug("Fetching from Eventbrite URL", {
      component: "EnhancedEventsAPI",
      action: "eventbrite_fetch",
      metadata: { url: fullUrl },
    })

    const response = await fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error("Eventbrite API request FAILED", {
        component: "EnhancedEventsAPI",
        action: "eventbrite_api_error",
        metadata: {
          status: response.status,
          statusText: response.statusText,
          body: errorBody.substring(0, 500),
          url: fullUrl,
        },
      })
      throw new Error(`Eventbrite API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    if (!data.events) {
      logger.info("No events found in Eventbrite response", {
        component: "EnhancedEventsAPI",
        action: "eventbrite_no_events",
        metadata: { params: searchParams.toString() },
      })
      return []
    }

    const transformedEvents = data.events.map((event: any) => this.transformEventbriteEvent(event))
    logger.info(`Eventbrite returned ${transformedEvents.length} events`, {
      component: "EnhancedEventsAPI",
      action: "eventbrite_success",
      metadata: { eventCount: transformedEvents.length },
    })

    return transformedEvents
  }

  /**
   * Search PredictHQ API
   */
  private async searchPredictHQ(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
    const apiKey = env.PREDICTHQ_API_KEY
    if (!apiKey) {
      logger.error("PredictHQ API key is NOT configured for server-side use")
      throw new Error("PredictHQ API key not configured")
    }

    const searchParams = new URLSearchParams({
      q: params.keyword || "",
      limit: String(Math.min(params.size || 20, 100)),
      offset: String((params.page || 0) * (params.size || 20)),
      sort: "rank",
    })

    if (params.location) {
      if (params.location.includes(",")) {
        searchParams.append("within", `${params.radius || 25}km@${params.location}`)
      } else {
        searchParams.append("place.scope", params.location)
        searchParams.append("place.exact", params.location)
      }
    }
    if (params.startDateTime) searchParams.append("active.gte", params.startDateTime)
    if (params.endDateTime) searchParams.append("active.lte", params.endDateTime)
    if (params.categories && params.categories.length > 0) searchParams.append("category", params.categories.join(","))

    const fullUrl = `https://api.predicthq.com/v1/events/?${searchParams}`
    logger.debug("Fetching from PredictHQ URL", {
      component: "EnhancedEventsAPI",
      action: "predicthq_fetch",
      metadata: { url: fullUrl },
    })

    const response = await fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error("PredictHQ API request FAILED", {
        component: "EnhancedEventsAPI",
        action: "predicthq_api_error",
        metadata: {
          status: response.status,
          statusText: response.statusText,
          body: errorBody.substring(0, 500),
          url: fullUrl,
        },
      })
      throw new Error(`PredictHQ API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    if (!data.results) {
      logger.info("No events found in PredictHQ response", {
        component: "EnhancedEventsAPI",
        action: "predicthq_no_events",
        metadata: { params: searchParams.toString() },
      })
      return []
    }

    const transformedEvents = data.results.map((event: any) => this.transformPredictHQEvent(event))
    logger.info(`PredictHQ returned ${transformedEvents.length} events`, {
      component: "EnhancedEventsAPI",
      action: "predicthq_success",
      metadata: { eventCount: transformedEvents.length },
    })

    return transformedEvents
  }

  /**
   * Transform Ticketmaster event to our format
   */
  private transformTicketmasterEvent(event: any): EventDetailProps {
    const venue = event._embedded?.venues?.[0]
    const priceRanges = event.priceRanges?.[0]

    return {
      id: `tm_${event.id}`,
      title: event.name || "Untitled Event",
      description: event.info || event.pleaseNote || "No description available",
      category: event.classifications?.[0]?.segment?.name || "Event",
      date: event.dates?.start?.localDate
        ? new Date(event.dates.start.localDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Date TBA",
      time: event.dates?.start?.localTime || "Time TBA",
      location: venue?.name || "Venue TBA",
      address: venue
        ? `${venue.address?.line1 || ""} ${venue.city?.name || ""} ${venue.state?.stateCode || ""}`.trim()
        : "Address TBA",
      price: priceRanges ? `$${priceRanges.min} - $${priceRanges.max}` : "Price TBA",
      image:
        event.images?.find((img: any) => img.width > 400)?.url ||
        event.images?.[0]?.url ||
        `/event-${Math.floor(Math.random() * 12) + 1}.png`,
      organizer: {
        name: event._embedded?.attractions?.[0]?.name || "Event Organizer",
        avatar:
          event._embedded?.attractions?.[0]?.images?.[0]?.url || `/avatar-${Math.floor(Math.random() * 6) + 1}.png`,
      },
      attendees: event.accessibility?.ticketLimit || Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates: venue?.location
        ? {
            lat: Number.parseFloat(venue.location.latitude),
            lng: Number.parseFloat(venue.location.longitude),
          }
        : undefined,
      ticketLinks: event.url ? [event.url] : [],
    }
  }

  /**
   * Transform Eventbrite event to our format
   */
  private transformEventbriteEvent(event: any): EventDetailProps {
    const venue = event.venue
    const organizer = event.organizer

    return {
      id: `eb_${event.id}`,
      title: event.name?.text || "Untitled Event",
      description: event.description?.text || "No description available",
      category: event.category_id ? "Event" : "Event",
      date: event.start?.local
        ? new Date(event.start.local).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Date TBA",
      time: event.start?.local
        ? new Date(event.start.local).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "Time TBA",
      location: venue?.name || "Venue TBA",
      address: venue
        ? `${venue.address?.address_1 || ""} ${venue.address?.city || ""} ${venue.address?.region || ""}`.trim()
        : "Address TBA",
      price: event.ticket_availability?.is_free
        ? "Free"
        : event.ticket_availability?.minimum_ticket_price?.display || "Price TBA",
      image: event.logo?.url || `/event-${Math.floor(Math.random() * 12) + 1}.png`,
      organizer: {
        name: organizer?.name || "Event Organizer",
        avatar: organizer?.logo?.url || `/avatar-${Math.floor(Math.random() * 6) + 1}.png`,
      },
      attendees: event.capacity || Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates:
        venue?.latitude && venue?.longitude
          ? {
              lat: Number.parseFloat(venue.latitude),
              lng: Number.parseFloat(venue.longitude),
            }
          : undefined,
      ticketLinks: event.url ? [event.url] : [],
    }
  }

  /**
   * Transform PredictHQ event to our format
   */
  private transformPredictHQEvent(event: any): EventDetailProps {
    return {
      id: `phq_${event.id}`,
      title: event.title || "Untitled Event",
      description: event.description || "No description available",
      category: event.category || "Event",
      date: event.start
        ? new Date(event.start).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Date TBA",
      time: event.start
        ? new Date(event.start).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "Time TBA",
      location:
        event.entities?.find((e: any) => e.type === "venue")?.name ||
        (event.location ? `${event.location[1]}, ${event.location[0]}` : "Venue TBA"),
      address: event.entities?.find((e: any) => e.type === "venue")?.formatted_address || "Address TBA",
      price: "Price TBA",
      image: `/event-${Math.floor(Math.random() * 12) + 1}.png`,
      organizer: {
        name: event.entities?.find((e: any) => e.type === "venue")?.name || "Event Organizer",
        avatar: `/avatar-${Math.floor(Math.random() * 6) + 1}.png`,
      },
      attendees: event.phq_attendance || Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates:
        event.location && event.location.length >= 2
          ? {
              lat: event.location[1],
              lng: event.location[0],
            }
          : undefined,
      ticketLinks: [],
    }
  }

  /**
   * Aggregate results from multiple providers
   */
  private aggregateResults(
    results: PromiseSettledResult<{ events: EventDetailProps[]; source: string }>[],
    params: EnhancedEventSearchParams,
  ): Omit<EnhancedEventSearchResult, "performance"> {
    const allEvents: EventDetailProps[] = []
    const sources: string[] = []

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.events.length > 0) {
        allEvents.push(...result.value.events)
        if (!sources.includes(result.value.source)) {
          sources.push(result.value.source)
        }
      }
    })

    const uniqueEvents = this.deduplicateEvents(allEvents)
    const page = params.page || 0
    const size = params.size || 20
    const startIndex = page * size
    const paginatedEvents = uniqueEvents.slice(startIndex, startIndex + size)

    return {
      events: paginatedEvents,
      totalCount: uniqueEvents.length,
      page,
      sources,
    }
  }

  /**
   * Remove duplicate events
   */
  private deduplicateEvents(events: EventDetailProps[]): EventDetailProps[] {
    const seen = new Map<string, EventDetailProps>()
    for (const event of events) {
      const titleKey = (event.title || "").toLowerCase().trim().substring(0, 30)
      const dateKey = (event.date || "").split(",")[0].trim()
      const locationKey = (event.location || "").toLowerCase().trim().substring(0, 20)
      const key = `${titleKey}_${dateKey}_${locationKey}`

      if (!seen.has(key)) {
        seen.set(key, event)
      }
    }
    return Array.from(seen.values())
  }

  /**
   * Get available providers
   */
  private getAvailableProviders(): EventProvider[] {
    return this.providers.filter((provider) => provider.isEnabled).sort((a, b) => a.priority - b.priority)
  }

  /**
   * Check rate limit for provider
   */
  private checkRateLimit(provider: EventProvider): boolean {
    const now = Date.now()

    if (now > provider.rateLimit.resetTime) {
      provider.rateLimit.currentCount = 0
      provider.rateLimit.resetTime = now + 60000
    }

    return provider.rateLimit.currentCount < provider.rateLimit.requestsPerMinute
  }

  /**
   * Update rate limit for provider
   */
  private updateRateLimit(provider: EventProvider): void {
    provider.rateLimit.currentCount++
  }

  /**
   * Create cache key for search parameters
   */
  private createCacheKey(params: EnhancedEventSearchParams): string {
    const keyParts = [
      params.keyword || "",
      params.location || "",
      params.radius || 25,
      params.startDateTime || "",
      params.endDateTime || "",
      (params.categories || []).sort().join(","),
      params.page || 0,
      params.size || 20,
    ]

    return `enhanced_search:${keyParts.join(":")}`
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      averageResponseTime:
        this.performanceMetrics.totalRequests > 0
          ? this.performanceMetrics.totalTime / this.performanceMetrics.totalRequests
          : 0,
      errorRate:
        this.performanceMetrics.totalRequests > 0
          ? this.performanceMetrics.errors / this.performanceMetrics.totalRequests
          : 0,
      cacheHitRate:
        this.performanceMetrics.totalRequests > 0
          ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests
          : 0,
    }
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalRequests: 0,
      totalTime: 0,
      apiCalls: 0,
      cacheHits: 0,
      errors: 0,
    }
  }
}

// Export singleton instance
export const enhancedEventsAPI = new EnhancedEventsAPI()

// Export the main search function
export async function searchEnhancedEvents(params: EnhancedEventSearchParams): Promise<EnhancedEventSearchResult> {
  return enhancedEventsAPI.searchEvents(params)
}
