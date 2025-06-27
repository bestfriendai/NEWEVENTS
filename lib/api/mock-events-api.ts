import type { EventDetailProps } from "@/components/event-detail-modal"
import { logger } from "@/lib/utils/logger"

// Mock event templates
const EVENT_TEMPLATES = [
  {
    category: "Music",
    titles: ["Live Concert", "Jazz Night", "Rock Festival", "Classical Performance", "DJ Set"],
    venues: ["Madison Square Garden", "Blue Note", "Central Park", "Lincoln Center", "Brooklyn Bowl"],
    priceRange: { min: 25, max: 150 }
  },
  {
    category: "Sports",
    titles: ["Basketball Game", "Baseball Match", "Tennis Tournament", "Marathon", "Boxing Match"],
    venues: ["Barclays Center", "Yankee Stadium", "Arthur Ashe Stadium", "Central Park", "Madison Square Garden"],
    priceRange: { min: 30, max: 200 }
  },
  {
    category: "Arts",
    titles: ["Art Exhibition", "Theater Performance", "Dance Show", "Film Screening", "Poetry Reading"],
    venues: ["MoMA", "Broadway Theater", "Lincoln Center", "Film Forum", "92nd Street Y"],
    priceRange: { min: 15, max: 100 }
  },
  {
    category: "Food",
    titles: ["Food Festival", "Wine Tasting", "Cooking Class", "Restaurant Week", "Farmers Market"],
    venues: ["Brooklyn Navy Yard", "Chelsea Market", "Union Square", "Grand Central", "Smorgasburg"],
    priceRange: { min: 10, max: 75 }
  },
  {
    category: "Business",
    titles: ["Tech Conference", "Startup Pitch", "Networking Event", "Workshop", "Seminar"],
    venues: ["Javits Center", "WeWork", "Google NYC", "Columbia University", "NYU"],
    priceRange: { min: 0, max: 500 }
  },
  {
    category: "Family",
    titles: ["Kids Show", "Family Festival", "Zoo Event", "Museum Day", "Circus"],
    venues: ["Central Park Zoo", "Children's Museum", "Prospect Park", "Bronx Zoo", "Coney Island"],
    priceRange: { min: 0, max: 50 }
  }
]

const CITIES_DATA = {
  "New York": { lat: 40.7128, lng: -74.006, state: "NY" },
  "Los Angeles": { lat: 34.0522, lng: -118.2437, state: "CA" },
  "Chicago": { lat: 41.8781, lng: -87.6298, state: "IL" },
  "Houston": { lat: 29.7604, lng: -95.3698, state: "TX" },
  "Phoenix": { lat: 33.4484, lng: -112.074, state: "AZ" },
  "Philadelphia": { lat: 39.9526, lng: -75.1652, state: "PA" },
  "San Antonio": { lat: 29.4241, lng: -98.4936, state: "TX" },
  "San Diego": { lat: 32.7157, lng: -117.1611, state: "CA" },
  "Dallas": { lat: 32.7767, lng: -96.797, state: "TX" },
  "San Jose": { lat: 37.3382, lng: -121.8863, state: "CA" },
  "Austin": { lat: 30.2672, lng: -97.7431, state: "TX" },
  "San Francisco": { lat: 37.7749, lng: -122.4194, state: "CA" },
  "Seattle": { lat: 47.6062, lng: -122.3321, state: "WA" },
  "Denver": { lat: 39.7392, lng: -104.9903, state: "CO" },
  "Boston": { lat: 42.3601, lng: -71.0589, state: "MA" },
  "Miami": { lat: 25.7617, lng: -80.1918, state: "FL" },
  "Atlanta": { lat: 33.749, lng: -84.388, state: "GA" },
  "Las Vegas": { lat: 36.1699, lng: -115.1398, state: "NV" },
  "Portland": { lat: 45.5152, lng: -122.6784, state: "OR" },
  "Washington": { lat: 38.9072, lng: -77.0369, state: "DC" }
}

export class MockEventsAPI {
  private generatedEvents: Map<string, EventDetailProps[]> = new Map()

  /**
   * Generate mock events for a location
   */
  async generateEvents(params: {
    lat?: number
    lng?: number
    location?: string
    limit?: number
    category?: string
    offset?: number
  }): Promise<EventDetailProps[]> {
    const limit = params.limit || 20
    const offset = params.offset || 0
    const category = params.category
    
    // Determine city from coordinates or location string
    let city = "New York"
    let cityData = CITIES_DATA[city]
    
    if (params.location) {
      for (const [cityName, data] of Object.entries(CITIES_DATA)) {
        if (params.location.toLowerCase().includes(cityName.toLowerCase())) {
          city = cityName
          cityData = data
          break
        }
      }
    } else if (params.lat && params.lng) {
      // Find closest city
      let minDistance = Infinity
      for (const [cityName, data] of Object.entries(CITIES_DATA)) {
        const distance = this.calculateDistance(params.lat, params.lng, data.lat, data.lng)
        if (distance < minDistance) {
          minDistance = distance
          city = cityName
          cityData = data
        }
      }
    }

    // Check cache
    const cacheKey = `${city}-${category || 'all'}-${limit}-${offset}`
    if (this.generatedEvents.has(cacheKey)) {
      return this.generatedEvents.get(cacheKey)!
    }

    const events: EventDetailProps[] = []
    const templates = category 
      ? EVENT_TEMPLATES.filter(t => t.category === category)
      : EVENT_TEMPLATES

    for (let i = 0; i < limit; i++) {
      const template = templates[(i + offset) % templates.length]
      const titleIndex = (i + offset) % template.titles.length
      const venueIndex = (i + offset) % template.venues.length
      
      // Generate date between tomorrow and 60 days from now
      const daysFromNow = Math.floor(Math.random() * 60) + 1
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + daysFromNow)
      
      // Random time between 10 AM and 10 PM
      const hour = Math.floor(Math.random() * 12) + 10
      const minutes = Math.random() < 0.5 ? "00" : "30"
      
      const formattedDate = eventDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
      
      const formattedTime = `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`
      
      // Calculate price
      const isFree = Math.random() < 0.2
      const price = isFree 
        ? "Free" 
        : `$${Math.floor(Math.random() * (template.priceRange.max - template.priceRange.min) + template.priceRange.min)}`

      // Add some variance to coordinates
      const latVariance = (Math.random() - 0.5) * 0.1
      const lngVariance = (Math.random() - 0.5) * 0.1

      events.push({
        id: offset + i + 1,
        title: `${template.titles[titleIndex]} - ${city}`,
        description: `Join us for an amazing ${template.category.toLowerCase()} event in ${city}. This ${template.titles[titleIndex].toLowerCase()} promises to be an unforgettable experience!`,
        category: template.category,
        date: formattedDate,
        time: formattedTime,
        location: template.venues[venueIndex],
        address: `${template.venues[venueIndex]}, ${city}, ${cityData.state}`,
        price,
        image: `/event-${((i + offset) % 12) + 1}.png`,
        organizer: {
          name: `${city} ${template.category} Society`,
          avatar: `/avatar-${((i + offset) % 6) + 1}.png`
        },
        attendees: Math.floor(Math.random() * 500) + 50,
        isFavorite: false,
        coordinates: {
          lat: cityData.lat + latVariance,
          lng: cityData.lng + lngVariance
        },
        ticketLinks: [
          { source: "MockTickets", link: "#" }
        ],
        tags: [template.category, city, "Live Event"]
      })
    }

    // Cache results
    this.generatedEvents.set(cacheKey, events)
    
    logger.info("Generated mock events", {
      component: "MockEventsAPI",
      action: "generateEvents",
      metadata: { city, count: events.length, category: category || "all" }
    })

    return events
  }

  /**
   * Search events with filters
   */
  async searchEvents(params: {
    query?: string
    lat?: number
    lng?: number
    location?: string
    category?: string
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
  }): Promise<{ events: EventDetailProps[]; totalCount: number }> {
    let events = await this.generateEvents(params)
    
    // Apply query filter
    if (params.query) {
      const query = params.query.toLowerCase()
      events = events.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      )
    }

    // Apply date filters
    if (params.startDate || params.endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.date)
        if (params.startDate && eventDate < new Date(params.startDate)) return false
        if (params.endDate && eventDate > new Date(params.endDate)) return false
        return true
      })
    }

    return {
      events,
      totalCount: events.length * 3 // Simulate having more events available
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(limit = 8): Promise<EventDetailProps[]> {
    const cities = ["New York", "Los Angeles", "Chicago", "San Francisco"]
    const allEvents: EventDetailProps[] = []
    
    for (const city of cities) {
      const events = await this.generateEvents({ 
        location: city, 
        limit: Math.ceil(limit / cities.length) 
      })
      allEvents.push(...events)
    }

    // Shuffle and return requested amount
    return allEvents
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((event, index) => ({
        ...event,
        id: index + 2000 // Different ID range for featured
      }))
  }

  /**
   * Calculate distance between coordinates
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8 // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.generatedEvents.clear()
    logger.info("Mock events cache cleared", {
      component: "MockEventsAPI",
      action: "clearCache"
    })
  }
}

export const mockEventsAPI = new MockEventsAPI()