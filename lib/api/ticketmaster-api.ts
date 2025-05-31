import { serverEnv } from "@/lib/env"
import type { EventDetailProps } from "@/components/event-detail-modal"
import type { TicketmasterEvent } from "@/types"
import { logger, measurePerformance } from "@/lib/utils/logger"
import { withRetry, formatErrorMessage } from "@/lib/utils/index"
import { memoryCache } from "@/lib/utils/cache"

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

// Rate limiter for Ticketmaster API
class TicketmasterRateLimiter {
  private requests: number[] = []
  private readonly maxRequestsPerSecond = 5
  private readonly maxRequestsPerMinute = 200
  private readonly maxRequestsPerDay = 5000

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()

    // Remove old requests
    this.requests = this.requests.filter((time) => now - time < 24 * 60 * 60 * 1000) // 24 hours

    // Check daily limit
    if (this.requests.length >= this.maxRequestsPerDay) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = 24 * 60 * 60 * 1000 - (now - oldestRequest)
      if (waitTime > 0) {
        logger.warn("Ticketmaster daily rate limit reached", {
          component: "ticketmaster-api",
          action: "daily_limit_reached",
          metadata: { waitTime },
        })
        throw new Error(`Daily rate limit exceeded. Reset in ${Math.ceil(waitTime / 1000 / 60)} minutes`)
      }
    }

    // Check per-minute limit
    const recentMinuteRequests = this.requests.filter((time) => now - time < 60 * 1000)
    if (recentMinuteRequests.length >= this.maxRequestsPerMinute) {
      const waitTime = 60 * 1000 - (now - Math.min(...recentMinuteRequests))
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    // Check per-second limit
    const recentSecondRequests = this.requests.filter((time) => now - time < 1000)
    if (recentSecondRequests.length >= this.maxRequestsPerSecond) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    this.requests.push(now)
  }

  getUsage(): { daily: number; minute: number; second: number } {
    const now = Date.now()
    return {
      daily: this.requests.filter((time) => now - time < 24 * 60 * 60 * 1000).length,
      minute: this.requests.filter((time) => now - time < 60 * 1000).length,
      second: this.requests.filter((time) => now - time < 1000).length,
    }
  }
}

const rateLimiter = new TicketmasterRateLimiter()

// Enhanced date formatting for Ticketmaster API
function formatTicketmasterDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If invalid date, return current date
      return new Date().toISOString()
    }
    // Ensure the date is in the correct format: YYYY-MM-DDTHH:mm:ssZ
    return date.toISOString()
  } catch (error) {
    logger.warn("Failed to format Ticketmaster date", {
      component: "ticketmaster-api",
      action: "date_format_error",
      metadata: { originalDate: dateString, error: formatErrorMessage(error) },
    })
    return new Date().toISOString()
  }
}

export async function searchTicketmasterEvents(params: TicketmasterSearchParams): Promise<TicketmasterSearchResult> {
  return measurePerformance("searchTicketmasterEvents", async () => {
    const startTime = Date.now()

    try {
      // Get API key from server environment only
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

      // Validate parameters
      if (params.size && params.size > 200) {
        params.size = 200 // Ticketmaster's maximum
      }

      // Generate cache key
      const cacheKey = `ticketmaster:${JSON.stringify(params)}`

      // Check cache first
      const cached = memoryCache.get<TicketmasterSearchResult>(cacheKey)
      if (cached) {
        logger.info("Ticketmaster search cache hit", {
          component: "ticketmaster-api",
          action: "cache_hit",
          metadata: { cacheKey, eventCount: cached.events.length },
        })
        return { ...cached, cached: true }
      }

      // Check rate limits
      await rateLimiter.waitIfNeeded()

      logger.info("Searching Ticketmaster events", {
        component: "ticketmaster-api",
        action: "search_events",
        metadata: { params },
      })

      const queryParams = new URLSearchParams()
      queryParams.append("apikey", apiKey)

      // Location handling with validation
      if (params.coordinates) {
        if (isValidCoordinates(params.coordinates)) {
          queryParams.append("latlong", `${params.coordinates.lat},${params.coordinates.lng}`)
          queryParams.append("radius", Math.min(params.radius || 50, 500).toString()) // Max 500 miles
          queryParams.append("unit", "miles")
        } else {
          logger.warn("Invalid coordinates provided", {
            component: "ticketmaster-api",
            action: "invalid_coordinates",
            metadata: { coordinates: params.coordinates },
          })
        }
      } else if (params.location) {
        queryParams.append("city", params.location.trim())
      }

      // Search parameters with validation
      if (params.keyword) queryParams.append("keyword", params.keyword.trim())

      // Enhanced date handling with proper formatting
      if (params.startDateTime) {
        const formattedStartDate = formatTicketmasterDate(params.startDateTime)
        queryParams.append("startDateTime", formattedStartDate)
        logger.debug("Formatted start date", {
          component: "ticketmaster-api",
          original: params.startDateTime,
          formatted: formattedStartDate,
        })
      } else {
        // Default to current time if no start date provided
        const now = new Date()
        queryParams.append("startDateTime", now.toISOString())
      }

      if (params.endDateTime) {
        const formattedEndDate = formatTicketmasterDate(params.endDateTime)
        queryParams.append("endDateTime", formattedEndDate)
        logger.debug("Formatted end date", {
          component: "ticketmaster-api",
          original: params.endDateTime,
          formatted: formattedEndDate,
        })
      }

      if (params.classificationName) {
        queryParams.append("classificationName", params.classificationName.trim())
      }

      // Pagination with validation
      queryParams.append("size", Math.min(params.size || 100, 200).toString()) // Increase default from 50 to 100
      queryParams.append("page", Math.max(params.page || 0, 0).toString())

      // Sort and additional options
      queryParams.append("sort", "relevance,desc")
      queryParams.append("includeSpellcheck", "yes")

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${queryParams.toString()}`

      logger.debug("Ticketmaster API request", {
        component: "ticketmaster-api",
        url: url.replace(apiKey, "***"),
        params: queryParams.toString().replace(apiKey, "***"),
      })

      const response = await withRetry(() => fetch(url), { maxAttempts: 3, baseDelay: 1000 })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text()
        const error = handleTicketmasterError(response.status, errorText)

        logger.error("Ticketmaster API error", {
          component: "ticketmaster-api",
          action: "api_error",
          metadata: { status: response.status, error, responseTime, errorText },
        })

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

      let result: TicketmasterSearchResult

      if (data._embedded && data._embedded.events) {
        const events = data._embedded.events
          .map((event: unknown) => {
            try {
              return transformTicketmasterEvent(event)
            } catch (error) {
              logger.warn("Failed to transform Ticketmaster event", {
                component: "ticketmaster-api",
                action: "transform_error",
                metadata: { eventId: (event as any)?.id },
              })
              return null
            }
          })
          .filter(Boolean) as EventDetailProps[]

        result = {
          events,
          totalCount: data.page?.totalElements || events.length,
          page: data.page?.number || 0,
          totalPages: data.page?.totalPages || 1,
          responseTime,
          cached: false,
        }
      } else {
        result = {
          events: [],
          totalCount: 0,
          page: params.page || 0,
          totalPages: 0,
          responseTime,
          cached: false,
        }
      }

      // Cache successful results for 10 minutes
      if (result.events.length > 0) {
        memoryCache.set(cacheKey, result, 10 * 60 * 1000)
      }

      logger.info("Ticketmaster search completed", {
        component: "ticketmaster-api",
        action: "search_success",
        metadata: {
          eventCount: result.events.length,
          totalCount: result.totalCount,
          responseTime,
        },
      })

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = formatErrorMessage(error)

      logger.error(
        "Ticketmaster search failed",
        {
          component: "ticketmaster-api",
          action: "search_error",
          metadata: { params, responseTime },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        error: errorMessage,
        responseTime,
        cached: false,
      }
    }
  })
}

// Enhanced error handling
function handleTicketmasterError(status: number, errorText: string): string {
  switch (status) {
    case 400:
      // Parse the error response for more specific error messages
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.detail || err.code || "Unknown error")
          return `Ticketmaster API error: ${errorMessages.join(", ")}`
        }
      } catch {
        // If parsing fails, fall back to generic message
      }
      return `Invalid request parameters: ${errorText}`
    case 401:
      return "Invalid Ticketmaster API key - please check your credentials"
    case 403:
      return "Access forbidden - check your API permissions and subscription"
    case 429:
      return "Rate limit exceeded - please try again later"
    case 500:
      return "Ticketmaster server error - please try again"
    case 503:
      return "Ticketmaster service temporarily unavailable"
    default:
      return `Ticketmaster API error ${status}: ${errorText || "Unknown error"}`
  }
}

// Validation helpers
function isValidCoordinates(coords: { lat: number; lng: number }): boolean {
  return (
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  )
}

function isValidDateTime(dateTime: string): boolean {
  try {
    const date = new Date(dateTime)
    return !isNaN(date.getTime()) && date.getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000 // Not older than 1 year
  } catch {
    return false
  }
}

interface TicketmasterImage {
  url: string
  ratio: "large" | "medium" | "small"
  width: number
  height: number
}

function getBestImage(images: TicketmasterImage[]): string {
  if (!images || images.length === 0) return "/community-event.png"

  // Sort images by size preference: large > medium > small
  const sortedImages = images.sort((a, b) => {
    const sizeOrder = { large: 3, medium: 2, small: 1 }
    const aSize = sizeOrder[a.ratio] || 0
    const bSize = sizeOrder[b.ratio] || 0
    return bSize - aSize
  })

  // Validate URL
  const bestImage = sortedImages[0]
  if (bestImage?.url && isValidImageUrl(bestImage.url)) {
    return bestImage.url
  }

  return "/community-event.png"
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.protocol === "https:" &&
      (parsedUrl.hostname.includes("ticketmaster") ||
        parsedUrl.hostname.includes("livenation") ||
        parsedUrl.hostname.includes("tmol-prd"))
    )
  } catch {
    return false
  }
}

function extractTicketLinks(event: TicketmasterEvent): Array<{ source: string; link: string }> {
  const links: Array<{ source: string; link: string }> = []

  // Primary Ticketmaster link
  if (event.url && isValidUrl(event.url)) {
    links.push({
      source: "Ticketmaster",
      link: event.url,
    })
  }

  // Additional sales links
  if (event.sales?.public?.startDateTime) {
    // Check if tickets are on sale
    const saleStart = new Date(event.sales.public.startDateTime)
    const now = new Date()

    if (now >= saleStart && event.url && isValidUrl(event.url)) {
      links.push({
        source: "Buy Tickets",
        link: event.url,
      })
    }
  }

  // Presale links
  if (event.sales?.presales) {
    event.sales.presales.forEach((presale) => {
      if (presale.url && isValidUrl(presale.url)) {
        links.push({
          source: `${presale.name || "Presale"}`,
          link: presale.url,
        })
      }
    })
  }

  return links
}

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:"
  } catch {
    return false
  }
}

function transformTicketmasterEvent(apiEvent: unknown): EventDetailProps {
  const eventData = apiEvent as TicketmasterEvent

  // Validate required fields
  if (!eventData.id || !eventData.name) {
    throw new Error("Invalid event data: missing required fields")
  }

  // Extract venue information with validation
  const venue = eventData._embedded?.venues?.[0]
  const coordinates =
    venue?.location &&
    isValidCoordinates({
      lat: Number.parseFloat(venue.location.latitude || "0"),
      lng: Number.parseFloat(venue.location.longitude || "0"),
    })
      ? {
          lat: Number.parseFloat(venue.location.latitude || "0"),
          lng: Number.parseFloat(venue.location.longitude || "0"),
        }
      : undefined

  // Extract price information with validation
  const priceRanges = eventData.priceRanges || []
  let price = "Price TBA"
  if (priceRanges.length > 0) {
    const range = priceRanges[0]
    if (typeof range.min === "number" && typeof range.max === "number") {
      if (range.min === range.max) {
        price = `$${range.min.toFixed(2)}`
      } else {
        price = `$${range.min.toFixed(2)} - $${range.max.toFixed(2)}`
      }
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

  // Extract date and time with validation
  const dateInfo = eventData.dates?.start
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  if (dateInfo?.localDate && isValidDateTime(dateInfo.localDate)) {
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
      const hoursNum = Number.parseInt(hours)
      const minutesNum = Number.parseInt(minutes)

      if (
        !isNaN(hoursNum) &&
        !isNaN(minutesNum) &&
        hoursNum >= 0 &&
        hoursNum < 24 &&
        minutesNum >= 0 &&
        minutesNum < 60
      ) {
        const date = new Date()
        date.setHours(hoursNum, minutesNum)
        formattedTime = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      }
    } catch {
      formattedTime = "Time TBA"
    }
  }

  // Extract category with validation
  const classifications = eventData.classifications || []
  let category = "Event"
  if (classifications.length > 0) {
    const classification = classifications[0]
    category = classification.segment?.name || classification.genre?.name || "Event"
    // Sanitize category
    category = category.replace(/[<>]/g, "").trim() || "Event"
  }

  // Generate numeric ID safely
  const numericId = (() => {
    try {
      const cleanId = eventData.id.replace(/\D/g, "")
      const parsed = Number.parseInt(cleanId)
      return !isNaN(parsed) && parsed > 0 ? parsed : Math.floor(Math.random() * 10000)
    } catch {
      return Math.floor(Math.random() * 10000)
    }
  })()

  // Get the best image
  const image = getBestImage(eventData.images || [])

  // Extract ticket links
  const ticketLinks = extractTicketLinks(eventData)

  // Enhanced description with sanitization
  let description = ""
  if (eventData.info) description += eventData.info
  if (eventData.pleaseNote) {
    if (description) description += " "
    description += eventData.pleaseNote
  }
  if (eventData.promoter?.description) {
    if (description) description += " "
    description += eventData.promoter.description
  }

  // Sanitize description
  description = description
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&[^;]+;/g, " ") // Remove HTML entities
    .trim()

  if (!description) {
    description = "No description available."
  }

  // Sanitize venue and address information
  const venueName = venue?.name?.replace(/[<>]/g, "").trim() || "Venue TBA"
  const venueAddress =
    [
      venue?.address?.line1?.replace(/[<>]/g, "").trim(),
      venue?.city?.name?.replace(/[<>]/g, "").trim(),
      venue?.state?.stateCode?.replace(/[<>]/g, "").trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Address TBA"

  return {
    id: numericId,
    title: eventData.name.replace(/[<>]/g, "").trim() || "Untitled Event",
    description: description.substring(0, 500), // Limit description length
    category,
    date: formattedDate,
    time: formattedTime,
    location: venueName,
    address: venueAddress,
    price,
    image,
    organizer: {
      name:
        eventData._embedded?.attractions?.[0]?.name?.replace(/[<>]/g, "").trim() ||
        eventData.promoter?.name?.replace(/[<>]/g, "").trim() ||
        "Event Organizer",
      avatar: eventData._embedded?.attractions?.[0]?.images?.[0]?.url || "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates,
    ticketLinks,
  }
}

export async function getTicketmasterEventDetails(eventId: string): Promise<EventDetailProps | null> {
  return measurePerformance("getTicketmasterEventDetails", async () => {
    try {
      // Get API key from server environment only
      const apiKey = serverEnv.TICKETMASTER_API_KEY

      if (!apiKey) {
        logger.warn("Ticketmaster API key not configured")
        return null
      }

      // Validate event ID
      if (!eventId || typeof eventId !== "string" || eventId.trim().length === 0) {
        logger.warn("Invalid event ID provided", {
          component: "ticketmaster-api",
          action: "invalid_event_id",
          metadata: { eventId },
        })
        return null
      }

      const cleanEventId = eventId.trim()
      const cacheKey = `ticketmaster_event:${cleanEventId}`

      // Check cache first
      const cached = memoryCache.get<EventDetailProps>(cacheKey)
      if (cached) {
        logger.info("Ticketmaster event details cache hit", {
          component: "ticketmaster-api",
          action: "cache_hit",
          metadata: { eventId: cleanEventId },
        })
        return cached
      }

      // Check rate limits
      await rateLimiter.waitIfNeeded()

      const queryParams = new URLSearchParams()
      queryParams.append("apikey", apiKey)

      const response = await withRetry(
        () =>
          fetch(
            `https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(cleanEventId)}.json?${queryParams.toString()}`,
          ),
        { maxAttempts: 3, baseDelay: 1000 },
      )

      if (!response.ok) {
        const error = handleTicketmasterError(response.status, await response.text())
        logger.error("Ticketmaster event details error", {
          component: "ticketmaster-api",
          action: "event_details_error",
          metadata: { eventId: cleanEventId, status: response.status },
        })
        return null
      }

      const event = await response.json()
      const eventDetail = transformTicketmasterEvent(event)

      // Cache for 30 minutes
      memoryCache.set(cacheKey, eventDetail, 30 * 60 * 1000)

      logger.info("Ticketmaster event details retrieved", {
        component: "ticketmaster-api",
        action: "event_details_success",
        metadata: { eventId: cleanEventId },
      })

      return eventDetail
    } catch (error) {
      logger.error(
        "Error fetching Ticketmaster event details",
        {
          component: "ticketmaster-api",
          action: "event_details_error",
          metadata: { eventId },
        },
        error instanceof Error ? error : new Error(formatErrorMessage(error)),
      )
      return null
    }
  })
}

// Export rate limiter usage for monitoring
export function getTicketmasterUsage() {
  return rateLimiter.getUsage()
}

// Export types
export type { TicketmasterSearchResult }
