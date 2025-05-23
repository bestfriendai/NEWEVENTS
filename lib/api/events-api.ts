import type { EventDetailProps } from "@/components/event-detail-modal"
import { searchEnhancedEvents, type EnhancedEventSearchParams } from "@/lib/api/enhanced-events-api"
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from "@/lib/env"

// Interface for search parameters (keeping backward compatibility)
export interface EventSearchParams {
  keyword?: string
  location?: string
  radius?: number // in miles
  startDateTime?: string
  endDateTime?: string
  categories?: string[]
  page?: number
  size?: number
  sort?: string
}

// Function to search for events using the enhanced API with more results
export async function searchEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources?: string[]
}> {
  try {
    console.log("Searching events with params:", params)

    // Convert to enhanced params
    const enhancedParams: EnhancedEventSearchParams = {
      ...params,
      size: params.size || 50, // Increased default size
      userPreferences: {
        favoriteCategories: params.categories,
        pricePreference: "any",
        timePreference: "any",
      },
    }

    return await searchEnhancedEvents(enhancedParams)
  } catch (error) {
    console.error("Search events error:", error)
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      sources: [],
    }
  }
}

// Function to get event details - enhanced with multiple source checking
export async function getEventDetails(eventId: string): Promise<EventDetailProps | null> {
  try {
    console.log("Getting event details for ID:", eventId)

    // Try to get details directly from RapidAPI
    try {
      const response = await fetch(
        `https://real-time-events-search.p.rapidapi.com/event-details?event_id=${encodeURIComponent(eventId)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("RapidAPI event details response:", data)

        if (data.status === "OK" && data.data) {
          // Transform the event data
          const event = data.data
          const venue = event.venue || {}

          // Generate numeric ID
          const numericId = Math.abs(
            event.event_id?.split("").reduce((a: number, b: string) => {
              a = (a << 5) - a + b.charCodeAt(0)
              return a & a
            }, 0) || Math.floor(Math.random() * 10000),
          )

          // Format dates
          const startDate = event.start_time ? new Date(event.start_time) : new Date()
          const endDate = event.end_time ? new Date(event.end_time) : null

          const formattedDate = startDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })

          const formattedTime = endDate
            ? `${startDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })} - ${endDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}`
            : `${startDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })} onwards`

          // Extract ticket links
          const ticketLinks = []

          if (event.ticket_links) {
            ticketLinks.push(
              ...event.ticket_links.map((link: any) => ({
                source: link.source || "Ticket Provider",
                link: link.link,
              })),
            )
          }

          // Add info links if no ticket links
          if (ticketLinks.length === 0 && event.info_links) {
            ticketLinks.push(
              ...event.info_links.slice(0, 3).map((link: any) => ({
                source: link.source || "Event Info",
                link: link.link,
              })),
            )
          }

          // Extract category from tags
          const category = extractCategory(event.tags || [])

          return {
            id: numericId,
            title: event.name || "Untitled Event",
            description: event.description || "No description available.",
            category,
            date: formattedDate,
            time: formattedTime,
            location: venue.name || "Venue TBA",
            address: venue.full_address || "Address TBA",
            price: ticketLinks.length > 0 ? "Tickets Available" : "Price TBA",
            image: event.thumbnail || "/community-event.png",
            organizer: {
              name: venue.name || event.publisher || "Event Organizer",
              avatar: "/avatar-1.png",
            },
            attendees: Math.floor(Math.random() * 1000) + 50,
            isFavorite: false,
            coordinates:
              venue.latitude && venue.longitude
                ? { lat: Number(venue.latitude), lng: Number(venue.longitude) }
                : undefined,
            ticketLinks,
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event details from RapidAPI:", error)
    }

    // If RapidAPI fails, try to get details from enhanced search
    const searchResult = await searchEnhancedEvents({
      keyword: eventId,
      size: 1,
    })

    if (searchResult.events.length > 0) {
      return searchResult.events[0]
    }

    return null
  } catch (error) {
    console.error("Get event details error:", error)
    return null
  }
}

// Helper function to extract category from tags
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

// Function to get featured events using enhanced search with more results
export async function getFeaturedEvents(limit = 20): Promise<EventDetailProps[]> {
  try {
    console.log("Getting featured events with limit:", limit)

    const { events } = await searchEnhancedEvents({
      keyword: "featured popular trending concerts festivals",
      location: "New York",
      size: limit,
      userPreferences: {
        favoriteCategories: ["music", "arts", "sports"],
        pricePreference: "any",
        timePreference: "any",
      },
    })

    return events
  } catch (error) {
    console.error("Error getting featured events:", error)
    return []
  }
}

// Function to get events by category using enhanced search with more results
export async function getEventsByCategory(category: string, limit = 30): Promise<EventDetailProps[]> {
  try {
    console.log("Getting events for category:", category)

    const { events } = await searchEnhancedEvents({
      keyword: category,
      location: "New York",
      size: limit,
      categories: [category.toLowerCase()],
      userPreferences: {
        favoriteCategories: [category.toLowerCase()],
        pricePreference: "any",
        timePreference: "any",
      },
    })

    return events
  } catch (error) {
    console.error(`Error getting events for category ${category}:`, error)
    return []
  }
}

// Function to get events by location using enhanced search with user preferences
export async function getEventsByLocation(
  location: string,
  radius = 25,
  limit = 10,
  userPreferences?: EnhancedEventSearchParams["userPreferences"],
): Promise<EventDetailProps[]> {
  try {
    console.log("Getting events by location:", location)

    const { events } = await searchEnhancedEvents({
      keyword: "events",
      location,
      radius,
      size: limit,
      userPreferences: userPreferences || {
        favoriteCategories: [],
        pricePreference: "any",
        timePreference: "any",
      },
    })

    return events
  } catch (error) {
    console.error(`Error getting events for location ${location}:`, error)
    return []
  }
}

// New function to get personalized events based on user location and preferences
export async function getPersonalizedEvents(
  coordinates: { lat: number; lng: number },
  userPreferences: EnhancedEventSearchParams["userPreferences"],
  radius = 25,
  limit = 20,
): Promise<{
  events: EventDetailProps[]
  sources: string[]
}> {
  try {
    console.log("Getting personalized events for coordinates:", coordinates)

    const result = await searchEnhancedEvents({
      coordinates,
      radius,
      size: limit,
      userPreferences,
      keyword: userPreferences?.favoriteCategories?.join(" ") || "events",
    })

    return {
      events: result.events,
      sources: result.sources || [],
    }
  } catch (error) {
    console.error("Error getting personalized events:", error)
    return {
      events: [],
      sources: [],
    }
  }
}

// Export the enhanced search function for direct use
export { searchEnhancedEvents, type EnhancedEventSearchParams }
