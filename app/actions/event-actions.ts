"use server"

import {
  searchEvents,
  getEventDetails,
  getFeaturedEvents,
  getEventsByCategory,
  getEventsByLocation,
  type EventSearchParams,
} from "@/lib/api/events-api"

export async function fetchEvents(params: EventSearchParams) {
  try {
    console.log("Server action fetchEvents called with params:", params)
    return await searchEvents(params)
  } catch (error) {
    console.error("Error in fetchEvents:", error)
    // Return an empty result set with error information
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function fetchEventDetails(eventId: string) {
  try {
    console.log("Server action fetchEventDetails called for event:", eventId)
    return await getEventDetails(eventId)
  } catch (error) {
    console.error("Error in fetchEventDetails:", error)
    return null
  }
}

export async function fetchFeaturedEvents(limit = 2) {
  try {
    console.log("Server action fetchFeaturedEvents called with limit:", limit)
    return await getFeaturedEvents(limit)
  } catch (error) {
    console.error("Error in fetchFeaturedEvents:", error)
    return []
  }
}

export async function fetchEventsByCategory(category: string, limit = 6) {
  try {
    console.log("Server action fetchEventsByCategory called for category:", category)
    return await getEventsByCategory(category, limit)
  } catch (error) {
    console.error("Error in fetchEventsByCategory:", error)
    return []
  }
}

export async function fetchEventsByLocation(location: string, radius = 25, limit = 10) {
  try {
    console.log("Server action fetchEventsByLocation called for location:", location)
    return await getEventsByLocation(location, radius, limit)
  } catch (error) {
    console.error("Error in fetchEventsByLocation:", error)
    return []
  }
}
