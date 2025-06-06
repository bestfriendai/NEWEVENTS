"use server"

import { unifiedEventsService, type UnifiedEventSearchParams } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: {
    message: string
    code?: string
  }
  cached?: boolean
  responseTime?: number
}

/**
 * Enhanced event fetching with multi-level caching and database integration
 */
export async function fetchEvents(params: {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number
  size?: number
  page?: number
  sort?: string
  categories?: string[]
  startDate?: string
  endDate?: string
}): Promise<EventSearchResult> {
  try {
    logger.info("Server action: fetchEvents called", { params })

    // Convert to unified API parameters
    const searchParams: UnifiedEventSearchParams = {
      query: params.keyword,
      lat: params.coordinates?.lat,
      lng: params.coordinates?.lng,
      radius: params.radius || 25,
      limit: Math.max(params.size || 50, 100), // Increase minimum limit to 100
      offset: (params.page || 0) * (params.size || 20),
      category: params.categories?.[0], // Use first category for now
      startDate: params.startDate,
      endDate: params.endDate,
    }

    const result = await unifiedEventsService.searchEvents(searchParams)

    // Convert sources object to array for backward compatibility
    const sourcesArray: string[] = []
    if (result.sources.rapidapi > 0) sourcesArray.push("RapidAPI")
    if (result.sources.ticketmaster > 0) sourcesArray.push("Ticketmaster")
    if (result.sources.cached > 0) sourcesArray.push("Cached")

    // Calculate pagination info
    const pageSize = params.size || 20
    const currentPage = params.page || 0
    const totalPages = Math.ceil(result.totalCount / pageSize)

    return {
      events: result.events,
      totalCount: result.totalCount,
      page: currentPage,
      totalPages,
      sources: sourcesArray,
      error: result.error ? { message: result.error } : undefined,
      cached: result.sources.cached > 0,
    }
  } catch (error) {
    logger.error("Server action: fetchEvents failed", { error, params })

    return {
      events: [],
      totalCount: 0,
      page: 0,
      totalPages: 0,
      sources: [],
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch events",
        code: "FETCH_ERROR",
      },
    }
  }
}

/**
 * Get featured events with caching
 */
export async function getFeaturedEvents(limit = 6): Promise<EventDetailProps[]> {
  try {
    logger.info("Server action: getFeaturedEvents called", { limit })

    // Default to NYC coordinates for featured events
    const result = await unifiedEventsService.getFeaturedEventsNearUser(
      40.7128, // NYC lat
      -74.006, // NYC lng
      50, // radius
      Math.max(limit, 50), // Ensure we get at least 50 events instead of 20
    )

    logger.info("Server action: getFeaturedEvents completed", {
      eventCount: result.events.length,
    })

    return result.events
  } catch (error) {
    logger.error("Server action: getFeaturedEvents failed", { error, limit })
    return []
  }
}

// Test function to check if APIs are working
export async function testEventAPIs(): Promise<{
  ticketmaster: boolean
  rapidapi: boolean
  eventbrite: boolean
  predicthq: boolean
  errors: string[]
}> {
  try {
    logger.info("Testing event APIs")

    const errors: string[] = []
    const results = {
      ticketmaster: false,
      rapidapi: false,
      eventbrite: false,
      predicthq: false,
    }

    // Test with a simple search
    const testResult = await unifiedEventsService.searchEvents({
      query: "music",
      lat: 40.7128,
      lng: -74.006,
      limit: 1,
    })

    // Check which sources returned data
    if (testResult.sources.ticketmaster > 0) {
      results.ticketmaster = true
    }
    if (testResult.sources.rapidapi > 0) {
      results.rapidapi = true
    }
    // Note: eventbrite and predicthq are not implemented in unified service yet
    results.eventbrite = false
    results.predicthq = false

    if (testResult.error) {
      errors.push(testResult.error)
    }

    logger.info("API test completed", { results, errors })

    return { ...results, errors }
  } catch (error) {
    logger.error("API test failed", { error })
    return {
      ticketmaster: false,
      rapidapi: false,
      eventbrite: false,
      predicthq: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Get events by category with caching
 */
export async function getEventsByCategory(category: string, limit = 30): Promise<EventDetailProps[]> {
  try {
    logger.info("Server action: getEventsByCategory called", { category, limit })

    const searchResult = await unifiedEventsService.searchEvents({
      query: category,
      category: category,
      limit: Math.max(limit, 100), // Increase minimum to 100 instead of 50
    })

    const categoryEvents = searchResult.events

    logger.info("Server action: getEventsByCategory completed", {
      category,
      eventCount: categoryEvents.length,
    })

    return categoryEvents
  } catch (error) {
    logger.error("Server action: getEventsByCategory failed", {
      category,
      error,
    })
    return []
  }
}

// Export types
export type { UnifiedEventSearchParams as EventSearchParams }
