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
  return await searchEvents(params)
}

export async function fetchEventDetails(eventId: string) {
  return await getEventDetails(eventId)
}

export async function fetchFeaturedEvents(limit = 2) {
  return await getFeaturedEvents(limit)
}

export async function fetchEventsByCategory(category: string, limit = 6) {
  return await getEventsByCategory(category, limit)
}

export async function fetchEventsByLocation(location: string, radius = 25, limit = 10) {
  return await getEventsByLocation(location, radius, limit)
}
