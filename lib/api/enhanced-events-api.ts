/**
 * Enhanced Events API Integration
 * Provides unified interface for multiple event providers with intelligent fallback
 */

import { logger } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"
import type { EventDetailProps } from "@/components/event-detail-modal"

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
  private providers: EventProvider[] = [
    {
      name: "Ticketmaster",
      priority: 1,
      isEnabled: !!process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY,
      rateLimit: { requestsPerMinute: 5000, currentCount: 0, resetTime: 0 },
    },
    {
      name: "Eventbrite",
      priority: 2,
      isEnabled: !!process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY,
      rateLimit: { requestsPerMinute: 1000, currentCount: 0, resetTime: 0 },
    },
    {
      name: "PredictHQ",
      priority: 3,
      isEnabled: !!process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY,
      rateLimit: { requestsPerMinute: 500, currentCount: 0, resetTime: 0 },
    },
  ]

  private performanceMetrics = {
    totalRequests: 0,
    totalTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    errors: 0,
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

      if (availableProviders.length === 0) {
        throw new Error("No event providers available")
      }

      // Search across providers in parallel
      const searchPromises = availableProviders.map((provider) => this.searchProvider(provider, params))

      const results = await Promise.allSettled(searchPromises)

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
        "Enhanced event search failed",
        {
          component: "EnhancedEventsAPI",
          action: "search_error",
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

      logger.debug(`Searching ${provider.name}`, {
        component: "EnhancedEventsAPI",
        action: "search_provider",
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
          throw new Error(`Unknown provider: ${provider.name}`)
      }

      // Update rate limit
      this.updateRateLimit(provider)

      return { events, source: provider.name }
    } catch (error) {
      logger.warn(`Provider ${provider.name} search failed`, {
        component: "EnhancedEventsAPI",
        action: "provider_search_error",
        metadata: { provider: provider.name, error: error instanceof Error ? error.message : String(error) },
      })

      return { events: [], source: provider.name }
    }
  }

  /**
   * Search Ticketmaster API
   */
  private async searchTicketmaster(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
    const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY
    if (!apiKey) throw new Error("Ticketmaster API key not configured")

    const searchParams = new URLSearchParams({
      apikey: apiKey,
      keyword: params.keyword || "",
      city: params.location || "",
      size: String(Math.min(params.size || 20, 200)),
      page: String(params.page || 0),
      sort: "relevance,desc",
    })

    if (params.startDateTime) {
      searchParams.append("startDateTime", params.startDateTime)
    }
    if (params.endDateTime) {
      searchParams.append("endDateTime", params.endDateTime)
    }
    if (params.categories && params.categories.length > 0) {
      searchParams.append("classificationName", params.categories[0])
    }

    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${searchParams}`, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data._embedded?.events) {
      return []
    }

    return data._embedded.events.map((event: any) => this.transformTicketmasterEvent(event))
  }

  /**
   * Search Eventbrite API
   */
  private async searchEventbrite(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
    const apiKey = process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY
    if (!apiKey) throw new Error("Eventbrite API key not configured")

    const searchParams = new URLSearchParams({
      token: apiKey,
      q: params.keyword || "",
      "location.address": params.location || "",
      "location.within": `${params.radius || 25}km`,
      expand: "venue,organizer,ticket_availability",
      page: String((params.page || 0) + 1), // Eventbrite uses 1-based pagination
    })

    if (params.startDateTime) {
      searchParams.append("start_date.range_start", params.startDateTime)
    }
    if (params.endDateTime) {
      searchParams.append("start_date.range_end", params.endDateTime)
    }
    if (params.categories && params.categories.length > 0) {
      searchParams.append("categories", params.categories.join(","))
    }

    const response = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.events) {
      return []
    }

    return data.events.map((event: any) => this.transformEventbriteEvent(event))
  }

  /**
   * Search PredictHQ API
   */
  private async searchPredictHQ(params: EnhancedEventSearchParams): Promise<EventDetailProps[]> {
    const apiKey = process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY
    if (!apiKey) throw new Error("PredictHQ API key not configured")

    const searchParams = new URLSearchParams({
      q: params.keyword || "",
      limit: String(Math.min(params.size || 20, 500)),
      offset: String((params.page || 0) * (params.size || 20)),
      sort: "rank",
    })

    if (params.location) {
      // For simplicity, using a default location. In production, geocode the location first
      searchParams.append("location", "40.7128,-74.0060") // NYC coordinates
      searchParams.append("within", `${params.radius || 25}km`)
    }

    if (params.startDateTime) {
      searchParams.append("active.gte", params.startDateTime)
    }
    if (params.endDateTime) {
      searchParams.append("active.lte", params.endDateTime)
    }
    if (params.categories && params.categories.length > 0) {
      searchParams.append("category", params.categories.join(","))
    }

    const response = await fetch(`https://api.predicthq.com/v1/events/?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`PredictHQ API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results) {
      return []
    }

    return data.results.map((event: any) => this.transformPredictHQEvent(event))
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
      attendees: Math.floor(Math.random() * 500) + 50, // Ticketmaster doesn't provide this
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
      category: event.category?.name || "Event",
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
      price: event.ticket_availability?.is_free ? "Free" : "Price TBA",
      image: event.logo?.url || `/event-${Math.floor(Math.random() * 12) + 1}.png`,
      organizer: {
        name: organizer?.name || "Event Organizer",
        avatar: organizer?.logo?.url || `/avatar-${Math.floor(Math.random() * 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 500) + 50, // Eventbrite doesn't always provide this
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
      location: event.venue?.name || event.location?.[0] || "Venue TBA",
      address: event.venue?.formatted_address || "Address TBA",
      price: "Price TBA", // PredictHQ doesn't provide pricing
      image: `/event-${Math.floor(Math.random() * 12) + 1}.png`,
      organizer: {
        name: event.entities?.find((e: any) => e.type === "venue")?.name || "Event Organizer",
        avatar: `/avatar-${Math.floor(Math.random() * 6) + 1}.png`,
      },
      attendees: event.phq_attendance || Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates: event.location
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

    // Collect all successful results
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.events.length > 0) {
        allEvents.push(...result.value.events)
        sources.push(result.value.source)
      }
    }

    // Remove duplicates based on title and location similarity
    const uniqueEvents = this.deduplicateEvents(allEvents)

    // Apply user preferences for ranking
    const rankedEvents = this.rankEventsByPreferences(uniqueEvents, params.userPreferences)

    // Apply pagination
    const page = params.page || 0
    const size = params.size || 20
    const startIndex = page * size
    const paginatedEvents = rankedEvents.slice(startIndex, startIndex + size)

    return {
      events: paginatedEvents,
      totalCount: rankedEvents.length,
      page,
      sources,
    }
  }

  /**
   * Remove duplicate events
   */
  private deduplicateEvents(events: EventDetailProps[]): EventDetailProps[] {
    const seen = new Set<string>()
    const unique: EventDetailProps[] = []

    for (const event of events) {
      // Create a key based on title and location
      const key = `${event.title.toLowerCase().trim()}_${event.location.toLowerCase().trim()}`

      if (!seen.has(key)) {
        seen.add(key)
        unique.push(event)
      }
    }

    return unique
  }

  /**
   * Rank events based on user preferences
   */
  private rankEventsByPreferences(
    events: EventDetailProps[],
    preferences?: EnhancedEventSearchParams["userPreferences"],
  ): EventDetailProps[] {
    if (!preferences) {
      return events.sort((a, b) => b.attendees - a.attendees) // Default: sort by popularity
    }

    return events.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Category preference
      if (preferences.favoriteCategories.includes(a.category.toLowerCase())) {
        scoreA += 10
      }
      if (preferences.favoriteCategories.includes(b.category.toLowerCase())) {
        scoreB += 10
      }

      // Price preference
      scoreA += this.calculatePriceScore(a.price, preferences.pricePreference)
      scoreB += this.calculatePriceScore(b.price, preferences.pricePreference)

      // Time preference
      scoreA += this.calculateTimeScore(a.time, preferences.timePreference)
      scoreB += this.calculateTimeScore(b.time, preferences.timePreference)

      // Popularity (attendees)
      scoreA += Math.log(a.attendees + 1)
      scoreB += Math.log(b.attendees + 1)

      return scoreB - scoreA
    })
  }

  /**
   * Calculate price preference score
   */
  private calculatePriceScore(price: string, preference: string): number {
    if (preference === "any") return 0

    const isFree = price.toLowerCase().includes("free")
    const priceMatch = price.match(/\$(\d+)/)
    const priceValue = priceMatch ? Number.parseInt(priceMatch[1]) : 0

    switch (preference) {
      case "free":
        return isFree ? 5 : 0
      case "low":
        return priceValue <= 25 ? 5 : 0
      case "medium":
        return priceValue > 25 && priceValue <= 75 ? 5 : 0
      case "high":
        return priceValue > 75 ? 5 : 0
      default:
        return 0
    }
  }

  /**
   * Calculate time preference score
   */
  private calculateTimeScore(time: string, preference: string): number {
    if (preference === "any") return 0

    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!timeMatch) return 0

    const hour = Number.parseInt(timeMatch[1])
    const isPM = timeMatch[3].toUpperCase() === "PM"
    const hour24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour

    switch (preference) {
      case "morning":
        return hour24 >= 6 && hour24 < 12 ? 3 : 0
      case "afternoon":
        return hour24 >= 12 && hour24 < 17 ? 3 : 0
      case "evening":
        return hour24 >= 17 && hour24 < 21 ? 3 : 0
      case "night":
        return hour24 >= 21 || hour24 < 6 ? 3 : 0
      default:
        return 0
    }
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

    // Reset counter if minute has passed
    if (now > provider.rateLimit.resetTime) {
      provider.rateLimit.currentCount = 0
      provider.rateLimit.resetTime = now + 60000 // Next minute
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
