import { TICKETMASTER_API_KEY } from "@/lib/env"
import type { EventDetailProps } from "@/components/event-detail-modal"

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

export async function searchTicketmasterEvents(params: TicketmasterSearchParams): Promise<{
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  error?: string
}> {
  try {
    // console.log("Searching Ticketmaster events with params:", params)

    const queryParams = new URLSearchParams()
    queryParams.append("apikey", TICKETMASTER_API_KEY || "")

    // Location handling
    if (params.coordinates) {
      queryParams.append("latlong", `${params.coordinates.lat},${params.coordinates.lng}`)
      queryParams.append("radius", (params.radius || 50).toString()) // Increased radius
      queryParams.append("unit", "miles")
    } else if (params.location) {
      queryParams.append("city", params.location)
    }

    // Search parameters
    if (params.keyword) queryParams.append("keyword", params.keyword)
    if (params.startDateTime) queryParams.append("startDateTime", params.startDateTime)
    if (params.endDateTime) queryParams.append("endDateTime", params.endDateTime)
    if (params.classificationName) queryParams.append("classificationName", params.classificationName)

    // Pagination - get more events
    queryParams.append("size", (params.size || 50).toString()) // Increased from 20 to 50
    queryParams.append("page", (params.page || 0).toString())

    // Sort by date and relevance
    queryParams.append("sort", "relevance,desc")

    // Include additional data
    queryParams.append("includeSpellcheck", "yes")

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${queryParams.toString()}`
    // console.log("Ticketmaster API URL:", url)

    const response = await fetch(url)

    if (!response.ok) {
      console.error("Ticketmaster API error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Ticketmaster error details:", errorText)
      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        error: `Ticketmaster API error: ${response.status}`,
      }
    }

    const data = await response.json()
    // console.log("Ticketmaster response:", data)

    if (data._embedded && data._embedded.events) {
      const events = data._embedded.events.map((event: unknown) => transformTicketmasterEvent(event))

      return {
        events,
        totalCount: data.page?.totalElements || events.length,
        page: data.page?.number || 0,
        totalPages: data.page?.totalPages || 1,
      }
    }

    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
    }
  } catch (error) {
    console.error("Ticketmaster search error:", error)
    return {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      totalPages: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

function getBestImage(images: unknown[]): string {
  if (!images || images.length === 0) return "/community-event.png"

  // Sort images by size preference: large > medium > small
  const sortedImages = images.sort((a: any, b: any) => {
    const sizeOrder = { large: 3, medium: 2, small: 1 }
    const aSize = sizeOrder[a.ratio as keyof typeof sizeOrder] || 0
    const bSize = sizeOrder[b.ratio as keyof typeof sizeOrder] || 0
    return bSize - aSize
  })

  // Return the best quality image
  return (sortedImages[0] as any)?.url || "/community-event.png"
}

function extractTicketLinks(event: unknown): Array<{ source: string; link: string }> {
  const links = []
  const eventData = event as any

  // Primary Ticketmaster link
  if (eventData.url) {
    links.push({
      source: "Ticketmaster",
      link: eventData.url,
    })
  }

  // Additional sales links
  if (eventData.sales && eventData.sales.public && eventData.sales.public.startDateTime) {
    // Check if tickets are on sale
    const saleStart = new Date(eventData.sales.public.startDateTime)
    const now = new Date()

    if (now >= saleStart && eventData.url) {
      links.push({
        source: "Buy Tickets",
        link: eventData.url,
      })
    }
  }

  // Presale links
  if (eventData.sales && eventData.sales.presales) {
    eventData.sales.presales.forEach((presale: unknown) => {
      const presaleData = presale as any
      if (presaleData.url) {
        links.push({
          source: `${presaleData.name || "Presale"}`,
          link: presaleData.url,
        })
      }
    })
  }

  // Venue box office link if available
  if (eventData._embedded && eventData._embedded.venues && eventData._embedded.venues[0]) {
    const venue = eventData._embedded.venues[0]
    if (venue.boxOfficeInfo && venue.boxOfficeInfo.phoneNumberDetail) {
      // Add venue contact info as a "link"
      links.push({
        source: "Box Office",
        link: `tel:${venue.boxOfficeInfo.phoneNumberDetail}`,
      })
    }
  }

  return links
}

function transformTicketmasterEvent(apiEvent: unknown): EventDetailProps {
  const eventData = apiEvent as any
  
  // Extract venue information
  const venue = eventData._embedded?.venues?.[0] || {}
  const coordinates = venue.location
    ? { lat: Number.parseFloat(venue.location.latitude), lng: Number.parseFloat(venue.location.longitude) }
    : undefined

  // Extract price information
  const priceRanges = eventData.priceRanges || []
  let price = "Price TBA"
  if (priceRanges.length > 0) {
    const range = priceRanges[0]
    if (range.min === range.max) {
      price = `$${range.min}`
    } else {
      price = `$${range.min} - $${range.max}`
    }
  }

  // Check if tickets are free
  if (
    eventData.accessibility &&
    eventData.accessibility.info &&
    eventData.accessibility.info.toLowerCase().includes("free")
  ) {
    price = "Free"
  }

  // Extract date and time
  const dateInfo = eventData.dates?.start
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  if (dateInfo?.localDate) {
    const date = new Date(dateInfo.localDate)
    formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  // Extract category
  const classifications = eventData.classifications || []
  let category = "Event"
  if (classifications.length > 0) {
    const classification = classifications[0]
    category = classification.segment?.name || classification.genre?.name || "Event"
  }

  // Generate numeric ID
  const numericId = Number.parseInt(eventData.id.replace(/\D/g, "")) || Math.floor(Math.random() * 10000)

  // Get the best image
  const image = getBestImage(eventData.images || [])

  // Extract ticket links
  const ticketLinks = extractTicketLinks(eventData)

  // Enhanced description
  let description = eventData.info || eventData.pleaseNote || ""
  if (eventData.promoter && eventData.promoter.description) {
    description += ` ${eventData.promoter.description}`
  }
  if (!description) {
    description = "No description available."
  }

  return {
    id: numericId,
    title: eventData.name || "Untitled Event",
    description: description.trim(),
    category,
    date: formattedDate,
    time: formattedTime,
    location: venue.name || "Venue TBA",
    address:
      `${venue.address?.line1 || ""} ${venue.city?.name || ""} ${venue.state?.stateCode || ""}`.trim() || "Address TBA",
    price,
    image,
    organizer: {
      name: eventData._embedded?.attractions?.[0]?.name || eventData.promoter?.name || "Event Organizer",
      avatar: eventData._embedded?.attractions?.[0]?.images?.[0]?.url || "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates,
    ticketLinks,
  }
}

export async function getTicketmasterEventDetails(eventId: string): Promise<EventDetailProps | null> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append("apikey", TICKETMASTER_API_KEY || "")

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?${queryParams.toString()}`,
    )

    if (!response.ok) {
      console.error("Ticketmaster event details error:", response.status, response.statusText)
      return null
    }

    const event = await response.json()
    return transformTicketmasterEvent(event)
  } catch (error) {
    console.error("Error fetching Ticketmaster event details:", error)
    return null
  }
}
