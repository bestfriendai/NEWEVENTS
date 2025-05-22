import type { EventDetailProps } from "@/components/event-detail-modal"
import { API_CONFIG, DEFAULT_API_PROVIDER } from "@/lib/env"

// Define the API provider to use
type ApiProvider = "ticketmaster" | "eventbrite" | "predicthq" | "mock"
const API_PROVIDER: ApiProvider = DEFAULT_API_PROVIDER as ApiProvider

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

// Function to transform Ticketmaster event to our app format
function transformTicketmasterEvent(event: any): EventDetailProps {
  const images = event.images || []
  const mainImage = images.find((img: any) => img.ratio === "16_9" && img.width > 500) || images[0] || { url: "" }

  const venue = event._embedded?.venues?.[0] || {}
  const priceRanges = event.priceRanges || [{ min: 0, max: 0, currency: "USD" }]
  const minPrice = priceRanges[0]?.min || 0
  const maxPrice = priceRanges[0]?.max || 0
  const currency = priceRanges[0]?.currency || "USD"

  const startDate = event.dates?.start?.dateTime ? new Date(event.dates.start.dateTime) : new Date()
  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = event.dates?.start?.localTime || ""

  return {
    id: Number.parseInt(event.id) || Math.floor(Math.random() * 10000),
    title: event.name || "Untitled Event",
    description: event.description || event.info || "No description available.",
    category: event.classifications?.[0]?.segment?.name || "Event",
    date: formattedDate,
    time: formattedTime ? `${formattedTime} ${event.dates?.start?.localTime ? "onwards" : ""}` : "Time TBA",
    location: venue.name || "Venue TBA",
    address: [venue.address?.line1, venue.city?.name, venue.state?.stateCode].filter(Boolean).join(", "),
    price:
      priceRanges.length > 0
        ? `${currency} ${minPrice}${maxPrice > minPrice ? ` - ${currency} ${maxPrice}` : ""}`
        : "Price TBA",
    image: mainImage.url || "/community-event.png",
    organizer: {
      name: event.promoter?.name || venue.name || "Event Organizer",
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50, // Ticketmaster doesn't provide attendee count
    isFavorite: false,
  }
}

// Function to transform Eventbrite event to our app format
function transformEventbriteEvent(event: any): EventDetailProps {
  // Extract the event data
  const name = event.name?.text || "Untitled Event"
  const description = event.description?.text || "No description available."
  const startDate = event.start?.utc ? new Date(event.start.utc) : new Date()
  const endDate = event.end?.utc ? new Date(event.end.utc) : new Date()

  // Format date and time
  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const formattedTime = `${formattedStartTime} - ${formattedEndTime}`

  // Extract venue information
  const venueName = event.venue?.name || "Venue TBA"
  const venueAddress = [
    event.venue?.address?.address_1,
    event.venue?.address?.city,
    event.venue?.address?.region,
    event.venue?.address?.postal_code,
    event.venue?.address?.country,
  ]
    .filter(Boolean)
    .join(", ")

  // Extract price information
  const isFree = event.is_free
  const price = isFree ? "Free" : "Paid"

  // Extract image
  const imageUrl = event.logo?.url || "/community-event.png"

  // Extract organizer information
  const organizerName = event.organizer?.name || "Event Organizer"

  // Extract category
  const category = event.category?.name || "Event"

  return {
    id: Number.parseInt(event.id) || Math.floor(Math.random() * 10000),
    title: name,
    description: description,
    category: category,
    date: formattedDate,
    time: formattedTime,
    location: venueName,
    address: venueAddress,
    price: price,
    image: imageUrl,
    organizer: {
      name: organizerName,
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50, // Eventbrite doesn't provide attendee count
    isFavorite: false,
  }
}

// Function to transform PredictHQ event to our app format
function transformPredictHQEvent(event: any): EventDetailProps {
  // Extract the event data
  const title = event.title || "Untitled Event"
  const description = event.description || "No description available."
  const startDate = event.start ? new Date(event.start) : new Date()
  const endDate = event.end ? new Date(event.end) : new Date()

  // Format date and time
  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const formattedTime = `${formattedStartTime} - ${formattedEndTime}`

  // Extract location information
  const location = event.location_name || "Location TBA"
  const address = [event.location?.address, event.location?.city, event.location?.region, event.location?.country]
    .filter(Boolean)
    .join(", ")

  // Extract category
  const category = event.category || "Event"

  return {
    id: Number.parseInt(event.id) || Math.floor(Math.random() * 10000),
    title: title,
    description: description,
    category: category,
    date: formattedDate,
    time: formattedTime,
    location: location,
    address: address,
    price: "Price TBA", // PredictHQ doesn't provide price information
    image: "/community-event.png", // PredictHQ doesn't provide images
    organizer: {
      name: "Event Organizer",
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50, // PredictHQ doesn't provide attendee count
    isFavorite: false,
  }
}

// Function to get mock events
function getMockEvents(params: EventSearchParams): {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
} {
  const mockEvents: EventDetailProps[] = [
    {
      id: 1001,
      title: "Local Music Festival",
      description: "A showcase of local bands and musicians, featuring food trucks and craft vendors.",
      category: "Music",
      date: "July 22, 2024",
      time: "12:00 PM - 10:00 PM",
      location: "Community Park",
      address: "123 Main Street, Anytown, USA",
      price: "Free",
      image: "/community-event.png",
      organizer: {
        name: "Local Events Group",
        avatar: "/avatar-1.png",
      },
      attendees: 500,
      isFavorite: false,
    },
    {
      id: 1002,
      title: "Art in the Park",
      description: "A display of local art, with live painting demonstrations and art activities for kids.",
      category: "Arts",
      date: "August 15, 2024",
      time: "10:00 AM - 6:00 PM",
      location: "Central Park",
      address: "456 Oak Avenue, Anytown, USA",
      price: "Free",
      image: "/community-event.png",
      organizer: {
        name: "Art Society",
        avatar: "/avatar-2.png",
      },
      attendees: 300,
      isFavorite: true,
    },
  ]

  const { page = 0, size = 20 } = params
  const start = page * size
  const end = start + size
  const paginatedEvents = mockEvents.slice(start, end)

  return {
    events: paginatedEvents,
    totalCount: mockEvents.length,
    page: page,
    totalPages: Math.ceil(mockEvents.length / size),
  }
}

// Function to get mock events by location
function getMockEventsByLocation(location: string, radius = 25, limit = 10): EventDetailProps[] {
  // Mock events for different locations
  const locationEvents: Record<string, EventDetailProps[]> = {
    "New York": [
      {
        id: 6001,
        title: "Broadway Show: Hamilton",
        description: "Award-winning musical about Alexander Hamilton.",
        category: "Arts",
        date: "July 15, 2025",
        time: "7:00 PM - 10:00 PM",
        location: "Broadway Theater",
        address: "123 Broadway, New York, NY",
        price: "$150 - $300",
        image: "/community-event.png?height=400&width=600&query=broadway show",
        organizer: {
          name: "Broadway Productions",
          avatar: "/avatar-1.png",
        },
        attendees: 1500,
        isFavorite: false,
      },
      {
        id: 6002,
        title: "Central Park Concert",
        description: "Free summer concert series featuring local musicians.",
        category: "Music",
        date: "August 5, 2025",
        time: "5:00 PM - 8:00 PM",
        location: "Central Park",
        address: "Central Park, New York, NY",
        price: "Free",
        image: "/community-event.png?height=400&width=600&query=central park concert",
        organizer: {
          name: "NYC Parks Department",
          avatar: "/avatar-2.png",
        },
        attendees: 5000,
        isFavorite: true,
      },
    ],
    "Los Angeles": [
      {
        id: 6003,
        title: "Hollywood Film Premiere",
        description: "Red carpet premiere of the latest blockbuster movie.",
        category: "Film",
        date: "July 20, 2025",
        time: "6:00 PM - 11:00 PM",
        location: "Chinese Theatre",
        address: "6925 Hollywood Blvd, Los Angeles, CA",
        price: "Invitation Only",
        image: "/community-event.png?height=400&width=600&query=hollywood premiere",
        organizer: {
          name: "Studio Films",
          avatar: "/avatar-3.png",
        },
        attendees: 1000,
        isFavorite: false,
      },
      {
        id: 6004,
        title: "Venice Beach Art Walk",
        description: "Explore local art galleries and street art in Venice Beach.",
        category: "Arts",
        date: "August 10, 2025",
        time: "11:00 AM - 6:00 PM",
        location: "Venice Beach",
        address: "Venice Beach Boardwalk, Los Angeles, CA",
        price: "Free",
        image: "/community-event.png?height=400&width=600&query=venice beach art",
        organizer: {
          name: "Venice Arts Council",
          avatar: "/avatar-4.png",
        },
        attendees: 2500,
        isFavorite: true,
      },
    ],
    Chicago: [
      {
        id: 6005,
        title: "Chicago Jazz Festival",
        description: "Annual jazz festival featuring top jazz musicians.",
        category: "Music",
        date: "September 1-3, 2025",
        time: "12:00 PM - 10:00 PM",
        location: "Millennium Park",
        address: "201 E Randolph St, Chicago, IL",
        price: "Free",
        image: "/community-event.png?height=400&width=600&query=chicago jazz festival",
        organizer: {
          name: "Chicago Department of Cultural Affairs",
          avatar: "/avatar-5.png",
        },
        attendees: 10000,
        isFavorite: false,
      },
      {
        id: 6006,
        title: "Taste of Chicago",
        description: "Food festival featuring Chicago's best restaurants.",
        category: "Food",
        date: "July 8-12, 2025",
        time: "11:00 AM - 9:00 PM",
        location: "Grant Park",
        address: "337 E Randolph St, Chicago, IL",
        price: "Free admission, food tickets available",
        image: "/community-event.png?height=400&width=600&query=taste of chicago food festival",
        organizer: {
          name: "Chicago Department of Cultural Affairs",
          avatar: "/avatar-6.png",
        },
        attendees: 15000,
        isFavorite: true,
      },
    ],
  }

  // Default events if location not found
  const defaultEvents = [
    {
      id: 6007,
      title: "Local Community Festival",
      description: "Annual community celebration with food, music, and activities for all ages.",
      category: "Community",
      date: "August 20, 2025",
      time: "10:00 AM - 8:00 PM",
      location: "Community Park",
      address: `Near ${location}`,
      price: "Free",
      image: "/community-event.png?height=400&width=600&query=community festival",
      organizer: {
        name: "Community Association",
        avatar: "/avatar-1.png",
      },
      attendees: 2000,
      isFavorite: false,
    },
    {
      id: 6008,
      title: "Farmers Market",
      description: "Weekly market featuring local produce, crafts, and food vendors.",
      category: "Food",
      date: "Every Saturday",
      time: "8:00 AM - 1:00 PM",
      location: "Market Square",
      address: `Downtown ${location}`,
      price: "Free admission",
      image: "/community-event.png?height=400&width=600&query=farmers market",
      organizer: {
        name: "Local Farmers Association",
        avatar: "/avatar-2.png",
      },
      attendees: 500,
      isFavorite: true,
    },
  ]

  // Return events for the requested location or default events
  const events = locationEvents[location] || defaultEvents
  return events.slice(0, limit)
}

// Function to search for events
export async function searchEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
}> {
  try {
    switch (API_PROVIDER) {
      case "ticketmaster":
        return await searchTicketmasterEvents(params)
      case "eventbrite":
        try {
          return await searchEventbriteEvents(params)
        } catch (error) {
          console.error("Eventbrite API error:", error)
          return getMockEvents(params)
        }
      case "predicthq":
        return await searchPredicthqEvents(params)
      case "mock":
        return getMockEvents(params)
      default:
        return getMockEvents(params)
    }
  } catch (error) {
    console.error("Error searching events:", error)
    return getMockEvents(params)
  }
}

// Function to search for events using Ticketmaster API
async function searchTicketmasterEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
}> {
  const {
    keyword,
    location,
    radius = 50,
    startDateTime,
    endDateTime,
    categories,
    page = 0,
    size = 20,
    sort = "date,asc",
  } = params

  // Build query parameters
  const queryParams = new URLSearchParams()
  queryParams.append("apikey", API_CONFIG.ticketmaster.apiKey)
  queryParams.append("size", size.toString())
  queryParams.append("page", page.toString())

  if (keyword) queryParams.append("keyword", keyword)
  if (location) queryParams.append("city", location)
  if (radius) queryParams.append("radius", radius.toString())
  if (startDateTime) queryParams.append("startDateTime", startDateTime)
  if (endDateTime) queryParams.append("endDateTime", endDateTime)
  if (categories && categories.length > 0) {
    queryParams.append("classificationName", categories.join(","))
  }
  if (sort) queryParams.append("sort", sort)

  // Make API request
  const response = await fetch(`${API_CONFIG.ticketmaster.baseUrl}/events.json?${queryParams.toString()}`)

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Transform events to our app format
  const events = data._embedded?.events?.map(transformTicketmasterEvent) || []

  return {
    events,
    totalCount: data.page?.totalElements || events.length,
    page: data.page?.number || 0,
    totalPages: data.page?.totalPages || 1,
  }
}

// Update the searchEventbriteEvents function to better handle errors
async function searchEventbriteEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
}> {
  try {
    const { keyword, location, startDateTime, endDateTime, page = 1, size = 20 } = params

    // Build query parameters
    const queryParams = new URLSearchParams()

    // Add pagination
    queryParams.append("page", page.toString())
    queryParams.append("page_size", size.toString())

    // Add search parameters
    if (keyword) queryParams.append("q", keyword)
    if (location) queryParams.append("location.address", location)
    if (startDateTime) queryParams.append("start_date.range_start", startDateTime)
    if (endDateTime) queryParams.append("start_date.range_end", endDateTime)

    // Make API request with the private token
    const response = await fetch(`${API_CONFIG.eventbrite.baseUrl}/events/search/?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${API_CONFIG.eventbrite.privateToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform events to our app format
    const events = data.events?.map(transformEventbriteEvent) || []

    return {
      events,
      totalCount: data.pagination?.object_count || events.length,
      page: data.pagination?.page_number || 1,
      totalPages: data.pagination?.page_count || 1,
    }
  } catch (error) {
    console.error("Error in searchEventbriteEvents:", error)
    // Instead of propagating the error, return mock data
    return getMockEvents(params)
  }
}

// Function to search for events using PredictHQ API
async function searchPredicthqEvents(params: EventSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
}> {
  const { keyword, location, radius = 50, startDateTime, endDateTime, categories, page = 1, size = 20 } = params

  // Build query parameters
  const queryParams = new URLSearchParams()

  // Add pagination
  queryParams.append("offset", ((page - 1) * size).toString())
  queryParams.append("limit", size.toString())

  // Add search parameters
  if (keyword) queryParams.append("q", keyword)
  if (location && radius) {
    // PredictHQ requires location in format "location.around:lat,lon,radius"
    // For simplicity, we'll use a default location if only a text location is provided
    queryParams.append("location.around", "40.7128,-74.0060," + radius + "km") // Default to NYC
  }
  if (startDateTime) queryParams.append("start.gte", startDateTime)
  if (endDateTime) queryParams.append("start.lte", endDateTime)
  if (categories && categories.length > 0) {
    queryParams.append("category", categories.join(","))
  }

  // Make API request
  const response = await fetch(`${API_CONFIG.predicthq.baseUrl}/events/?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.predicthq.apiKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`PredictHQ API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Transform events to our app format
  const events = data.results?.map(transformPredictHQEvent) || []

  return {
    events,
    totalCount: data.count || events.length,
    page: Math.floor(data.offset / size) + 1 || 1,
    totalPages: Math.ceil(data.count / size) || 1,
  }
}

// Function to get event details
export async function getEventDetails(eventId: string): Promise<EventDetailProps | null> {
  try {
    switch (API_PROVIDER) {
      case "ticketmaster":
        return await getTicketmasterEventDetails(eventId)
      case "eventbrite":
        try {
          return await getEventbriteEventDetails(eventId)
        } catch (error) {
          console.error("Eventbrite API error:", error)
          return null
        }
      case "predicthq":
        return await getPredicthqEventDetails(eventId)
      case "mock":
        // Return a mock event detail
        return {
          id: Number.parseInt(eventId),
          title: "Mock Event " + eventId,
          description: "This is a mock event description for testing purposes.",
          category: "Entertainment",
          date: "June 15, 2025",
          time: "7:00 PM - 10:00 PM",
          location: "Mock Venue",
          address: "123 Test Street, Mockville, MK",
          price: "$25",
          image: "/community-event.png",
          organizer: {
            name: "Mock Organizer",
            avatar: "/avatar-1.png",
          },
          attendees: 250,
          isFavorite: false,
        }
      default:
        throw new Error(`Unsupported API provider: ${API_PROVIDER}`)
    }
  } catch (error) {
    console.error("Error getting event details:", error)
    return null
  }
}

// Function to get event details using Ticketmaster API
async function getTicketmasterEventDetails(eventId: string): Promise<EventDetailProps | null> {
  const response = await fetch(
    `${API_CONFIG.ticketmaster.baseUrl}/events/${eventId}?apikey=${API_CONFIG.ticketmaster.apiKey}`,
  )

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
  }

  const event = await response.json()
  return transformTicketmasterEvent(event)
}

// Function to get event details using Eventbrite API
async function getEventbriteEventDetails(eventId: string): Promise<EventDetailProps | null> {
  const response = await fetch(`${API_CONFIG.eventbrite.baseUrl}/events/${eventId}/`, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.eventbrite.privateToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
  }

  const event = await response.json()
  return transformEventbriteEvent(event)
}

// Function to get event details using PredictHQ API
async function getPredicthqEventDetails(eventId: string): Promise<EventDetailProps | null> {
  const response = await fetch(`${API_CONFIG.predicthq.baseUrl}/events/${eventId}/`, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.predicthq.apiKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`PredictHQ API error: ${response.status} ${response.statusText}`)
  }

  const event = await response.json()
  return transformPredictHQEvent(event)
}

// Function to get featured events
export async function getFeaturedEvents(limit = 2): Promise<EventDetailProps[]> {
  try {
    const params: EventSearchParams = {
      size: limit,
      sort: "relevance,desc",
    }

    const { events } = await searchEvents(params)
    return events
  } catch (error) {
    console.error("Error getting featured events:", error)
    // Return mock featured events as fallback
    return [
      {
        id: 2001,
        title: "International Film Festival",
        description:
          "A celebration of cinema featuring award-winning films from around the world, director Q&As, and exclusive premieres.",
        category: "Film",
        date: "October 10-17, 2025",
        time: "Various Times",
        location: "City Cinema",
        address: "123 Movie Lane, New York, NY",
        price: "$15 per screening",
        image: "/community-event.png?height=400&width=600&query=film festival",
        organizer: {
          name: "Film Society",
          avatar: "/avatar-1.png",
        },
        attendees: 5000,
        isFavorite: false,
      },
      {
        id: 2002,
        title: "Electronic Music Weekend",
        description:
          "The biggest electronic music event of the year with world-class DJs, immersive light shows, and multiple stages.",
        category: "Music",
        date: "August 20-22, 2025",
        time: "6:00 PM - 3:00 AM",
        location: "Riverside Arena",
        address: "456 Beat Street, Miami, FL",
        price: "$120",
        image: "/community-event.png?height=400&width=600&query=electronic music festival",
        organizer: {
          name: "Bass Productions",
          avatar: "/avatar-2.png",
        },
        attendees: 8000,
        isFavorite: true,
      },
    ]
  }
}

// Function to get events by category
export async function getEventsByCategory(category: string, limit = 6): Promise<EventDetailProps[]> {
  try {
    const params: EventSearchParams = {
      categories: [category],
      size: limit,
    }

    const { events } = await searchEvents(params)
    return events
  } catch (error) {
    console.error(`Error getting events for category ${category}:`, error)

    // Return mock category events as fallback
    const mockCategoryEvents: Record<string, EventDetailProps[]> = {
      Music: [
        {
          id: 3001,
          title: "Jazz in the Park",
          description: "An evening of smooth jazz under the stars with renowned jazz musicians.",
          category: "Music",
          date: "July 15, 2025",
          time: "7:00 PM - 10:00 PM",
          location: "Central Park",
          address: "123 Park Ave, New York, NY",
          price: "$30",
          image: "/community-event.png?height=400&width=600&query=jazz concert",
          organizer: {
            name: "Jazz Society",
            avatar: "/avatar-1.png",
          },
          attendees: 500,
          isFavorite: false,
        },
        {
          id: 3002,
          title: "Rock Festival",
          description: "A day of rock music featuring both classic and new bands.",
          category: "Music",
          date: "August 5, 2025",
          time: "2:00 PM - 11:00 PM",
          location: "Stadium Grounds",
          address: "456 Rock Blvd, Los Angeles, CA",
          price: "$75",
          image: "/community-event.png?height=400&width=600&query=rock festival",
          organizer: {
            name: "Rock Productions",
            avatar: "/avatar-2.png",
          },
          attendees: 2000,
          isFavorite: true,
        },
      ],
      Sports: [
        {
          id: 4001,
          title: "Marathon 2025",
          description: "Annual city marathon with routes for all skill levels.",
          category: "Sports",
          date: "September 12, 2025",
          time: "7:00 AM - 2:00 PM",
          location: "City Center",
          address: "Start: 123 Main St, Finish: City Park",
          price: "$50 registration",
          image: "/community-event.png?height=400&width=600&query=marathon race",
          organizer: {
            name: "City Athletics",
            avatar: "/avatar-1.png",
          },
          attendees: 3000,
          isFavorite: false,
        },
        {
          id: 4002,
          title: "Basketball Tournament",
          description: "Regional basketball tournament featuring top amateur teams.",
          category: "Sports",
          date: "August 15-16, 2025",
          time: "9:00 AM - 6:00 PM",
          location: "Sports Arena",
          address: "456 Court Ave, Chicago, IL",
          price: "$15",
          image: "/community-event.png?height=400&width=600&query=basketball tournament",
          organizer: {
            name: "Hoops League",
            avatar: "/avatar-2.png",
          },
          attendees: 1500,
          isFavorite: true,
        },
      ],
      Arts: [
        {
          id: 5001,
          title: "Modern Art Exhibition",
          description: "Featuring works from contemporary artists exploring themes of technology and nature.",
          category: "Arts",
          date: "June 10-30, 2025",
          time: "10:00 AM - 6:00 PM",
          location: "City Gallery",
          address: "123 Art Lane, New York, NY",
          price: "$18",
          image: "/community-event.png?height=400&width=600&query=modern art exhibition",
          organizer: {
            name: "Modern Art Foundation",
            avatar: "/avatar-1.png",
          },
          attendees: 1200,
          isFavorite: false,
        },
        {
          id: 5002,
          title: "Photography Workshop",
          description: "Learn portrait photography techniques from professional photographers.",
          category: "Arts",
          date: "July 15, 2025",
          time: "1:00 PM - 5:00 PM",
          location: "Creative Studio",
          address: "456 Frame Street, San Francisco, CA",
          price: "$85",
          image: "/community-event.png?height=400&width=600&query=photography workshop",
          organizer: {
            name: "Capture Collective",
            avatar: "/avatar-2.png",
          },
          attendees: 30,
          isFavorite: true,
        },
      ],
    }

    // Return mock events for the requested category or empty array if category not found
    return mockCategoryEvents[category] || []
  }
}

// Function to get events by location
export async function getEventsByLocation(location: string, radius = 25, limit = 10): Promise<EventDetailProps[]> {
  try {
    switch (API_PROVIDER) {
      case "ticketmaster":
        return await getTicketmasterEventsByLocation(location, radius, limit)
      case "eventbrite":
        try {
          return await getEventbriteEventsByLocation(location, radius, limit)
        } catch (error) {
          console.error("Eventbrite API error:", error)
          return getMockEventsByLocation(location, radius, limit)
        }
      case "predicthq":
        return await getPredictHQEventsByLocation(location, radius, limit)
      case "mock":
        return getMockEventsByLocation(location, radius, limit)
      default:
        return getMockEventsByLocation(location, radius, limit)
    }
  } catch (error) {
    console.error(`Error getting events for location ${location}:`, error)
    return getMockEventsByLocation(location, radius, limit)
  }
}

// Function to get events by location using Ticketmaster API
async function getTicketmasterEventsByLocation(location: string, radius = 25, limit = 10): Promise<EventDetailProps[]> {
  const params: EventSearchParams = {
    location,
    radius,
    size: limit,
  }

  const { events } = await searchTicketmasterEvents(params)
  return events
}

// Function to get events by location using Eventbrite API
async function getEventbriteEventsByLocation(location: string, radius = 25, limit = 10): Promise<EventDetailProps[]> {
  const params: EventSearchParams = {
    location,
    radius,
    size: limit,
  }

  const { events } = await searchEventbriteEvents(params)
  return events
}

// Function to get events by location using PredictHQ API
async function getPredictHQEventsByLocation(location: string, radius = 25, limit = 10): Promise<EventDetailProps[]> {
  const params: EventSearchParams = {
    location,
    radius,
    size: limit,
  }

  const { events } = await searchPredicthqEvents(params)
  return events
}
