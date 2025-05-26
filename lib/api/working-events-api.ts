import { logger } from "@/lib/utils/logger"

export interface WorkingEvent {
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

export interface LocationSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  category?: string
  startDate?: string
  endDate?: string
  limit?: number
}

// Mock events data
const MOCK_EVENTS: WorkingEvent[] = [
  {
    id: "event_1",
    title: "Summer Music Festival 2025",
    description:
      "Join us for an amazing outdoor music festival featuring top artists from around the world. Food trucks, art installations, and great vibes!",
    category: "Music",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "23:00",
    venue: {
      name: "Golden Gate Park",
      address: "501 Stanyan St",
      city: "San Francisco",
      state: "CA",
      country: "US",
      lat: 37.7694,
      lng: -122.4862,
    },
    pricing: {
      min: 45,
      max: 125,
      currency: "USD",
      isFree: false,
    },
    organizer: {
      name: "SF Music Events",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Music+Festival"],
    ticketUrl: "https://example.com/tickets",
    rating: 4.7,
    tags: ["Music", "Festival", "Outdoor", "Food"],
    source: "EventBrite",
    popularity: 1250,
  },
  {
    id: "event_2",
    title: "Tech Startup Networking Night",
    description:
      "Connect with fellow entrepreneurs, investors, and tech enthusiasts. Pitch your ideas and discover new opportunities.",
    category: "Business",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "22:00",
    venue: {
      name: "Innovation Hub",
      address: "123 Market St",
      city: "San Francisco",
      state: "CA",
      country: "US",
      lat: 37.7749,
      lng: -122.4194,
    },
    pricing: {
      min: 0,
      max: 0,
      currency: "USD",
      isFree: true,
    },
    organizer: {
      name: "SF Tech Community",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Tech+Networking"],
    ticketUrl: "https://example.com/tickets",
    rating: 4.3,
    tags: ["Technology", "Networking", "Startup", "Business"],
    source: "Meetup",
    popularity: 680,
  },
  {
    id: "event_3",
    title: "Local Art Gallery Opening",
    description:
      "Discover amazing local artists and their latest works. Wine, cheese, and great conversation included!",
    category: "Arts",
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "17:00",
    endTime: "21:00",
    venue: {
      name: "Mission Art Gallery",
      address: "456 Mission St",
      city: "San Francisco",
      state: "CA",
      country: "US",
      lat: 37.7849,
      lng: -122.4094,
    },
    pricing: {
      min: 15,
      max: 25,
      currency: "USD",
      isFree: false,
    },
    organizer: {
      name: "Mission Arts Collective",
      verified: false,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Art+Gallery"],
    ticketUrl: "https://example.com/tickets",
    rating: 4.5,
    tags: ["Art", "Gallery", "Local", "Wine"],
    source: "Local Events",
    popularity: 320,
  },
  {
    id: "event_4",
    title: "Comedy Night at The Laugh Track",
    description: "Get ready to laugh until your sides hurt! Featuring both established comedians and rising stars.",
    category: "Comedy",
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "20:00",
    endTime: "22:30",
    venue: {
      name: "The Laugh Track",
      address: "789 Comedy Ave",
      city: "San Francisco",
      state: "CA",
      country: "US",
      lat: 37.7649,
      lng: -122.4294,
    },
    pricing: {
      min: 20,
      max: 35,
      currency: "USD",
      isFree: false,
    },
    organizer: {
      name: "SF Comedy Club",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Comedy+Night"],
    ticketUrl: "https://example.com/tickets",
    rating: 4.6,
    tags: ["Comedy", "Entertainment", "Nightlife"],
    source: "Ticketmaster",
    popularity: 890,
  },
  {
    id: "event_5",
    title: "Family Fun Day at the Park",
    description: "A perfect day out for the whole family! Games, activities, face painting, and more.",
    category: "Family",
    startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "16:00",
    venue: {
      name: "Dolores Park",
      address: "Dolores St & 18th St",
      city: "San Francisco",
      state: "CA",
      country: "US",
      lat: 37.7596,
      lng: -122.4269,
    },
    pricing: {
      min: 0,
      max: 0,
      currency: "USD",
      isFree: true,
    },
    organizer: {
      name: "SF Parks & Recreation",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Family+Fun+Day"],
    rating: 4.4,
    tags: ["Family", "Kids", "Outdoor", "Free"],
    source: "City Events",
    popularity: 560,
  },
  {
    id: "event_6",
    title: "Warriors vs Lakers Game",
    description: "Don't miss this epic basketball showdown between two legendary teams!",
    category: "Sports",
    startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startTime: "19:30",
    endTime: "22:00",
    venue: {
      name: "Chase Center",
      address: "1 Warriors Way",
      city: "San Francisco",
      state: "CA",
      country: "US",
      lat: 37.7679,
      lng: -122.3874,
    },
    pricing: {
      min: 85,
      max: 350,
      currency: "USD",
      isFree: false,
    },
    organizer: {
      name: "Golden State Warriors",
      verified: true,
    },
    images: ["/placeholder.svg?height=300&width=400&text=Basketball+Game"],
    ticketUrl: "https://example.com/tickets",
    rating: 4.8,
    tags: ["Sports", "Basketball", "NBA", "Warriors"],
    source: "Ticketmaster",
    popularity: 2100,
  },
]

class WorkingEventsAPI {
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

  async searchEvents(params: LocationSearchParams): Promise<WorkingEvent[]> {
    try {
      logger.info("Starting event search", {
        component: "WorkingEventsAPI",
        action: "searchEvents",
        metadata: params,
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add distance calculations to events
      const eventsWithDistance = MOCK_EVENTS.map((event) => ({
        ...event,
        distance: this.calculateDistance(params.lat, params.lng, event.venue.lat, event.venue.lng),
      }))

      // Filter by radius
      let filteredEvents = eventsWithDistance.filter((event) => (event.distance || 0) <= params.radius)

      // Apply keyword filter if provided
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        filteredEvents = filteredEvents.filter(
          (event) =>
            event.title.toLowerCase().includes(keyword) ||
            event.description.toLowerCase().includes(keyword) ||
            event.tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
            event.venue.name.toLowerCase().includes(keyword),
        )
      }

      // Apply category filter if provided
      if (params.category && params.category !== "all") {
        filteredEvents = filteredEvents.filter((event) => event.category === params.category)
      }

      // Sort by distance
      filteredEvents.sort((a, b) => (a.distance || 0) - (b.distance || 0))

      // Apply limit
      const finalEvents = filteredEvents.slice(0, params.limit || 20)

      logger.info("Event search completed", {
        component: "WorkingEventsAPI",
        action: "searchEvents",
        metadata: {
          eventsFound: finalEvents.length,
          location: `${params.lat}, ${params.lng}`,
          radius: params.radius,
        },
      })

      return finalEvents
    } catch (error) {
      logger.error("Event search failed", {
        component: "WorkingEventsAPI",
        action: "searchEvents",
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

export const workingEventsAPI = new WorkingEventsAPI()
