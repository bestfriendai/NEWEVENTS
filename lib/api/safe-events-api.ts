import { logger } from "@/lib/utils/logger"
import { withRetry } from "@/lib/utils"

export interface SafeEvent {
  id: string
  title: string
  description: string
  category: string
  startDate: string
  endDate?: string
  startTime: string
  endTime?: string
  venue: {
    name: string
    address: string
    city: string
    state: string
    country: string
    lat: number
    lng: number
  }
  pricing: {
    min: number
    max: number
    currency: string
    isFree: boolean
  }
  organizer: {
    name: string
    verified: boolean
  }
  images: string[]
  ticketUrl?: string
  website?: string
  capacity?: number
  attendeeCount?: number
  rating?: number
  tags: string[]
  source: string
  distance?: number
  popularity: number
}

export interface SafeLocationSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
}

// Fallback mock data for when APIs fail
const FALLBACK_EVENTS: SafeEvent[] = [
  {
    id: "fallback_1",
    title: "Local Music Festival",
    description: "A wonderful local music festival featuring various artists and food vendors.",
    category: "Music",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "23:00",
    venue: {
      name: "City Park Amphitheater",
      address: "123 Park Avenue",
      city: "Downtown",
      state: "CA",
      country: "US",
      lat: 37.7749,
      lng: -122.4194,
    },
    pricing: {
      min: 25,
      max: 75,
      currency: "USD",
      isFree: false,
    },
    organizer: {
      name: "City Events",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Music+Festival"],
    ticketUrl: "#",
    website: "#",
    rating: 4.5,
    tags: ["Music", "Festival", "Outdoor"],
    source: "Local Events",
    popularity: 850,
  },
  {
    id: "fallback_2",
    title: "Community Art Exhibition",
    description: "Showcasing local artists and their incredible works in various mediums.",
    category: "Arts",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "18:00",
    venue: {
      name: "Community Art Center",
      address: "456 Art Street",
      city: "Arts District",
      state: "CA",
      country: "US",
      lat: 37.7849,
      lng: -122.4094,
    },
    pricing: {
      min: 0,
      max: 0,
      currency: "USD",
      isFree: true,
    },
    organizer: {
      name: "Arts Community",
      verified: false,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Art+Exhibition"],
    ticketUrl: "#",
    website: "#",
    rating: 4.2,
    tags: ["Art", "Exhibition", "Community"],
    source: "Local Events",
    popularity: 320,
  },
  {
    id: "fallback_3",
    title: "Tech Meetup: AI & Machine Learning",
    description: "Join fellow tech enthusiasts to discuss the latest in AI and machine learning.",
    category: "Business",
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "21:00",
    venue: {
      name: "Tech Hub Coworking",
      address: "789 Innovation Blvd",
      city: "Tech Valley",
      state: "CA",
      country: "US",
      lat: 37.7649,
      lng: -122.4294,
    },
    pricing: {
      min: 0,
      max: 0,
      currency: "USD",
      isFree: true,
    },
    organizer: {
      name: "Tech Community",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Tech+Meetup"],
    ticketUrl: "#",
    website: "#",
    rating: 4.7,
    tags: ["Technology", "AI", "Networking"],
    source: "Local Events",
    popularity: 450,
  },
]

class SafeEventsAPI {
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLng = (lng2 - lng1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async safeApiCall<T>(apiName: string, apiCall: () => Promise<T>, fallbackValue: T): Promise<T> {
    try {
      return await withRetry(apiCall, 2, 1000)
    } catch (error) {
      logger.warn(`${apiName} API failed, using fallback`, {
        component: "SafeEventsAPI",
        action: "safeApiCall",
        error: error instanceof Error ? error.message : String(error),
      })
      return fallbackValue
    }
  }

  private generateFallbackEvents(params: SafeLocationSearchParams): SafeEvent[] {
    // Add distance calculations to fallback events
    const eventsWithDistance = FALLBACK_EVENTS.map((event) => ({
      ...event,
      distance: this.calculateDistance(params.lat, params.lng, event.venue.lat, event.venue.lng),
    }))

    // Filter by radius
    const filteredEvents = eventsWithDistance.filter((event) => (event.distance || 0) <= params.radius)

    // Apply keyword filter if provided
    let finalEvents = filteredEvents
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      finalEvents = filteredEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(keyword) ||
          event.description.toLowerCase().includes(keyword) ||
          event.tags.some((tag) => tag.toLowerCase().includes(keyword)),
      )
    }

    // Apply category filter if provided
    if (params.category && params.category !== "all") {
      finalEvents = finalEvents.filter((event) => event.category === params.category)
    }

    // Sort by distance
    finalEvents.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    return finalEvents.slice(0, params.limit || 10)
  }

  async searchEvents(params: SafeLocationSearchParams): Promise<SafeEvent[]> {
    logger.info("Starting safe event search", {
      component: "SafeEventsAPI",
      action: "searchEvents",
      metadata: params,
    })

    try {
      // For now, we'll use the fallback events to ensure the app works
      // In a real implementation, you would try the actual APIs first
      const fallbackEvents = this.generateFallbackEvents(params)

      logger.info("Event search completed successfully", {
        component: "SafeEventsAPI",
        action: "searchEvents",
        metadata: {
          eventsFound: fallbackEvents.length,
          location: `${params.lat}, ${params.lng}`,
          radius: params.radius,
        },
      })

      return fallbackEvents
    } catch (error) {
      logger.error("Event search failed completely", {
        component: "SafeEventsAPI",
        action: "searchEvents",
        error: error instanceof Error ? error.message : String(error),
      })

      // Return empty array as last resort
      return []
    }
  }
}

export const safeEventsAPI = new SafeEventsAPI()
