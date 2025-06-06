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
  private readonly maxRequestsPerSecond = 2 // Reduced from 5 to 2
  private readonly maxRequestsPerMinute = 100 // Reduced from 200 to 100
  private readonly maxRequestsPerDay = 2000 // Reduced from 5000 to 2000

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
        logger.info("Waiting for Ticketmaster minute rate limit", { waitTime })
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    // Check per-second limit with longer wait
    const recentSecondRequests = this.requests.filter((time) => now - time < 1000)
    if (recentSecondRequests.length >= this.maxRequestsPerSecond) {
      logger.info("Waiting for Ticketmaster second rate limit")
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds instead of 1
    }

    // Add additional spacing between requests
    if (this.requests.length > 0) {
      const lastRequest = Math.max(...this.requests)
      const timeSinceLastRequest = now - lastRequest
      if (timeSinceLastRequest < 500) {
        // Ensure at least 500ms between requests
        await new Promise((resolve) => setTimeout(resolve, 500 - timeSinceLastRequest))
      }
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
      return formatDateForTicketmaster(new Date())
    }
    // Ensure the date is in the correct format: YYYY-MM-DDTHH:mm:ssZ (without milliseconds)
    return formatDateForTicketmaster(date)
  } catch (error) {
    logger.warn("Failed to format Ticketmaster date", {
      component: "ticketmaster-api",
      action: "date_format_error",
      metadata: { originalDate: dateString, error: formatErrorMessage(error) },
    })
    return formatDateForTicketmaster(new Date())
  }
}

// Helper function to format date exactly as Ticketmaster expects
function formatDateForTicketmaster(date: Date): string {
  // Format: YYYY-MM-DDTHH:mm:ssZ (no milliseconds)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
}

export async function searchTicketmasterEvents(params: TicketmasterSearchParams): Promise<TicketmasterSearchResult> {
  return measurePerformance("searchTicketmasterEvents", async () => {
    const startTime = Date.now()
    let apiKey = ""

    try {
      // Get API key from server environment only
      apiKey = serverEnv.TICKETMASTER_API_KEY

      // Enhanced API key validation
      if (!apiKey || apiKey.trim().length === 0) {
        logger.warn("Ticketmaster API key not configured or empty", {
          component: "ticketmaster-api",
          action: "missing_api_key",
          metadata: { hasKey: !!apiKey, keyLength: apiKey ? apiKey.length : 0 },
        })
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

      // Location handling with validation - Updated to use geoPoint (recommended) instead of deprecated latlong
      if (params.coordinates) {
        if (isValidCoordinates(params.coordinates)) {
          // Use geoPoint instead of deprecated latlong parameter
          queryParams.append("geoPoint", `${params.coordinates.lat},${params.coordinates.lng}`)
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
        queryParams.append("startDateTime", formatDateForTicketmaster(now))
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

      // Additional filtering parameters from Ticketmaster API
      if (params.countryCode) {
        queryParams.append("countryCode", params.countryCode.toUpperCase())
      }

      if (params.stateCode) {
        queryParams.append("stateCode", params.stateCode.toUpperCase())
      }

      // Enhanced filtering options
      queryParams.append("includeFamily", "yes") // Include family-friendly events
      queryParams.append("includeTBA", "no") // Exclude TBA events for better UX
      queryParams.append("includeTBD", "no") // Exclude TBD events for better UX
      queryParams.append("includeTest", "no") // Exclude test events

      // Pagination with validation - more conservative for rate limiting
      queryParams.append("size", Math.min(params.size || 50, 100).toString()) // Reduced from 200 to 100 max, default 50
      queryParams.append("page", Math.max(params.page || 0, 0).toString())

      // Sort and additional options - Enhanced sorting based on location
      const sortOrder = params.coordinates ? "distance,asc" : "relevance,desc"
      queryParams.append("sort", sortOrder)
      queryParams.append("includeSpellcheck", "yes")

      // Locale for better international support
      queryParams.append("locale", "en-us")

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

      // Enhanced error logging with more details
      logger.error("Ticketmaster search failed", {
        component: "ticketmaster-api",
        action: "search_error",
        metadata: {
          params,
          responseTime,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey ? apiKey.length : 0,
        },
      })

      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        error: `Ticketmaster API error: ${errorMessage}`,
        responseTime,
        cached: false,
      }
    }
  })
}

// Enhanced error handling based on Ticketmaster API documentation
function handleTicketmasterError(status: number, errorText: string): string {
  switch (status) {
    case 400:
      // Parse the error response for more specific error messages
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.fault) {
          // Handle Ticketmaster fault structure
          const faultString = errorData.fault.faultstring || "Bad Request"
          const errorCode = errorData.fault.detail?.errorcode || ""
          return `Ticketmaster API error: ${faultString}${errorCode ? ` (${errorCode})` : ""}`
        }
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.detail || err.code || "Unknown error")
          return `Ticketmaster API error: ${errorMessages.join(", ")}`
        }
      } catch {
        // If parsing fails, fall back to generic message
      }
      return `Invalid request parameters: ${errorText}`
    case 401:
      // Handle specific OAuth errors from Ticketmaster
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.fault?.detail?.errorcode === "oauth.v2.InvalidApiKey") {
          return "Invalid Ticketmaster API key - please check your credentials"
        }
      } catch {
        // Fall back to generic message
      }
      return "Invalid Ticketmaster API key - please check your credentials"
    case 403:
      return "Access forbidden - check your API permissions and subscription level"
    case 429:
      return "Rate limit exceeded (5 requests/second or 5000/day) - please try again later"
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

    // Allow both HTTP and HTTPS for broader compatibility
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false
    }

    // Check for image file extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|avif)$/i
    if (imageExtensions.test(parsedUrl.pathname)) {
      return true
    }

    // Trusted image hosting domains (more comprehensive list)
    const trustedDomains = [
      "ticketmaster",
      "livenation",
      "tmol-prd",
      "s1.ticketm.net",
      "media.ticketmaster.com",
      "cloudinary",
      "amazonaws",
      "cloudfront",
      "imgix",
      "fastly",
      "akamai",
      "googleusercontent",
      "gstatic",
      "fbcdn",
      "cdninstagram",
      "imgur",
      "pexels",
      "pixabay",
      "unsplash",
      "placeholder",
      "giphy"
    ]

    // Check if hostname contains any trusted domain
    const isTrustedDomain = trustedDomains.some(domain =>
      parsedUrl.hostname.toLowerCase().includes(domain.toLowerCase())
    )

    // Additional check for image-related query parameters or paths
    const hasImageIndicators = url.toLowerCase().includes('image') ||
                              url.toLowerCase().includes('photo') ||
                              url.toLowerCase().includes('picture') ||
                              url.toLowerCase().includes('img')

    return isTrustedDomain || hasImageIndicators
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
      // Check if it's actually free
      if (range.min === 0 && range.max === 0) {
        price = "Free"
      } else if (range.min === range.max && range.min > 0) {
        price = `$${range.min.toFixed(2)}`
      } else if (range.min > 0 && range.max > 0) {
        price = `$${range.min.toFixed(2)} - $${range.max.toFixed(2)}`
      } else if (range.min > 0) {
        price = `From $${range.min.toFixed(2)}`
      }
    } else if (typeof range.min === "number" && range.min > 0) {
      price = `From $${range.min.toFixed(2)}`
    }
  }

  // Check if tickets are free from accessibility info
  if (
    eventData.accessibility &&
    eventData.accessibility.info &&
    eventData.accessibility.info.toLowerCase().includes("free")
  ) {
    price = "Free"
  }

  // Additional check for free events in event info and pleaseNote
  const eventInfo = `${eventData.info || ""} ${eventData.pleaseNote || ""}`.toLowerCase()
  if (eventInfo.includes("free admission") ||
      eventInfo.includes("free entry") ||
      eventInfo.includes("no charge") ||
      eventInfo.includes("complimentary") ||
      eventInfo.match(/\bfree\b/)) {
    price = "Free"
  }

  // If no price found but event has ticket URL, try to extract from description or provide intelligent estimate
  if (price === "Price TBA" && eventData.url) {
    const allText = `${eventData.name || ""} ${eventInfo}`.toLowerCase()

    // Look for price patterns in the text
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)/g,  // $10.00 or $10
      /(\d+(?:\.\d{2})?)\s*dollars?\b/gi,  // 10 dollars
      /tickets?\s*\$?(\d+(?:\.\d{2})?)/gi,  // tickets $10
    ]

    const foundPrices: number[] = []
    for (const pattern of pricePatterns) {
      const matches = [...allText.matchAll(pattern)]
      for (const match of matches) {
        const priceValue = parseFloat(match[1])
        if (!isNaN(priceValue) && priceValue > 0 && priceValue < 10000) {
          foundPrices.push(priceValue)
        }
      }
    }

    if (foundPrices.length > 0) {
      const minPrice = Math.min(...foundPrices)
      const maxPrice = Math.max(...foundPrices)

      if (minPrice === maxPrice) {
        price = `$${minPrice.toFixed(2)}`
      } else {
        price = `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
      }
    } else {
      // Intelligent price estimation based on event type and venue
      const eventName = eventData.name?.toLowerCase() || ""
      const venueName = eventData._embedded?.venues?.[0]?.name?.toLowerCase() || ""
      const classifications = eventData.classifications || []
      const genre = classifications[0]?.genre?.name?.toLowerCase() || ""
      const segment = classifications[0]?.segment?.name?.toLowerCase() || ""

      // Estimate price based on event category and venue type
      if (segment === "music" || genre.includes("music") || genre.includes("concert")) {
        if (venueName.includes("arena") || venueName.includes("stadium") || venueName.includes("amphitheatre")) {
          price = "$45.00 - $150.00"
        } else if (venueName.includes("theater") || venueName.includes("hall")) {
          price = "$25.00 - $85.00"
        } else {
          price = "$15.00 - $45.00"
        }
      } else if (segment === "sports" || genre.includes("sport")) {
        if (venueName.includes("stadium") || venueName.includes("arena")) {
          price = "$30.00 - $200.00"
        } else {
          price = "$20.00 - $100.00"
        }
      } else if (segment === "arts & theatre" || genre.includes("theatre")) {
        price = "$25.00 - $100.00"
      } else if (eventName.includes("comedy") || genre.includes("comedy")) {
        price = "$20.00 - $60.00"
      } else if (eventName.includes("festival")) {
        price = "$25.00 - $75.00"
      } else {
        // Keep as "Price TBA" for unknown event types
        price = "Price TBA"
      }
    }
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
