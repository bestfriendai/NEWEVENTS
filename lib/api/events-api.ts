import type { EventDetailProps } from "@/components/event-detail-modal"
import { searchTicketmasterEvents } from "@/lib/api/ticketmaster-api"
import { logger, measurePerformance, formatErrorMessage } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"
import { serverEnv } from "@/lib/env"
import { calculateDistance } from "@/lib/utils/event-utils"

// Enhanced interface for search parameters
export interface EventSearchParams {
  keyword?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  radius?: number
  startDateTime?: string
  endDateTime?: string
  categories?: string[]
  page?: number
  size?: number
  sort?: string
  priceRange?: { min: number; max: number }
  dateRange?: { start: string; end: string }
}

// Enhanced search result interface
export interface EventSearchResult {
  events: EventDetailProps[]
  totalCount: number
  page: number
  totalPages: number
  sources: string[]
  error?: string
  cached?: boolean
  responseTime?: number
  filters?: {
    categories: string[]
    priceRanges: string[]
    locations: string[]
  }
}

// Rate limiter for API calls
class APIRateLimiter {
  private rapidApiRequests: number[] = []
  private ticketmasterRequests: number[] = []
  private eventbriteRequests: number[] = []

  private readonly rapidApiLimit = 500 // per hour
  private readonly ticketmasterLimit = 200 // per minute
  private readonly eventbriteLimit = 1000 // per hour

  checkRapidApiLimit(): boolean {
    const now = Date.now()
    this.rapidApiRequests = this.rapidApiRequests.filter((time) => now - time < 60 * 60 * 1000)
    return this.rapidApiRequests.length < this.rapidApiLimit
  }

  checkTicketmasterLimit(): boolean {
    const now = Date.now()
    this.ticketmasterRequests = this.ticketmasterRequests.filter((time) => now - time < 60 * 1000)
    return this.ticketmasterRequests.length < this.ticketmasterLimit
  }

  checkEventbriteLimit(): boolean {
    const now = Date.now()
    this.eventbriteRequests = this.eventbriteRequests.filter((time) => now - time < 60 * 60 * 1000)
    return this.eventbriteRequests.length < this.eventbriteLimit
  }

  recordRapidApiRequest(): void {
    this.rapidApiRequests.push(Date.now())
  }

  recordTicketmasterRequest(): void {
    this.ticketmasterRequests.push(Date.now())
  }

  recordEventbriteRequest(): void {
    this.eventbriteRequests.push(Date.now())
  }
}

const rateLimiter = new APIRateLimiter()

// Enhanced image validation utility
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false

  try {
    const urlObj = new URL(url)
    // Check if it's a valid HTTP/HTTPS URL
    if (!["http:", "https:"].includes(urlObj.protocol)) return false

    // Check if it has a valid image extension or is from known image services
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".avif"]
    const imageServices = [
      // Event platforms
      "images.unsplash.com",
      "img.evbuc.com",
      "s1.ticketm.net",
      "media.ticketmaster.com",
      "tmol-prd.s3.amazonaws.com",
      "livenationinternational.com",
      "cdn.evbuc.com",
      "eventbrite.com",
      "rapidapi.com",

      // Google services
      "encrypted-tbn0.gstatic.com",
      "lh3.googleusercontent.com",
      "lh4.googleusercontent.com",
      "lh5.googleusercontent.com",
      "lh6.googleusercontent.com",
      "images.google.com",
      "ssl.gstatic.com",
      "gstatic.com",

      // Image hosting services
      "pexels.com",
      "pixabay.com",
      "cloudinary.com",
      "amazonaws.com",
      "googleusercontent.com",
      "fbcdn.net",
      "cdninstagram.com",
      "imgur.com",
      "flickr.com",
      "photobucket.com",

      // CDN services
      "cloudfront.net",
      "fastly.com",
      "jsdelivr.net",
      "unpkg.com",
      "cdnjs.cloudflare.com",

      // Social media
      "scontent.com",
      "twimg.com",
      "ytimg.com",
      "vimeocdn.com",

      // Event-specific services
      "meetupstatic.com",
      "stubhubstatic.com",
      "seatgeek.com",
      "vivid-seats.com",
      "ticketnetwork.com",

      // Music platforms
      "spotify.com",
      "last.fm",
      "bandcamp.com",
      "soundcloud.com",
    ]

    const hasImageExtension = imageExtensions.some((ext) => url.toLowerCase().includes(ext))
    const isFromImageService = imageServices.some((service) => url.toLowerCase().includes(service.toLowerCase()))

    // Additional checks for image URLs without extensions
    const hasImageParams =
      url.toLowerCase().includes("image") ||
      url.toLowerCase().includes("photo") ||
      url.toLowerCase().includes("picture") ||
      url.toLowerCase().includes("img") ||
      url.toLowerCase().includes("thumb")

    // Check for common image URL patterns
    const imageUrlPatterns = [
      /\/images?\//i,
      /\/photos?\//i,
      /\/pictures?\//i,
      /\/thumbs?\//i,
      /\/media\//i,
      /\/assets\//i,
      /\/uploads?\//i,
      /\/gallery\//i,
    ]

    const hasImagePattern = imageUrlPatterns.some((pattern) => pattern.test(url))

    // Be more permissive - accept if any of these conditions are met
    return hasImageExtension || isFromImageService || hasImageParams || hasImagePattern
  } catch {
    return false
  }
}

// Enhanced image extraction for RapidAPI events
function extractRapidApiImage(event: any): string {
  // Try multiple image sources in order of preference
  const imageSources = [
    // Primary event images
    event.image,
    event.thumbnail,
    event.photo,
    event.picture,
    event.banner,
    event.cover_image,
    event.poster,
    event.featured_image,
    event.event_image,
    event.main_image,

    // Nested image objects - handle arrays and objects
    event.images?.[0]?.url,
    event.images?.[0]?.original?.url,
    event.images?.[0]?.large?.url,
    event.images?.[0]?.medium?.url,
    event.images?.[0],
    event.photos?.[0]?.url,
    event.photos?.[0]?.original?.url,
    event.photos?.[0],

    // Multiple image sizes
    event.image_large,
    event.image_medium,
    event.image_small,
    event.thumbnail_large,
    event.thumbnail_medium,

    // Venue images
    event.venue?.image,
    event.venue?.photo,
    event.venue?.banner,
    event.venue?.cover_image,
    event.venue?.images?.[0]?.url,
    event.venue?.images?.[0]?.original?.url,
    event.venue?.images?.[0],

    // Organizer images
    event.organizer?.image,
    event.organizer?.logo,
    event.organizer?.avatar,
    event.organizer?.photo,
    event.organizer?.banner,

    // Artist/performer images
    event.artist?.image,
    event.artist?.photo,
    event.performer?.image,
    event.performer?.photo,
    event.artists?.[0]?.image,
    event.artists?.[0]?.photo,
    event.performers?.[0]?.image,
    event.performers?.[0]?.photo,

    // Social media images
    event.facebook_image,
    event.twitter_image,
    event.instagram_image,
  ]

  for (const imageUrl of imageSources) {
    if (imageUrl && isValidImageUrl(imageUrl)) {
      logger.debug("RapidAPI image found", {
        component: "events-api",
        action: "image_extraction",
        metadata: {
          eventTitle: event.name || event.title,
          imageUrl,
          imageSource: getImageSourceType(imageUrl, imageSources),
        },
      })
      return imageUrl
    }
  }

  // If no valid image found, return category-based fallback
  return getCategoryImage(event.category || event.type || "")
}

// Helper function to identify image source type for debugging
function getImageSourceType(foundUrl: string, allSources: any[]): string {
  const index = allSources.findIndex((source) => source === foundUrl)
  const sourceTypes = [
    "primary_image",
    "thumbnail",
    "photo",
    "picture",
    "banner",
    "cover_image",
    "poster",
    "featured_image",
    "event_image",
    "main_image",
    "nested_images_url",
    "nested_images_original",
    "nested_images_large",
    "nested_images_medium",
    "nested_images_direct",
    "photos_url",
    "photos_original",
    "photos_direct",
    "image_large",
    "image_medium",
    "image_small",
    "thumbnail_large",
    "thumbnail_medium",
    "venue_image",
    "venue_photo",
    "venue_banner",
    "venue_cover",
    "venue_images_url",
    "venue_images_original",
    "venue_images_direct",
    "organizer_image",
    "organizer_logo",
    "organizer_avatar",
    "organizer_photo",
    "organizer_banner",
    "artist_image",
    "artist_photo",
    "performer_image",
    "performer_photo",
    "artists_image",
    "artists_photo",
    "performers_image",
    "performers_photo",
    "facebook_image",
    "twitter_image",
    "instagram_image",
    "category_fallback",
  ]
  return sourceTypes[index] || "unknown"
}

// Get category-based fallback image
function getCategoryImage(category: string): string {
  const categoryLower = category.toLowerCase()

  const categoryMap: { [key: string]: string } = {
    music: "/images/categories/music-default.jpg",
    concert: "/images/categories/music-default.jpg",
    festival: "/images/categories/festival-default.jpg",
    sports: "/images/categories/sports-default.jpg",
    theater: "/images/categories/theater-default.jpg",
    comedy: "/images/categories/comedy-default.jpg",
    dance: "/images/categories/dance-default.jpg",
    art: "/images/categories/art-default.jpg",
    food: "/images/categories/food-default.jpg",
    business: "/images/categories/business-default.jpg",
    conference: "/images/categories/conference-default.jpg",
    workshop: "/images/categories/workshop-default.jpg",
    nightlife: "/images/categories/nightlife-default.jpg",
    community: "/images/categories/community-default.jpg",
  }

  for (const [key, imagePath] of Object.entries(categoryMap)) {
    if (categoryLower.includes(key)) {
      return imagePath
    }
  }

  return "/community-event.png"
}

// Enhanced search events from RapidAPI with multiple strategies - EXPORTED FUNCTION
export async function searchRapidApiEvents(params: EventSearchParams): Promise<EventDetailProps[]> {
  if (!rateLimiter.checkRapidApiLimit()) {
    logger.warn("RapidAPI rate limit exceeded")
    return []
  }

  try {
    // Check if API key is available
    if (!serverEnv.RAPIDAPI_KEY) {
      logger.warn("RapidAPI key not configured")
      return []
    }

    rateLimiter.recordRapidApiRequest()

    // Multiple search strategies to get more events
    const searchStrategies = []
    const baseSize = Math.min(params.size || 50, 100)

    // Strategy 1: User's specific search (increased allocation)
    if (params.keyword || params.location) {
      searchStrategies.push({
        query: params.keyword || "events entertainment",
        location: params.location,
        size: Math.floor(baseSize / 2), // Increased from /3 to /2
      })
    }

    // Strategy 2: Popular event categories (more categories, better allocation)
    const popularCategories = [
      "concert",
      "music festival",
      "comedy show",
      "sports",
      "theater",
      "art",
      "food",
      "business",
      "conference",
    ]
    for (let i = 0; i < Math.min(4, popularCategories.length); i++) {
      // Increased from 2 to 4 categories
      searchStrategies.push({
        query: popularCategories[i],
        location: params.location,
        size: Math.floor(baseSize / 6), // Adjusted for more categories
      })
    }

    // Strategy 3: Location-based search without specific keywords
    if (params.location) {
      searchStrategies.push({
        query: "entertainment events",
        location: params.location,
        size: Math.floor(baseSize / 3),
      })
    }

    // Strategy 4: Trending and popular events (NEW)
    searchStrategies.push({
      query: "trending popular events",
      location: params.location,
      size: Math.floor(baseSize / 4),
    })

    const allEvents: EventDetailProps[] = []

    // Execute search strategies in parallel
    const searchPromises = searchStrategies.map(async (strategy) => {
      try {
        const events = await executeRapidApiSearch({
          ...params,
          keyword: strategy.query,
          location: strategy.location,
          size: strategy.size,
        })
        return events
      } catch (error) {
        logger.warn("RapidAPI search strategy failed", { strategy, error })
        return []
      }
    })

    const results = await Promise.allSettled(searchPromises)

    // Collect all successful results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        allEvents.push(...result.value)
      }
    })

    // Remove duplicates and return
    return removeDuplicateEvents(allEvents).slice(0, baseSize)
  } catch (error) {
    logger.error("RapidAPI search failed", {
      error: formatErrorMessage(error),
      hasApiKey: !!serverEnv.RAPIDAPI_KEY,
      apiHost: serverEnv.RAPIDAPI_HOST,
    })
    return []
  }
}

// Execute a single RapidAPI search
async function executeRapidApiSearch(params: EventSearchParams): Promise<EventDetailProps[]> {
  try {
    const url = new URL("https://real-time-events-search.p.rapidapi.com/search-events")

    // Enhanced parameter handling
    if (params.keyword) {
      url.searchParams.set("query", params.keyword)
    } else {
      // Default search for popular events if no keyword
      url.searchParams.set("query", "concert music festival entertainment")
    }

    if (params.location) {
      url.searchParams.set("location", params.location)
    }

    // Enhanced date handling - ensure we only get future events
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    if (params.startDateTime) {
      const startDate = new Date(params.startDateTime)
      if (startDate > now) {
        url.searchParams.set("start_date", startDate.toISOString().split("T")[0])
      } else {
        url.searchParams.set("start_date", today)
      }
    } else {
      url.searchParams.set("start_date", today)
    }

    // Add end date for better filtering - default to 6 months from now
    if (params.endDateTime) {
      const endDate = new Date(params.endDateTime)
      url.searchParams.set("end_date", endDate.toISOString().split("T")[0])
    } else {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 6)
      url.searchParams.set("end_date", futureDate.toISOString().split("T")[0])
    }

    url.searchParams.set("limit", String(Math.min(params.size || 50, 100)))
    url.searchParams.set("is_virtual", "false")
    url.searchParams.set("sort", "date")
    url.searchParams.set("include_description", "true")
    url.searchParams.set("include_venue", "true")

    logger.debug("RapidAPI request details", {
      component: "events-api",
      action: "executeRapidApiSearch",
      metadata: {
        url: url.toString(),
        hasApiKey: !!serverEnv.RAPIDAPI_KEY,
        apiHost: serverEnv.RAPIDAPI_HOST,
      },
    })

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": serverEnv.RAPIDAPI_KEY,
        "X-RapidAPI-Host": serverEnv.RAPIDAPI_HOST || "real-time-events-search.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        logger.error("RapidAPI authentication failed - check API key")
        return []
      }
      if (response.status === 403) {
        logger.error("RapidAPI access forbidden - check subscription")
        return []
      }
      if (response.status === 429) {
        logger.warn("RapidAPI rate limit exceeded")
        return []
      }

      const errorText = await response.text().catch(() => "Unknown error")
      logger.error(`RapidAPI error: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()

    if (data.status === "OK" && data.data && Array.isArray(data.data)) {
      logger.info(`RapidAPI returned ${data.data.length} events for query: ${params.keyword}`)

      // Transform events and filter out past events
      const transformedEvents = await Promise.all(
        data.data.map(async (event: any, index: number) => {
          const transformedEvent = await transformRapidApiEventWithImages(event, index)
          return transformedEvent
        }),
      )

      // Filter out past events and events without sufficient content
      const futureEvents = transformedEvents.filter((event) => {
        const eventDate = new Date(event.date)
        const isFutureEvent = eventDate >= now

        // Check content quality - stricter validation
        const hasValidImage = event.image &&
                             event.image !== "/community-event.png" &&
                             event.image !== "/placeholder.svg" &&
                             !event.image.includes("placeholder") &&
                             !event.image.includes("event-") &&
                             !event.image.includes("?height=") &&
                             !event.image.includes("?text=") &&
                             event.image.startsWith("http") &&
                             event.image.length > 20

        const hasValidDescription = event.description &&
                                   event.description.length > 50 && // Increased from 20 to 50
                                   event.description !== "No description available" &&
                                   event.description !== "No description available." &&
                                   event.description !== "This is a sample event. Please try again later." &&
                                   !event.description.includes("TBA") &&
                                   !event.description.includes("To be announced") &&
                                   !event.description.includes("No description") &&
                                   !event.description.toLowerCase().includes("coming soon") &&
                                   !event.description.toLowerCase().includes("more details")

        // Event must have BOTH a valid image AND a valid description
        const hasValidContent = hasValidImage && hasValidDescription

        if (isFutureEvent && !hasValidContent) {
          logger.debug("RapidAPI event filtered out due to insufficient content", {
            component: "events-api",
            action: "rapidapi_content_filter",
            metadata: {
              eventTitle: event.title,
              hasValidImage,
              hasValidDescription,
              imageUrl: event.image,
              descriptionLength: event.description?.length || 0,
              reason: !hasValidImage ? "invalid_image" : "invalid_description"
            },
          })
        }

        return isFutureEvent && hasValidContent
      })

      logger.info(`Filtered to ${futureEvents.length} future events`)
      return futureEvents
    }

    if (data.error) {
      const errorMessage = typeof data.error === "object" ? JSON.stringify(data.error) : String(data.error)
      logger.error(`RapidAPI returned error: ${errorMessage}`, {
        component: "events-api",
        action: "rapidapi_error",
        metadata: {
          url: url.toString().replace(serverEnv.RAPIDAPI_KEY, "***"),
          errorData: data.error,
          responseStatus: response.status,
        },
      })
      return []
    }

    logger.info("RapidAPI returned no events")
    return []
  } catch (error) {
    const errorMessage = formatErrorMessage(error)
    logger.error("RapidAPI search execution failed", {
      component: "events-api",
      action: "rapidapi_execution_error",
      metadata: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        hasApiKey: !!serverEnv.RAPIDAPI_KEY,
        apiHost: serverEnv.RAPIDAPI_HOST,
      },
    })
    return []
  }
}

// Enhanced transform function with image service integration
async function transformRapidApiEventWithImages(event: any, index: number): Promise<EventDetailProps> {
  const numericId = Math.abs(
    event.event_id?.split("").reduce((a: number, b: string) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0) || Math.floor(Math.random() * 10000) + index,
  )

  // Enhanced date/time parsing
  const startDateTime = parseEventDateTime(event.start_time || event.date || event.start_date)
  const endDateTime = event.end_time ? parseEventDateTime(event.end_time) : null

  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  if (startDateTime.isValid) {
    const formatted = formatEventDateTime(startDateTime.date, event.timezone)
    formattedDate = formatted.formattedDate
    formattedTime = formatted.formattedTime
  }

  // Extract price using enhanced extraction
  let price = "Price TBA"
  try {
    const { rapidAPIEventsService } = await import("./rapidapi-events")
    price = rapidAPIEventsService.extractPrice(event)

    // Log pricing extraction for debugging
    logger.debug("Price extraction result", {
      component: "events-api",
      action: "price_extraction",
      metadata: {
        eventTitle: event.name || event.title,
        extractedPrice: price,
        originalPriceData: {
          is_free: event.is_free,
          min_price: event.min_price,
          max_price: event.max_price,
          price: event.price,
          ticket_price: event.ticket_price,
          cost: event.cost,
        },
      },
    })
  } catch (error) {
    // Fallback to basic price extraction
    logger.warn("RapidAPI price extraction failed, using fallback", {
      component: "events-api",
      error: formatErrorMessage(error),
      eventTitle: event.name || event.title,
    })

    if (event.is_free) {
      price = "Free"
    } else if (event.min_price && event.max_price) {
      if (event.min_price === event.max_price) {
        price = `$${event.min_price}`
      } else {
        price = `$${event.min_price} - $${event.max_price}`
      }
    } else if (event.min_price) {
      price = `From $${event.min_price}`
    } else if (event.ticket_price) {
      price = `$${event.ticket_price}`
    } else if (event.cost) {
      price = `$${event.cost}`
    }
  }

  // Extract category
  const category = event.category || extractCategoryFromTags(event.tags || []) || "Event"

  // Extract ticket links
  const ticketLinks = []
  if (event.ticket_links) {
    ticketLinks.push(
      ...event.ticket_links.map((link: any) => ({
        source: link.source || "Tickets",
        link: link.link || "#",
      })),
    )
  }

  // Enhanced image extraction with validation
  const rawImageUrl = extractRapidApiImage(event)

  // Debug logging for image extraction
  logger.debug("RapidAPI image extraction", {
    component: "events-api",
    action: "image_extraction",
    metadata: {
      eventTitle: event.name || event.title,
      rawImageUrl,
      hasImage: !!rawImageUrl,
      isValidUrl: rawImageUrl && rawImageUrl !== "/community-event.png",
    },
  })

  // Try to use image service if available, otherwise use raw URL
  let finalImageUrl = rawImageUrl
  try {
    const { imageService } = await import("../services/image-service")
    const imageResult = await imageService.validateAndEnhanceImage(
      rawImageUrl,
      category,
      event.name || event.title || "Untitled Event",
    )
    finalImageUrl = imageResult.url

    // Log image validation result
    logger.debug("Image validation result", {
      component: "events-api",
      action: "image_validation",
      metadata: {
        eventTitle: event.name || event.title,
        originalUrl: rawImageUrl,
        finalUrl: finalImageUrl,
        isValid: imageResult.isValid,
        source: imageResult.source,
      },
    })
  } catch (error) {
    logger.warn("Image service not available, using raw image URL", {
      component: "events-api",
      error: formatErrorMessage(error),
      metadata: {
        eventTitle: event.name || event.title,
        rawImageUrl,
      },
    })
  }

  return {
    id: numericId,
    title: event.name || event.title || "Untitled Event",
    description: event.description || "No description available.",
    category,
    date: formattedDate,
    time: formattedTime,
    location: event.venue?.name || event.venue_name || "Venue TBA",
    address: event.venue?.full_address || event.venue_address || "Address TBA",
    price,
    image: finalImageUrl,
    organizer: {
      name: event.organizer || event.venue?.name || "Event Organizer",
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates:
      event.venue?.latitude && event.venue?.longitude
        ? { lat: Number(event.venue.latitude), lng: Number(event.venue.longitude) }
        : undefined,
    ticketLinks,
  }
}

// Search events from Eventbrite
async function searchEventbriteEvents(params: EventSearchParams): Promise<EventDetailProps[]> {
  if (!rateLimiter.checkEventbriteLimit()) {
    logger.warn("Eventbrite rate limit exceeded")
    return []
  }

  try {
    rateLimiter.recordEventbriteRequest()

    // Check if we have the required token
    if (!serverEnv.EVENTBRITE_PRIVATE_TOKEN && !serverEnv.EVENTBRITE_PUBLIC_TOKEN) {
      logger.warn("Eventbrite API token not configured")
      return []
    }

    const url = new URL("https://www.eventbriteapi.com/v3/events/search/")

    // Add required parameters
    if (params.keyword) url.searchParams.set("q", params.keyword)
    if (params.location) {
      url.searchParams.set("location.address", params.location)
      url.searchParams.set("location.within", `${params.radius || 25}mi`)
    }

    // Set date range
    if (params.startDateTime) {
      url.searchParams.set("start_date.range_start", new Date(params.startDateTime).toISOString())
    } else {
      // Default to today if no start date provided
      url.searchParams.set("start_date.range_start", new Date().toISOString())
    }

    if (params.endDateTime) {
      url.searchParams.set("start_date.range_end", new Date(params.endDateTime).toISOString())
    }

    // Add expand parameter for additional data
    url.searchParams.set("expand", "venue,organizer,ticket_availability")
    url.searchParams.set("page_size", String(Math.min(params.size || 20, 50))) // Eventbrite max is 50
    url.searchParams.set("sort_by", "date")
    url.searchParams.set("page", String((params.page || 0) + 1)) // Eventbrite uses 1-based pagination

    const token = serverEnv.EVENTBRITE_PRIVATE_TOKEN || serverEnv.EVENTBRITE_PUBLIC_TOKEN

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        logger.error("Eventbrite authentication failed - check API token")
        return []
      }
      if (response.status === 404) {
        logger.warn("Eventbrite endpoint not found - API may be unavailable")
        return []
      }
      if (response.status === 429) {
        logger.warn("Eventbrite rate limit exceeded")
        return []
      }

      const errorText = await response.text().catch(() => "Unknown error")
      logger.error(`Eventbrite API error: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()

    if (data.events && Array.isArray(data.events)) {
      logger.info(`Eventbrite returned ${data.events.length} events`)
      return data.events.map((event: any) => transformEventbriteEvent(event))
    }

    logger.info("Eventbrite returned no events")
    return []
  } catch (error) {
    logger.error("Eventbrite search failed", {
      error: formatErrorMessage(error),
      params: { ...params, size: params.size || 20 },
    })
    return []
  }
}

// Enhanced image extraction for Eventbrite events
function extractEventbriteImage(event: any): string {
  // Try multiple image sources in order of preference
  const imageSources = [
    event.logo?.original?.url,
    event.logo?.url,
    event.image?.original?.url,
    event.image?.url,
    event.organizer?.logo?.original?.url,
    event.organizer?.logo?.url,
    event.venue?.image?.original?.url,
    event.venue?.image?.url,
  ]

  for (const imageUrl of imageSources) {
    if (imageUrl && isValidImageUrl(imageUrl)) {
      return imageUrl
    }
  }

  return "/community-event.png"
}

// Transform Eventbrite event data
function transformEventbriteEvent(event: any): EventDetailProps {
  const numericId = event.id ? Number.parseInt(event.id) : Math.floor(Math.random() * 10000)

  const startDate = event.start?.utc
    ? new Date(event.start.utc)
    : event.start?.local
      ? new Date(event.start.local)
      : new Date()

  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Extract price with better handling
  let price = "Free"
  if (event.is_free === false) {
    if (event.ticket_availability?.minimum_ticket_price) {
      const minPrice = event.ticket_availability.minimum_ticket_price
      const maxPrice = event.ticket_availability.maximum_ticket_price

      if (minPrice.major_value && maxPrice.major_value && minPrice.major_value !== maxPrice.major_value) {
        price = `$${minPrice.major_value} - $${maxPrice.major_value}`
      } else if (minPrice.major_value) {
        price = `$${minPrice.major_value}`
      } else {
        price = "Tickets Available"
      }
    } else {
      price = "Tickets Available"
    }
  }

  // Extract venue information
  const venue = event.venue || {}
  const address = venue.address || {}
  const fullAddress =
    [address.address_1, address.city, address.region, address.country].filter(Boolean).join(", ") || "Address TBA"

  // Extract the best available image
  const image = extractEventbriteImage(event)

  // Debug logging for image extraction
  if (image !== "/community-event.png") {
    logger.info("Eventbrite event image found", {
      component: "events-api",
      action: "image_extraction",
      metadata: {
        eventTitle: event.name?.text || event.name,
        imageUrl: image,
        originalImages: {
          logo: event.logo?.url,
          logoOriginal: event.logo?.original?.url,
          image: event.image?.url,
          organizerLogo: event.organizer?.logo?.url,
        },
      },
    })
  }

  return {
    id: numericId,
    title: event.name?.text || event.name || "Untitled Event",
    description: event.description?.text || event.summary || "No description available.",
    category: event.category?.name || event.subcategory?.name || "Event",
    date: formattedDate,
    time: formattedTime,
    location: venue.name || "Venue TBA",
    address: fullAddress,
    price,
    image,
    organizer: {
      name: event.organizer?.name || "Event Organizer",
      avatar: event.organizer?.logo?.url || "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50, // Eventbrite doesn't provide this in search
    isFavorite: false,
    coordinates:
      venue.latitude && venue.longitude ? { lat: Number(venue.latitude), lng: Number(venue.longitude) } : undefined,
    ticketLinks: event.url ? [{ source: "Eventbrite", link: event.url }] : [],
  }
}

// Search events from PredictHQ
async function searchPredictHQEvents(params: EventSearchParams): Promise<EventDetailProps[]> {
  try {
    // Check if API key is available
    if (!serverEnv.PREDICTHQ_API_KEY) {
      logger.info("PredictHQ API key not configured - skipping PredictHQ search")
      return []
    }

    const url = new URL("https://api.predicthq.com/v1/events/")

    if (params.keyword) url.searchParams.set("q", params.keyword)
    if (params.location) url.searchParams.set("location", params.location)
    if (params.coordinates) {
      url.searchParams.set("within", `${params.radius || 25}mi@${params.coordinates.lat},${params.coordinates.lng}`)
    }
    if (params.startDateTime) {
      url.searchParams.set("active.gte", params.startDateTime)
    }
    if (params.endDateTime) {
      url.searchParams.set("active.lte", params.endDateTime)
    }

    url.searchParams.set("limit", String(Math.min(params.size || 20, 50))) // PredictHQ may have limits
    url.searchParams.set("sort", "start")

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${serverEnv.PREDICTHQ_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn("PredictHQ authentication failed - API key may be invalid or expired")
        return []
      }
      if (response.status === 403) {
        logger.warn("PredictHQ access forbidden - check subscription or API permissions")
        return []
      }
      if (response.status === 429) {
        logger.warn("PredictHQ rate limit exceeded")
        return []
      }

      const errorText = await response.text().catch(() => "Unknown error")
      logger.warn(`PredictHQ API error: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()

    if (data.results && Array.isArray(data.results)) {
      logger.info(`PredictHQ returned ${data.results.length} events`)
      return data.results.map((event: any) => transformPredictHQEvent(event))
    }

    if (data.error) {
      logger.warn(`PredictHQ returned error: ${data.error}`)
    }

    logger.info("PredictHQ returned no events")
    return []
  } catch (error) {
    logger.warn("PredictHQ search failed", {
      error: formatErrorMessage(error),
      hasApiKey: !!serverEnv.PREDICTHQ_API_KEY,
    })
    return []
  }
}

// Enhanced date/time parsing utility
function parseEventDateTime(dateTimeString: string): { date: Date; isValid: boolean } {
  if (!dateTimeString) return { date: new Date(), isValid: false }

  try {
    // Handle various date formats
    let parsedDate: Date

    // ISO 8601 format (most common)
    if (dateTimeString.includes("T") || dateTimeString.includes("Z")) {
      parsedDate = new Date(dateTimeString)
    }
    // Unix timestamp (seconds)
    else if (/^\d{10}$/.test(dateTimeString)) {
      parsedDate = new Date(Number.parseInt(dateTimeString) * 1000)
    }
    // Unix timestamp (milliseconds)
    else if (/^\d{13}$/.test(dateTimeString)) {
      parsedDate = new Date(Number.parseInt(dateTimeString))
    }
    // Date-only format (YYYY-MM-DD)
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
      parsedDate = new Date(dateTimeString + "T00:00:00")
    }
    // US format (MM/DD/YYYY)
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateTimeString)) {
      parsedDate = new Date(dateTimeString)
    }
    // European format (DD/MM/YYYY)
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateTimeString)) {
      const parts = dateTimeString.split("/")
      parsedDate = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`)
    }
    // Default fallback
    else {
      parsedDate = new Date(dateTimeString)
    }

    // Validate the parsed date
    const isValid =
      !isNaN(parsedDate.getTime()) &&
      parsedDate.getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000 && // Not older than 1 year
      parsedDate.getTime() < Date.now() + 2 * 365 * 24 * 60 * 60 * 1000 // Not more than 2 years in future

    return { date: parsedDate, isValid }
  } catch {
    return { date: new Date(), isValid: false }
  }
}

// Enhanced time formatting with timezone support
function formatEventDateTime(date: Date, timezone?: string): { formattedDate: string; formattedTime: string } {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone || undefined,
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone || undefined,
    }

    const formattedDate = date.toLocaleDateString("en-US", options)
    const formattedTime = date.toLocaleTimeString("en-US", timeOptions)

    return { formattedDate, formattedTime }
  } catch {
    // Fallback formatting
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    return { formattedDate, formattedTime }
  }
}

// Helper function to extract category from tags
function extractCategoryFromTags(tags: string[]): string {
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
    tech: "Technology",
    health: "Health",
    education: "Education",
  }

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerTag.includes(key)) return value
    }
  }

  return tags[0].charAt(0).toUpperCase() + tags[0].slice(1)
}

// Enhanced search function with multiple API sources
export async function searchEvents(params: EventSearchParams): Promise<EventSearchResult> {
  return measurePerformance("searchEvents", async () => {
    const startTime = Date.now()

    try {
      // Validate parameters
      if (params.size && params.size > 100) {
        params.size = 100
      }

      // Generate cache key
      const cacheKey = `events_search:${JSON.stringify(params)}`

      // Check cache first
      const cached = memoryCache.get<EventSearchResult>(cacheKey)
      if (cached) {
        logger.info("Events search cache hit", {
          component: "events-api",
          action: "cache_hit",
          metadata: { eventCount: cached.events.length },
        })
        return { ...cached, cached: true }
      }

      logger.info("Searching events from multiple sources", {
        component: "events-api",
        action: "search_events",
        metadata: { params },
      })

      // Search from multiple sources in parallel with individual error handling
      const searchPromises = []
      const sources: string[] = []
      const warnings: string[] = []

      // Ticketmaster search
      if (rateLimiter.checkTicketmasterLimit()) {
        searchPromises.push(
          searchTicketmasterEvents({
            keyword: params.keyword,
            location: params.location,
            coordinates: params.coordinates,
            radius: params.radius,
            startDateTime: params.startDateTime,
            endDateTime: params.endDateTime,
            classificationName: params.categories?.[0],
            page: params.page,
            size: Math.min(params.size || 100, 100), // Increased size since we're only using 2 sources
          })
            .then((result) => {
              if (result.events.length > 0) sources.push("Ticketmaster")
              if (result.error) warnings.push(`Ticketmaster: ${result.error}`)
              return result.events
            })
            .catch((error) => {
              warnings.push(`Ticketmaster: ${formatErrorMessage(error)}`)
              return []
            }),
        )
      }

      // RapidAPI search
      searchPromises.push(
        searchRapidApiEvents({
          ...params,
          size: Math.min(params.size || 100, 100), // Increased size since we're only using 2 sources
        })
          .then((events) => {
            if (events.length > 0) sources.push("RapidAPI")
            return events
          })
          .catch((error) => {
            warnings.push(`RapidAPI: ${formatErrorMessage(error)}`)
            return []
          }),
      )

      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises)

      // Combine events from successful searches
      let allEvents: EventDetailProps[] = []
      results.forEach((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          allEvents.push(...result.value)
        }
      })

      // Remove duplicates based on title and date similarity
      allEvents = removeDuplicateEvents(allEvents)

      // Apply additional filtering
      allEvents = applyFilters(allEvents, params)

      // Sort events
      allEvents = sortEvents(allEvents, params.sort || "date", params.coordinates)

      // Apply pagination
      const page = params.page || 0
      const size = params.size || 20
      const startIndex = page * size
      const paginatedEvents = allEvents.slice(startIndex, startIndex + size)

      // Generate filter options
      const filters = generateFilterOptions(allEvents)

      const responseTime = Date.now() - startTime

      const result: EventSearchResult = {
        events: paginatedEvents,
        totalCount: allEvents.length,
        page,
        totalPages: Math.ceil(allEvents.length / size),
        sources,
        responseTime,
        cached: false,
        filters,
        error: warnings.length > 0 ? `Some APIs had issues: ${warnings.join("; ")}` : undefined,
      }

      // Cache the result for 5 minutes (shorter for real data)
      if (result.events.length > 0) {
        memoryCache.set(cacheKey, result, 5 * 60 * 1000)
      }

      logger.info("Events search completed", {
        component: "events-api",
        action: "search_events_success",
        metadata: {
          eventCount: result.events.length,
          totalCount: result.totalCount,
          sources,
          warnings: warnings.length,
          responseTime,
          apiStatus: {
            ticketmaster: sources.includes("Ticketmaster"),
            rapidapi: sources.includes("RapidAPI"),
          },
        },
      })

      // If no events found from any API, return empty results instead of fallback events
      if (result.events.length === 0) {
        logger.info("No events found from APIs, returning empty results")
        result.events = []
        result.totalCount = 0
        result.sources = []
        if (warnings.length > 0) {
          result.error = `APIs had issues: ${warnings.join("; ")} - No events available`
        }
      }

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = formatErrorMessage(error)

      logger.error(
        "Events search failed",
        {
          component: "events-api",
          action: "search_events_error",
          metadata: { params, responseTime },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      // Return fallback events on complete failure
      // Return empty results on complete failure instead of fallback events
      return {
        events: [],
        totalCount: 0,
        page: params.page || 0,
        totalPages: 0,
        sources: [],
        error: `Search failed: ${errorMessage} - No events available`,
        responseTime,
        cached: false,
      }
    }
  })
}

// Remove duplicate events
function removeDuplicateEvents(events: EventDetailProps[]): EventDetailProps[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = `${event.title.toLowerCase()}-${event.date}-${event.location.toLowerCase()}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// Apply additional filters
function applyFilters(events: EventDetailProps[], params: EventSearchParams): EventDetailProps[] {
  let filtered = events

  // First, apply content quality filtering - exclude events without proper content
  const originalCount = filtered.length
  filtered = filtered.filter((event) => {
    // Check for valid image (not placeholder or fallback) - stricter validation
    const hasValidImage = event.image &&
                         event.image !== "/community-event.png" &&
                         event.image !== "/placeholder.svg" &&
                         !event.image.includes("placeholder") &&
                         !event.image.includes("event-") &&
                         !event.image.includes("?height=") &&
                         !event.image.includes("?text=") &&
                         event.image.startsWith("http") &&
                         event.image.length > 20 // Ensure it's not just a short URL

    // Check for meaningful description (not generic fallbacks) - stricter validation
    const hasValidDescription = event.description &&
                               event.description.length > 50 && // Increased from 20 to 50
                               event.description !== "No description available" &&
                               event.description !== "No description available." &&
                               event.description !== "This is a sample event. Please try again later." &&
                               !event.description.includes("TBA") &&
                               !event.description.includes("To be announced") &&
                               !event.description.includes("No description") &&
                               !event.description.toLowerCase().includes("coming soon") &&
                               !event.description.toLowerCase().includes("more details")

    // Event must have BOTH a valid image AND a valid description (stricter requirement)
    const hasValidContent = hasValidImage && hasValidDescription

    if (!hasValidContent) {
      logger.debug("Event filtered out due to insufficient content", {
        component: "events-api",
        action: "content_quality_filter",
        metadata: {
          eventTitle: event.title,
          hasValidImage,
          hasValidDescription,
          imageUrl: event.image,
          descriptionLength: event.description?.length || 0,
          reason: !hasValidImage ? "invalid_image" : "invalid_description"
        },
      })
    }

    return hasValidContent
  })

  const contentFilteredCount = filtered.length
  if (contentFilteredCount < originalCount) {
    logger.info("Content quality filtering applied", {
      component: "events-api",
      action: "content_quality_filter",
      metadata: {
        originalCount,
        filteredCount: contentFilteredCount,
        eventsRemoved: originalCount - contentFilteredCount,
      },
    })
  }

  // Apply geographic filtering based on coordinates and radius
  if (params.coordinates && params.radius) {
    const { lat: userLat, lng: userLng } = params.coordinates
    const radiusInMiles = params.radius

    filtered = filtered.filter((event) => {
      // Skip events without coordinates
      if (!event.coordinates) {
        logger.debug("Event missing coordinates, excluding from geographic filter", {
          eventTitle: event.title,
          eventLocation: event.location,
        })
        return false
      }

      const distance = calculateDistance(userLat, userLng, event.coordinates.lat, event.coordinates.lng)

      const withinRadius = distance <= radiusInMiles

      if (!withinRadius) {
        logger.debug("Event outside radius, filtering out", {
          eventTitle: event.title,
          distance: Math.round(distance * 10) / 10,
          radius: radiusInMiles,
          userLocation: { lat: userLat, lng: userLng },
          eventLocation: event.coordinates,
        })
      }

      return withinRadius
    })

    logger.info("Geographic filtering applied", {
      component: "events-api",
      action: "geographic_filter",
      metadata: {
        originalCount: contentFilteredCount,
        filteredCount: filtered.length,
        userLocation: params.coordinates,
        radius: radiusInMiles,
        eventsRemoved: contentFilteredCount - filtered.length,
      },
    })
  }

  // Apply price range filtering
  if (params.priceRange) {
    filtered = filtered.filter((event) => {
      if (event.price.toLowerCase() === "free") {
        return params.priceRange!.min === 0
      }

      const priceMatch = event.price.match(/\$(\d+)/)
      if (priceMatch) {
        const price = Number.parseInt(priceMatch[1])
        return price >= params.priceRange!.min && price <= params.priceRange!.max
      }

      return true
    })
  }

  // Apply date range filtering
  if (params.dateRange) {
    const startDate = new Date(params.dateRange.start)
    const endDate = new Date(params.dateRange.end)

    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  return filtered
}

// Sort events
function sortEvents(
  events: EventDetailProps[],
  sortBy: string,
  userLocation?: { lat: number; lng: number },
): EventDetailProps[] {
  const sortedEvents = [...events]

  switch (sortBy) {
    case "date":
      return sortedEvents.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })

    case "distance":
      if (!userLocation) {
        logger.warn("Distance sorting requested but no user location provided")
        return sortedEvents
      }
      return sortedEvents.sort((a, b) => {
        const distanceA = a.coordinates
          ? calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng)
          : Number.MAX_VALUE
        const distanceB = b.coordinates
          ? calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng)
          : Number.MAX_VALUE
        return distanceA - distanceB
      })

    case "popularity":
      return sortedEvents.sort((a, b) => b.attendees - a.attendees)

    case "price":
      return sortedEvents.sort((a, b) => {
        const priceA = extractPriceValue(a.price)
        const priceB = extractPriceValue(b.price)
        return priceA - priceB
      })

    case "alphabetical":
      return sortedEvents.sort((a, b) => a.title.localeCompare(b.title))

    case "relevance":
    default:
      return sortedEvents
  }
}

// Extract numeric price value
function extractPriceValue(priceString: string): number {
  if (priceString.toLowerCase() === "free") return 0
  const match = priceString.match(/\$(\d+)/)
  return match ? Number.parseInt(match[1]) : 999999
}

// Generate filter options
function generateFilterOptions(events: EventDetailProps[]) {
  const categories = [...new Set(events.map((e) => e.category))].sort()
  const priceRanges = ["Free", "$1-$25", "$26-$50", "$51-$100", "$100+"]
  const locations = [...new Set(events.map((e) => e.address.split(",").pop()?.trim() || ""))].sort()

  return {
    categories,
    priceRanges,
    locations,
  }
}

// Test RapidAPI connection specifically
export async function testRapidApiConnection(): Promise<boolean> {
  try {
    if (!serverEnv.RAPIDAPI_KEY) {
      logger.warn("RapidAPI key not configured")
      return false
    }

    const events = await searchRapidApiEvents({ keyword: "test", size: 1 })
    return events.length >= 0 // Even 0 results means API is working
  } catch (error) {
    logger.error("RapidAPI connection test failed", { error: formatErrorMessage(error) })
    return false
  }
}

// Get event details
export async function getEventDetails(eventId: string): Promise<EventDetailProps | null> {
  return measurePerformance("getEventDetails", async () => {
    try {
      const cacheKey = `event_details:${eventId}`
      const cached = memoryCache.get<EventDetailProps>(cacheKey)

      if (cached) {
        return cached
      }

      // Try Ticketmaster first
      const ticketmasterEvent = await searchTicketmasterEvents({ keyword: eventId, size: 1 })
      if (ticketmasterEvent.events.length > 0) {
        const event = ticketmasterEvent.events[0]
        memoryCache.set(cacheKey, event, 30 * 60 * 1000)
        return event
      }

      // If not found, search across all sources
      const searchResult = await searchEvents({ keyword: eventId, size: 1 })
      if (searchResult.events.length > 0) {
        const event = searchResult.events[0]
        memoryCache.set(cacheKey, event, 30 * 60 * 1000)
        return event
      }

      return null
    } catch (error) {
      logger.error("Failed to get event details", {
        eventId,
        error: formatErrorMessage(error),
      })
      return null
    }
  })
}

// Get featured events
export async function getFeaturedEvents(limit = 6): Promise<EventDetailProps[]> {
  try {
    const cacheKey = `featured_events:${limit}`
    const cached = memoryCache.get<EventDetailProps[]>(cacheKey)

    if (cached) {
      return cached
    }

    logger.info("Fetching featured events", { limit })

    // Try multiple search strategies for featured events
    const searchStrategies = [
      { keyword: "concert music festival", location: "New York, NY" },
      { keyword: "popular events", location: "Los Angeles, CA" },
      { keyword: "entertainment shows", location: "Chicago, IL" },
      { keyword: "live music", location: "Austin, TX" },
    ]

    const allEvents: EventDetailProps[] = []
    let successfulSources = 0

    for (const strategy of searchStrategies) {
      try {
        logger.info(`Trying search strategy: ${strategy.keyword} in ${strategy.location}`)

        const searchResult = await searchEvents({
          ...strategy,
          size: Math.ceil(limit / 2), // Get more events per strategy
          sort: "popularity",
        })

        if (searchResult.events.length > 0) {
          allEvents.push(...searchResult.events)
          successfulSources++
          logger.info(
            `Strategy successful: found ${searchResult.events.length} events from sources: ${searchResult.sources.join(", ")}`,
          )

          // Break if we have enough events from successful sources
          if (allEvents.length >= limit && successfulSources >= 2) break
        }
      } catch (error) {
        logger.warn(`Featured events search strategy failed: ${formatErrorMessage(error)}`)
        continue
      }
    }

    // Remove duplicates and sort by popularity
    const uniqueEvents = removeDuplicateEvents(allEvents)
    let featuredEvents = uniqueEvents.sort((a, b) => b.attendees - a.attendees).slice(0, limit)

    // If we don't have enough events, just return what we have instead of using fallback events
    if (featuredEvents.length < Math.min(limit, 3)) {
      logger.info("Insufficient API results for featured events, returning available events only")
    }

    // Cache even if we have fewer events than requested
    if (featuredEvents.length > 0) {
      memoryCache.set(cacheKey, featuredEvents, 15 * 60 * 1000)
    }

    logger.info(`Featured events: found ${featuredEvents.length} events (${successfulSources} successful sources)`)
    return featuredEvents
  } catch (error) {
    logger.error("Failed to get featured events", {
      error: formatErrorMessage(error),
    })

    // Return empty array instead of fallback events
    logger.info("Returning empty array due to complete failure")
    return []
  }
}

// Test API connections
export async function testApiConnections(): Promise<{
  ticketmaster: boolean
  rapidapi: boolean
}> {
  const results = {
    ticketmaster: false,
    rapidapi: false,
  }

  // Test Ticketmaster
  try {
    const tmResult = await searchTicketmasterEvents({ keyword: "test", size: 1 })
    results.ticketmaster = !tmResult.error
  } catch (error) {
    logger.error("Ticketmaster test failed", { error: formatErrorMessage(error) })
  }

  // Test RapidAPI
  try {
    const rapidEvents = await searchRapidApiEvents({ keyword: "test", size: 1 })
    results.rapidapi = rapidEvents.length >= 0 // Even 0 results means API is working
  } catch (error) {
    logger.error("RapidAPI test failed", { error: formatErrorMessage(error) })
  }

  return results
}

// Define fallback events
function generateFallbackEvents(count: number): EventDetailProps[] {
  const fallbackEvents: EventDetailProps[] = []
  for (let i = 0; i < count; i++) {
    fallbackEvents.push({
      id: i,
      title: `Sample Event ${i + 1}`,
      description: "This is a sample event. Please try again later.",
      category: "Sample",
      date: new Date().toLocaleDateString(),
      time: "7:00 PM",
      location: "Sample Location",
      address: "123 Sample St, Sample City",
      price: "Free",
      image: "/community-event.png",
      organizer: {
        name: "Sample Organizer",
        avatar: "/avatar-1.png",
      },
      attendees: Math.floor(Math.random() * 50) + 10,
      isFavorite: false,
      coordinates: { lat: 34.0522, lng: -118.2437 }, // Los Angeles coordinates
      ticketLinks: [],
    })
  }
  return fallbackEvents
}

// Transform PredictHQ event data
function transformPredictHQEvent(event: any): EventDetailProps {
  const numericId = event.id ? Number.parseInt(event.id) : Math.floor(Math.random() * 10000)

  const startDate = event.start ? new Date(event.start) : new Date()

  const formattedDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Extract price - PredictHQ doesn't directly provide price
  const price = "Price TBA"

  // Extract venue information
  const venue = event.venue || {}
  const location = event.location || []
  const fullAddress = location.join(", ") || "Address TBA"

  // Extract the best available image - PredictHQ doesn't directly provide images
  const image = "/community-event.png"

  return {
    id: numericId,
    title: event.title || "Untitled Event",
    description: event.description || "No description available.",
    category: event.category || "Event",
    date: formattedDate,
    time: formattedTime,
    location: venue.name || "Venue TBA",
    address: fullAddress,
    price,
    image,
    organizer: {
      name: event.brand || "Event Organizer",
      avatar: "/avatar-1.png",
    },
    attendees: Math.floor(Math.random() * 1000) + 50,
    isFavorite: false,
    coordinates: event.location ? { lat: Number(event.location[0]), lng: Number(event.location[1]) } : undefined,
    ticketLinks: event.url ? [{ source: "PredictHQ", link: event.url }] : [],
  }
}

// Export types
export type { EventSearchParams, EventSearchResult }
