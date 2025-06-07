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
    logger.info("Server action: fetchEvents called", { params });

    // Convert params to UnifiedEventSearchParams as per the plan
    const searchParams: UnifiedEventSearchParams = {
        query: params.keyword,
        lat: params.coordinates?.lat,
        lng: params.coordinates?.lng,
        radius: params.radius,
        limit: params.size || 50, // Default to 50 if not provided, allows fetching more events
        page: params.page,   // Use params.page directly
        category: params.categories?.[0], // Keep if needed, or adjust based on how categories are handled
        startDate: params.startDate,
        endDate: params.endDate,
        // sortBy: params.sort, // Map sort if necessary, UnifiedEventSearchParams has sortBy
    };

    const result = await unifiedEventsService.searchEvents(searchParams);

    // Format the result for the client
    const sourcesArray: string[] = [];
    if (result.sources.rapidapi > 0) sourcesArray.push("RapidAPI");
    if (result.sources.ticketmaster > 0) sourcesArray.push("Ticketmaster");
    if (result.sources.eventbrite > 0) sourcesArray.push("Eventbrite"); // Added Eventbrite

    const pageSize = params.size || 50; // Default page size if not provided, consistent with limit
    const currentPage = params.page || 0;
    const totalPages = result.totalCount > 0 && pageSize > 0 ? Math.ceil(result.totalCount / pageSize) : 0;
    
    return {
      events: result.events,
      totalCount: result.totalCount,
      page: currentPage,
      totalPages,
      sources: sourcesArray,
      error: result.error ? { message: result.error } : undefined,
      // cached: undefined, // Caching is handled by react-query, so this might be removed or set to false
      responseTime: result.responseTime,
    };

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
    logger.info("Server action: getFeaturedEvents called", { limit });

    // This can now be a more specific call to the unified service as per the plan
    const result = await unifiedEventsService.getFeaturedEventsNearUser(
      40.7128, // NYC lat
      -74.006, // NYC lng
      50,      // radius in km
      limit    // Use limit directly as per plan
    );

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
