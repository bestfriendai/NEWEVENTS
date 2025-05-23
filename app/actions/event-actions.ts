"use server"

import {
  searchEvents,
  getEventDetails,
  getFeaturedEvents,
  getEventsByCategory,
  getEventsByLocation,
  getPersonalizedEvents,
  searchEnhancedEvents,
  type EventSearchParams,
  type EnhancedEventSearchParams,
} from "@/lib/api/events-api"

export async function fetchEvents(params: EventSearchParams) {
  try {
    // console.log("Server action fetchEvents called with params:", params)
    const result = await searchEvents(params)
    return {
      events: result.events || [],
      totalCount: result.totalCount || 0,
      page: result.page || 0,
      totalPages: result.totalPages || 0,
      sources: result.sources || [],
    }
  } catch (error) {
    // console.error("Error in fetchEvents:", error)
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      sources: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function fetchEnhancedEvents(params: EnhancedEventSearchParams) {
  try {
    // console.log("Server action fetchEnhancedEvents called with params:", params)
    const result = await searchEnhancedEvents(params)
    return {
      events: result.events || [],
      totalCount: result.totalCount || 0,
      page: result.page || 0,
      totalPages: result.totalPages || 0,
      sources: result.sources || [],
      error: result.error,
    }
  } catch (error) {
    // console.error("Error in fetchEnhancedEvents:", error)
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      sources: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function fetchPersonalizedEvents(
  coordinates: { lat: number; lng: number },
  userPreferences: EnhancedEventSearchParams["userPreferences"],
  radius = 25,
  limit = 20,
) {
  try {
    // console.log("Server action fetchPersonalizedEvents called")
    const result = await getPersonalizedEvents(coordinates, userPreferences, radius, limit)
    return {
      events: result.events || [],
      sources: result.sources || [],
      error: null,
    }
  } catch (error) {
    // console.error("Error in fetchPersonalizedEvents:", error)
    return {
      events: [],
      sources: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function fetchEventDetails(eventId: string) {
  try {
    // console.log("Server action fetchEventDetails called for event:", eventId)
    return await getEventDetails(eventId)
  } catch (_error) {
    // console.error("Error in fetchEventDetails:", error)
    return null
  }
}

export async function fetchFeaturedEvents(limit = 20) {
  try {
    // console.log("Server action fetchFeaturedEvents called with limit:", limit)
    const events = await getFeaturedEvents(limit)
    return events || []
  } catch (_error) {
    // console.error("Error in fetchFeaturedEvents:", error)
    return []
  }
}

export async function fetchEventsByCategory(category: string, limit = 30) {
  try {
    // console.log("Server action fetchEventsByCategory called for category:", category)
    const events = await getEventsByCategory(category, limit)
    return events || []
  } catch (_error) {
    // console.error("Error in fetchEventsByCategory:", error)
    return []
  }
}

export async function fetchEventsByLocation(location: string, radius = 25, limit = 10) {
  try {
    // console.log("Server action fetchEventsByLocation called for location:", location)
    const events = await getEventsByLocation(location, radius, limit)
    return events || []
  } catch (_error) {
    // console.error("Error in fetchEventsByLocation:", error)
    return []
  }
}
