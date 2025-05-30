"use server"

import { serverEnv } from "@/lib/env"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { logger } from "@/lib/utils/logger"

export interface TicketmasterSearchParams {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number
  startDateTime?: string
  endDateTime?: string
  page?: number
  size?: number
  classificationName?: string
}

export interface TicketmasterSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  error?: string
  cached?: boolean
  responseTime?: number
}

export async function searchTicketmasterEvents(params: TicketmasterSearchParams): Promise<TicketmasterSearchResult> {
  const startTime = Date.now()

  try {
    const apiKey = serverEnv.TICKETMASTER_API_KEY

    if (!apiKey) {
      logger.warn("Ticketmaster API key not configured")
      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        error: "Ticketmaster API key not configured",
        responseTime: Date.now() - startTime,
        cached: false,
      }
    }

    const queryParams = new URLSearchParams()
    queryParams.append("apikey", apiKey)

    // Location handling
    if (params.coordinates) {
      queryParams.append("latlong", `${params.coordinates.lat},${params.coordinates.lng}`)
      queryParams.append("radius", Math.min(params.radius || 50, 500).toString())
      queryParams.append("unit", "miles")
    } else if (params.location) {
      queryParams.append("city", params.location.trim())
    }

    // Search parameters
    if (params.keyword) queryParams.append("keyword", params.keyword.trim())
    if (params.startDateTime) queryParams.append("startDateTime", params.startDateTime)
    if (params.endDateTime) queryParams.append("endDateTime", params.endDateTime)
    if (params.classificationName) queryParams.append("classificationName", params.classificationName.trim())

    // Pagination
    queryParams.append("size", Math.min(params.size || 50, 200).toString())
    queryParams.append("page", Math.max(params.page || 0, 0).toString())
    queryParams.append("sort", "relevance,desc")

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${queryParams.toString()}`

    const response = await fetch(url)
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const error = `Ticketmaster API error: ${response.status}`
      logger.error("Ticketmaster API error", { status: response.status })

      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        error,
        responseTime,
        cached: false,
      }
    }

    const data = await response.json()

    if (data._embedded && data._embedded.events) {
      const events = data._embedded.events
        .map((event: any) => transformTicketmasterEvent(event))
        .filter(Boolean) as EventDetailProps[]

      return {
        events,
        totalCount: data.page?.totalElements || events.length,
        page: data.page?.number || 0,
        totalPages: data.page?.totalPages || 1,
        responseTime,
        cached: false,
      }
    }

    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      responseTime,
      cached: false,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error("Ticketmaster search failed", { error })

    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      error: "Failed to search events",
      responseTime,
      cached: false,
    }
  }
}

export async function getTicketmasterEventDetails(eventId: string): Promise<EventDetailProps | null> {
  try {
    const apiKey = serverEnv.TICKETMASTER_API_KEY

    if (!apiKey || !eventId) {
      return null
    }

    const queryParams = new URLSearchParams()
    queryParams.append("apikey", apiKey)

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(eventId)}.json?${queryParams.toString()}`,
    )

    if (!response.ok) {
      logger.error("Ticketmaster event details error", { eventId, status: response.status })
      return null
    }

    const event = await response.json()
    return transformTicketmasterEvent(event)
  } catch (error) {
    logger.error("Error fetching Ticketmaster event details", { eventId, error })
    return null
  }
}

function transformTicketmasterEvent(apiEvent: any): EventDetailProps {
  if (!apiEvent.id || !apiEvent.name) {
    throw new Error("Invalid event data")
  }

  const venue = apiEvent._embedded?.venues?.[0]
  const coordinates = venue?.location
    ? {
        lat: Number.parseFloat(venue.location.latitude || "0"),
        lng: Number.parseFloat(venue.location.longitude || "0"),
      }
    : undefined

  const priceRanges = apiEvent.priceRanges || []
  let price = "Price TBA"
  if (priceRanges.length > 0) {
    const range = priceRanges[0]
    if (range.min === range.max) {
      price = `$${range.min.toFixed(2)}`
    } else {
      price = `$${range.min.toFixed(2)} - $${range.max.toFixed(2)}`
    }
  }

  const dateInfo = apiEvent.dates?.start
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  if (dateInfo?.localDate) {
    try {
      const date = new Date(dateInfo.localDate)
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      formattedDate = "Date TBA"
    }
  }

  if (dateInfo?.localTime) {
    try {
      const [hours, minutes] = dateInfo.localTime.split(":")
      const date = new Date()
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      formattedTime = "Time TBA"
    }
  }

  const classifications = apiEvent.classifications || []
  const category = classifications[0]?.segment?.name || classifications[0]?.genre?.name || "Event"

  const numericId = Number.parseInt(apiEvent.id.replace(/\D/g, "")) || Math.floor(Math.random() * 10000)
  const image = apiEvent.images?.[0]?.url || "/community-event.png"

  return {
    id: numericId,
    title: apiEvent.name,
    description: apiEvent.info || apiEvent.pleaseNote || "No description available.",
    category,
    date: formattedDate,
    time: formattedTime,
    location: venue?.name || "Venue TBA",
    address:
      [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(" ") || "Address TBA",
    price,
    image,
    organizer: {
      name: apiEvent._embedded?.attractions?.[0]?.name || "Event Organizer",
      avatar: apiEvent._embedded?.attractions?.[0]?.images?.[0]?.url || "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates,
    ticketLinks: apiEvent.url ? [{ source: "Ticketmaster", link: apiEvent.url }] : [],
  }
}
