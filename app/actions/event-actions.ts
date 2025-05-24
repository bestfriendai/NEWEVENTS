"use server"

import { z } from "zod"
import { unstable_cache } from "next/cache"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

export interface EventSearchParams {
  location?: string
  keyword?: string
  size?: number
  startDate?: string
  endDate?: string
  radius?: number
}

export interface EventSearchError {
  message: string
  type: 'API_ERROR' | 'CONFIG_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'
  statusCode?: number
}

export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  error?: EventSearchError
  source?: string
}

// Zod schemas for API validation
const RapidApiVenueSchema = z.object({
  name: z.string().optional(),
  full_address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
}).optional().nullable()

const RapidApiEventSchema = z.object({
  event_id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  venue: RapidApiVenueSchema,
  start_time: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  ticket_links: z.array(z.any()).optional(),
  publisher: z.string().optional(),
})

const RapidApiResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    events: z.array(RapidApiEventSchema).optional().nullable(),
  }).optional().nullable(),
})

// Cached version of the core API fetching logic
const getCachedEvents = unstable_cache(
  async (params: EventSearchParams) => {
    logger.info("Cache miss, fetching from API", {
      component: "event-actions",
      action: "cache_miss",
      metadata: { params }
    })
    return await _fetchEventsFromApi(params)
  },
  ['events-search-results'],
  {
    tags: ['events'],
    revalidate: 3600, // Revalidate every hour
  }
)

export async function fetchEvents(params: EventSearchParams): Promise<EventSearchResult> {
  try {
    logger.info("Fetching events", {
      component: "event-actions",
      action: "fetch_events_start",
      metadata: { params }
    })

    return await getCachedEvents(params)
  } catch (error) {
    logger.error("Error in fetchEvents", {
      component: "event-actions",
      action: "fetch_events_error",
      metadata: { params }
    }, error instanceof Error ? error : new Error("Unknown error"))

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    let errorType: EventSearchError['type'] = 'UNKNOWN_ERROR'

    if (errorMessage.includes('RapidAPI key')) {
      errorType = 'CONFIG_ERROR'
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorType = 'NETWORK_ERROR'
    } else if (errorMessage.includes('API')) {
      errorType = 'API_ERROR'
    }

    // Return fallback events with structured error info
    const fallbackEvents = generateFallbackEvents(params.location || "New York", params.size || 20)

    return {
      events: fallbackEvents,
      totalCount: fallbackEvents.length,
      error: {
        message: `${errorMessage}. Showing sample events.`,
        type: errorType,
      },
      source: "Fallback",
    }
  }
}

// Core API fetching logic (separated for caching)
async function _fetchEventsFromApi(params: EventSearchParams): Promise<EventSearchResult> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RapidAPI key not configured")
  }

  const query = params.keyword || "events"
  const location = params.location || "New York"
  const size = params.size || 20

  // Build query parameters with enhanced support
  const queryParams = new URLSearchParams({
    query: encodeURIComponent(query),
    location: encodeURIComponent(location),
    is_virtual: "false",
    start: "0"
  })

  // Add date range if provided
  if (params.startDate && params.endDate) {
    queryParams.set("date", `${params.startDate}..${params.endDate}`)
  } else if (params.startDate) {
    queryParams.set("date", `${params.startDate}..${params.startDate}`)
  } else {
    queryParams.set("date", "any")
  }

  // Note: RapidAPI real-time-events-search doesn't explicitly support radius with city names
  // This would need to be implemented if the API supports lat,lng location format

  const url = `https://real-time-events-search.p.rapidapi.com/search-events?${queryParams.toString()}`

  logger.debug("Making RapidAPI request", {
    component: "event-actions",
    action: "api_request",
    metadata: { url: url.replace(RAPIDAPI_KEY, '[REDACTED]') }
  })

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    signal: AbortSignal.timeout(15000), // 15 second timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error("API Error Response", {
      component: "event-actions",
      action: "api_error",
      metadata: { status: response.status, statusText: response.statusText, errorText }
    })
    throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Validate API response with Zod
  const parsedResponse = RapidApiResponseSchema.safeParse(data)
  
  if (!parsedResponse.success) {
    logger.error("API Response Validation Error", {
      component: "event-actions",
      action: "validation_error",
      metadata: { errors: parsedResponse.error.flatten() }
    })
    throw new Error("Invalid API response structure from RapidAPI")
  }

  const validatedData = parsedResponse.data

  if (validatedData.status !== "OK") {
    throw new Error(`API returned error status: ${validatedData.status}`)
  }

  if (!validatedData.data || !validatedData.data.events) {
    logger.warn("No events data in response", {
      component: "event-actions",
      action: "no_events_data"
    })
    return {
      events: [],
      totalCount: 0,
      source: "RapidAPI",
    }
  }

  const events = transformRapidAPIEvents(validatedData.data.events, size)
  
  logger.info("Successfully transformed events", {
    component: "event-actions",
    action: "transform_success",
    metadata: { eventCount: events.length }
  })

  return {
    events,
    totalCount: events.length,
    source: "RapidAPI",
  }
}

function transformRapidAPIEvents(events: any[], maxCount: number): EventDetailProps[] {
  logger.debug("Transforming events", {
    component: "event-actions",
    action: "transform_start",
    metadata: { eventCount: events.length, maxCount }
  })

  return events.slice(0, maxCount).map((event, index) => {
    const venue = event.venue || {}
    const startDate = event.start_time ? new Date(event.start_time) : new Date()

    // Generate stable, deterministic coordinates if not available
    let coordinates: { lat: number; lng: number } | undefined
    if (venue.latitude && venue.longitude) {
      const lat = Number(venue.latitude)
      const lng = Number(venue.longitude)
      
      // Validate coordinates are reasonable
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        coordinates = { lat, lng }
      }
    }
    
    if (!coordinates) {
      // Generate deterministic coordinates based on event data for consistency
      const seed = event.event_id || event.name || `event-${index}`
      const hash = seed.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      
      // Use hash to generate consistent coordinates around NYC
      const baseLat = 40.7128
      const baseLng = -74.006
      const latOffset = ((hash % 1000) / 1000 - 0.5) * 0.1 // ~5km radius
      const lngOffset = (((hash >> 10) % 1000) / 1000 - 0.5) * 0.1
      
      coordinates = {
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
      }
      
      logger.debug("Generated fallback coordinates", {
        component: "event-actions",
        action: "fallback_coordinates",
        metadata: { eventId: event.event_id, coordinates }
      })
    }

    // Generate stable ID using better hashing
    let eventId: number
    if (event.event_id) {
      // Create a stable hash from event_id
      eventId = Math.abs(event.event_id.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0))
    } else {
      // Fallback to hash of name + venue + date for uniqueness
      const uniqueString = `${event.name || ''}-${venue.name || ''}-${event.start_time || ''}-${index}`
      eventId = Math.abs(uniqueString.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0))
    }

    const transformedEvent: EventDetailProps = {
      id: eventId,
      title: event.name || `Event ${index + 1}`,
      description: event.description || "No description available.",
      category: extractCategory(event.tags || []),
      date: startDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      location: venue.name || "Venue TBA",
      address: venue.full_address || "Address TBA",
      price: event.ticket_links?.length > 0 ? "Tickets Available" : "Price TBA",
      image: event.thumbnail || `/event-${(index % 12) + 1}.png`,
      organizer: {
        name: venue.name || event.publisher || "Event Organizer",
        avatar: `/avatar-${(index % 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 1000) + 50,
      isFavorite: false,
      coordinates,
    }

    logger.debug("Transformed event", {
      component: "event-actions",
      action: "transform_event",
      metadata: {
        index: index + 1,
        title: transformedEvent.title,
        id: transformedEvent.id,
        hasCoordinates: !!coordinates
      }
    })
    
    return transformedEvent
  })
}

function extractCategory(tags: string[]): string {
  if (!tags || tags.length === 0) return "Event"

  const categoryMap: { [key: string]: string } = {
    music: "Music",
    concert: "Music",
    festival: "Music",
    art: "Arts",
    theater: "Arts",
    exhibition: "Arts",
    sport: "Sports",
    game: "Sports",
    food: "Food",
    restaurant: "Food",
    business: "Business",
    conference: "Business",
    networking: "Business",
  }

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerTag.includes(key)) return value
    }
  }

  return tags[0].charAt(0).toUpperCase() + tags[0].slice(1)
}

function generateFallbackEvents(location: string, count: number): EventDetailProps[] {
  logger.info("Generating fallback events", {
    component: "event-actions",
    action: "generate_fallback",
    metadata: { location, count }
  })

  const categories = ["Music", "Arts", "Sports", "Food", "Business"]
  const venues = ["Arena", "Theater", "Stadium", "Hall", "Center", "Park", "Gallery", "Club"]

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length]
    const venue = venues[index % venues.length]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1)

    return {
      id: 9000 + index,
      title: `${category} Event in ${location}`,
      description: `Join us for an amazing ${category.toLowerCase()} event in ${location}.`,
      category,
      date: futureDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
      location: `${venue} ${index + 1}`,
      address: `${location} Area`,
      price: Math.random() > 0.3 ? `$${Math.floor(Math.random() * 100) + 10}` : "Free",
      image: `/event-${(index % 12) + 1}.png`,
      organizer: {
        name: `${location} Events`,
        avatar: `/avatar-${(index % 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 500) + 50,
      isFavorite: false,
      coordinates: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.006 + (Math.random() - 0.5) * 0.1,
      },
    }
  })
}
