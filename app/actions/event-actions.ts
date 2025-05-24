"use server"

import type { EventDetailProps } from "@/components/event-detail-modal"
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from "@/lib/env"

export interface EventSearchParams {
  location?: string
  keyword?: string
  size?: number
  startDate?: string
  endDate?: string
}

export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  error?: string
  source?: string
}

export async function fetchEvents(params: EventSearchParams): Promise<EventSearchResult> {
  try {
    console.log("🔍 Fetching events with params:", params)

    if (!RAPIDAPI_KEY) {
      throw new Error("RapidAPI key not configured")
    }

    const query = params.keyword || "events"
    const location = params.location || "New York"
    const size = params.size || 20

    console.log("🌐 Making RapidAPI request...")

    const url = `https://real-time-events-search.p.rapidapi.com/search-events?query=${encodeURIComponent(
      query,
    )}&location=${encodeURIComponent(location)}&date=any&is_virtual=false&start=0`

    console.log("📡 Request URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    console.log("📊 Response status:", response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ API Error Response:", errorText)
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("📦 Raw API response:", JSON.stringify(data, null, 2))

    if (data.status !== "OK") {
      throw new Error(`API returned error status: ${data.status}`)
    }

    if (!data.data || !data.data.events) {
      console.warn("⚠️ No events data in response")
      return {
        events: [],
        totalCount: 0,
        source: "RapidAPI",
      }
    }

    const events = transformRapidAPIEvents(data.data.events, size)
    console.log(`✅ Successfully transformed ${events.length} events`)

    return {
      events,
      totalCount: events.length,
      source: "RapidAPI",
    }
  } catch (error) {
    console.error("💥 Error in fetchEvents:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    // Return fallback events with error info
    const fallbackEvents = generateFallbackEvents(params.location || "New York", params.size || 20)

    return {
      events: fallbackEvents,
      totalCount: fallbackEvents.length,
      error: `API Error: ${errorMessage}. Showing sample events.`,
      source: "Fallback",
    }
  }
}

function transformRapidAPIEvents(events: any[], maxCount: number): EventDetailProps[] {
  console.log(`🔄 Transforming ${events.length} events...`)

  return events.slice(0, maxCount).map((event, index) => {
    const venue = event.venue || {}
    const startDate = event.start_time ? new Date(event.start_time) : new Date()

    // Generate coordinates if not available
    let coordinates: { lat: number; lng: number } | undefined
    if (venue.latitude && venue.longitude) {
      coordinates = { lat: Number(venue.latitude), lng: Number(venue.longitude) }
    } else {
      // Generate random coordinates around NYC as fallback
      const baseLat = 40.7128
      const baseLng = -74.006
      const randomOffset = () => (Math.random() - 0.5) * 0.1 // ~5km radius
      coordinates = {
        lat: baseLat + randomOffset(),
        lng: baseLng + randomOffset(),
      }
    }

    const transformedEvent: EventDetailProps = {
      id: Math.abs(
        event.event_id?.split("").reduce((a: number, b: string) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0) || Math.floor(Math.random() * 10000) + index,
      ),
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

    console.log(`✨ Transformed event ${index + 1}:`, transformedEvent.title)
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
  console.log(`🎭 Generating ${count} fallback events for ${location}`)

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
