import type { EventDetailProps } from "@/components/event-detail-modal"
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from "@/lib/env"
import { geocodeAddress } from "@/lib/api/map-api"

// Update the ApiProvider type to include "rapidapi"
type ApiProvider = "ticketmaster" | "eventbrite" | "predicthq" | "rapidapi"

// Define the API provider to use - hardcoded to "rapidapi" to avoid import issues
const API_PROVIDER: ApiProvider = "rapidapi"

// Interface for search parameters
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

// Function to test API connectivity
async function testRapidApiConnection(): Promise<boolean> {
  try {
    console.log("Testing RapidAPI connection...")
    console.log("API Key:", RAPIDAPI_KEY ? "Present" : "Missing")
    console.log("API Host:", RAPIDAPI_HOST)

    // Simple test request with minimal parameters
    const testUrl = `https://real-time-events-search.p.rapidapi.com/search-events?query=test&location=New York&limit=1`
    console.log("Test URL:", testUrl)

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API test failed:", response.status, errorText)
      return false
    }

    const data = await response.json()
    console.log("API test successful:", data.status)
    return true
  } catch (error) {
    console.error("API connection test failed:", error)
    return false
  }
}

// Updated function to transform RapidAPI event to our app format
function transformRapidApiEvent(apiResponse: any): EventDetailProps {
  // The API returns data in a nested structure
  const event = apiResponse.data || apiResponse

  // Extract basic event information
  const eventId = event.event_id || Math.floor(Math.random() * 10000).toString()
  const title = event.name || "Untitled Event"
  const description = event.description || "No description available."

  // Extract date and time information
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  if (event.start_time) {
    const startDate = new Date(event.start_time)
    formattedDate = startDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    if (event.end_time) {
      const endDate = new Date(event.end_time)
      const endTime = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      formattedTime = `${startTime} - ${endTime}`
    } else {
      formattedTime = `${startTime} onwards`
    }
  }

  // Extract venue information
  const venue = event.venue || {}
  const location = venue.name || "Venue TBA"
  const address = venue.full_address || "Address TBA"

  // Extract coordinates for map markers
  const coordinates =
    venue.latitude !== undefined && venue.longitude !== undefined
      ? { lat: Number(venue.latitude), lng: Number(venue.longitude) }
      : undefined

  // Extract ticket links
  const ticketLinks =
    event.ticket_links && Array.isArray(event.ticket_links)
      ? event.ticket_links.map((link: any) => ({
          source: link.source || "Ticket Provider",
          link: link.link,
        }))
      : []

  // Add info links if no ticket links are available
  if (ticketLinks.length === 0 && event.info_links && Array.isArray(event.info_links)) {
    event.info_links.forEach((link: any) => {
      if (link.source && link.link) {
        ticketLinks.push({
          source: link.source,
          link: link.link,
        })
      }
    })
  }

  // Add main event link if available
  if (ticketLinks.length === 0 && event.link) {
    ticketLinks.push({
      source: event.publisher || "Event Link",
      link: event.link,
    })
  }

  // Extract price information from ticket links
  let price = "Price TBA"
  if (ticketLinks.length > 0) {
    price = "Tickets Available"
  }

  // Extract image
  const imageUrl = event.thumbnail || "/community-event.png"

  // Extract category from tags
  const category =
    event.tags && event.tags.length > 0 ? event.tags[0].charAt(0).toUpperCase() + event.tags[0].slice(1) : "Event"

  // Create organizer information
  const organizerName = venue.name || event.publisher || "Event Organizer"

  // Generate a numeric ID from the event_id string
  const numericId = Math.abs(
    eventId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0),
  )

  return {
    id: numericId,
    title,
    description,
    category,
    date: formattedDate,
    time: formattedTime,
    location,
    address,
    price,
    image: imageUrl,
    organizer: {
      name: organizerName,
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates,
    ticketLinks,
  }
}

// Helper function to format location for the API
async function formatLocationForApi(location: string): Promise<string> {
  // Check if location is in the format of coordinates (lat,lng)
  const coordsRegex = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/
  if (coordsRegex.test(location)) {
    console.log("Location is in coordinates format:", location)
    return location // Return as is if it's already in coordinates format
  }

  // If it's not coordinates, try to geocode it to get a more precise location
  try {
    const geocoded = await geocodeAddress(location)
    if (geocoded) {
      console.log("Geocoded location:", geocoded)
      return `${geocoded.lat},${geocoded.lng}` // Return as coordinates
    }
  } catch (error) {
    console.error("Error geocoding location:", error)
  }

  // If geocoding fails or isn't needed, return the original location
  console.log("Using original location string:", location)
  return location
}

// Add these functions to search for events using RapidAPI
async function searchRapidApiEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
}> {
  // Ensure we have at least some default parameters to avoid 400 errors
  const {
    keyword = "events",
    location = "New York",
    radius = 50,
    startDateTime,
    endDateTime,
    page = 0,
    size = 20,
  } = params

  try {
    // Format the location parameter for the API
    const formattedLocation = await formatLocationForApi(location)
    console.log("Formatted location for API:", formattedLocation)

    // Build query parameters for the search endpoint
    const queryParams = new URLSearchParams()

    // CRITICAL: The API requires a query parameter
    queryParams.append("query", keyword)

    // Add other parameters
    if (formattedLocation) queryParams.append("location", formattedLocation)
    if (radius) queryParams.append("radius", `${radius}mi`)
    if (startDateTime) queryParams.append("start_date", startDateTime)
    if (endDateTime) queryParams.append("end_date", endDateTime)
    queryParams.append("limit", size.toString())
    queryParams.append("offset", (page * size).toString())

    // Log the request details for debugging
    const requestUrl = `https://real-time-events-search.p.rapidapi.com/search-events?${queryParams.toString()}`
    console.log("Making RapidAPI request to:", requestUrl)

    // Make API request to search events with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("Response received:", response.status, response.statusText)

    if (!response.ok) {
      // Get more detailed error information
      let errorText = ""
      try {
        const errorData = await response.json()
        errorText = JSON.stringify(errorData)
      } catch (e) {
        try {
          errorText = await response.text()
        } catch (e2) {
          errorText = "Could not parse error response"
        }
      }

      throw new Error(`RapidAPI HTTP error: ${response.status} ${response.statusText}. Details: ${errorText}`)
    }

    const data = await response.json()
    console.log("API response received successfully")

    // Handle the API response structure
    let events: EventDetailProps[] = []
    let totalCount = 0

    if (data.status === "OK" && data.data) {
      // If data.data is an array of events
      if (Array.isArray(data.data)) {
        events = data.data.map(transformRapidApiEvent)
        totalCount = events.length
      }
      // If data.data contains events in a nested structure
      else if (data.data.events && Array.isArray(data.data.events)) {
        events = data.data.events.map(transformRapidApiEvent)
        totalCount = data.data.total_count || events.length
      }
      // If it's a single event wrapped in data
      else {
        events = [transformRapidApiEvent(data)]
        totalCount = 1
      }
    } else {
      console.warn("Unexpected API response structure:", data)
    }

    console.log(`Successfully processed ${events.length} events`)

    return {
      events,
      totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / size) || 1,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.")
      }
      console.error("RapidAPI search error:", error.message)
      throw new Error(`API request failed: ${error.message}`)
    } else {
      console.error("Unknown RapidAPI search error:", error)
      throw new Error("An unknown error occurred while searching for events")
    }
  }
}

async function getRapidApiEventDetails(eventId: string): Promise<EventDetailProps | null> {
  try {
    console.log("Fetching event details for ID:", eventId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(`https://real-time-events-search.p.rapidapi.com/event-details?event_id=${eventId}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Get more detailed error information
      let errorText = ""
      try {
        const errorData = await response.json()
        errorText = JSON.stringify(errorData)
      } catch (e) {
        try {
          errorText = await response.text()
        } catch (e2) {
          errorText = "Could not parse error response"
        }
      }

      throw new Error(`RapidAPI HTTP error: ${response.status} ${response.statusText}. Details: ${errorText}`)
    }

    const apiResponse = await response.json()

    // Check if the response is successful
    if (apiResponse.status === "OK" && apiResponse.data) {
      return transformRapidApiEvent(apiResponse)
    }

    return null
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.")
      }
      console.error("RapidAPI event details error:", error.message)
      throw error
    } else {
      console.error("Unknown RapidAPI event details error:", error)
      throw new Error("An unknown error occurred while fetching event details")
    }
  }
}

// Function to search for events - only using RapidAPI
export async function searchEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
}> {
  try {
    return await searchRapidApiEvents(params)
  } catch (error) {
    console.error("Search events error:", error)
    // Return empty results instead of mock data
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
    }
  }
}

// Function to get event details - only using RapidAPI
export async function getEventDetails(eventId: string): Promise<EventDetailProps | null> {
  try {
    return await getRapidApiEventDetails(eventId)
  } catch (error) {
    console.error("Get event details error:", error)
    return null
  }
}

// Function to get featured events - only using RapidAPI
export async function getFeaturedEvents(limit = 2): Promise<EventDetailProps[]> {
  try {
    const params: EventSearchParams = {
      keyword: "featured",
      location: "New York",
      size: limit,
    }

    const { events } = await searchEvents(params)
    return events
  } catch (error) {
    console.error("Error getting featured events:", error)
    return []
  }
}

// Function to get events by category - only using RapidAPI
export async function getEventsByCategory(category: string, limit = 6): Promise<EventDetailProps[]> {
  try {
    const params: EventSearchParams = {
      keyword: category,
      location: "New York",
      size: limit,
    }

    const { events } = await searchEvents(params)
    return events
  } catch (error) {
    console.error(`Error getting events for category ${category}:`, error)
    return []
  }
}

// Function to get events by location - only using RapidAPI
export async function getEventsByLocation(location: string, radius = 25, limit = 10): Promise<EventDetailProps[]> {
  try {
    // Format the location parameter for the API
    const formattedLocation = await formatLocationForApi(location)
    console.log("Getting events by location:", formattedLocation)

    const { events } = await searchRapidApiEvents({
      keyword: "events",
      location: formattedLocation,
      radius,
      size: limit,
    })
    return events
  } catch (error) {
    console.error(`Error getting events for location ${location}:`, error)
    return []
  }
}

// Export the test function for debugging
export { testRapidApiConnection }
