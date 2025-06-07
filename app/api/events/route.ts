import { type NextRequest, NextResponse } from "next/server"
import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"

export const runtime = "nodejs"

// Enhanced input validation helper
function validateEnhancedEventSearchParams(params: any) {
  const errors: string[] = []

  // Parse and validate basic parameters
  const query = params.query || ""
  const location = params.location || ""
  const category = params.category || "all"
  const categories = params.categories || []
  const page = Number.parseInt(params.page || "0", 10)
  const limit = Number.parseInt(params.limit || "20", 10)
  const offset = params.offset ? Number.parseInt(params.offset, 10) : undefined
  const lat = params.lat ? Number.parseFloat(params.lat) : undefined
  const lng = params.lng ? Number.parseFloat(params.lng) : undefined
  const radius = Number.parseInt(params.radius || "25", 10)

  // Parse price parameters
  const priceMin = params.priceMin ? Number.parseFloat(params.priceMin) : undefined
  const priceMax = params.priceMax ? Number.parseFloat(params.priceMax) : undefined

  // Parse sorting parameters
  const sortBy = params.sortBy || "date"
  const sortOrder = params.sortOrder || "asc"

  // Parse advanced filters
  const tags = params.tags || []
  const source = params.source || "all"
  const hasImages = params.hasImages === true || params.hasImages === "true"
  const hasDescription = params.hasDescription === true || params.hasDescription === "true"
  const forceRefresh = params.forceRefresh === true || params.forceRefresh === "true"

  // Parse date parameters
  const startDate = params.startDate || undefined
  const endDate = params.endDate || undefined

  // Validate search term length
  if (query.length > 200) {
    errors.push("Search term too long (max 200 characters)")
  }

  // Validate pagination
  if (page < 0) {
    errors.push("Page must be non-negative")
  }
  if (limit < 1 || limit > 100) {
    errors.push("Limit must be between 1 and 100")
  }
  if (offset !== undefined && offset < 0) {
    errors.push("Offset must be non-negative")
  }

  // Validate coordinates
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    errors.push("Latitude must be between -90 and 90")
  }
  if (lng !== undefined && (lng < -180 || lng > 180)) {
    errors.push("Longitude must be between -180 and 180")
  }

  // Validate radius
  if (radius < 1 || radius > 500) {
    errors.push("Radius must be between 1 and 500 km")
  }

  // Validate price range
  if (priceMin !== undefined && priceMin < 0) {
    errors.push("Minimum price must be non-negative")
  }
  if (priceMax !== undefined && priceMax < 0) {
    errors.push("Maximum price must be non-negative")
  }
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    errors.push("Minimum price cannot be greater than maximum price")
  }

  // Validate sorting parameters
  const validSortBy = ["date", "distance", "popularity", "price", "relevance"]
  if (!validSortBy.includes(sortBy)) {
    errors.push(`Invalid sortBy value. Must be one of: ${validSortBy.join(", ")}`)
  }

  const validSortOrder = ["asc", "desc"]
  if (!validSortOrder.includes(sortOrder)) {
    errors.push(`Invalid sortOrder value. Must be one of: ${validSortOrder.join(", ")}`)
  }

  // Validate source parameter
  const validSources = ["all", "rapidapi", "ticketmaster", "eventbrite"]
  if (!validSources.includes(source)) {
    errors.push(`Invalid source value. Must be one of: ${validSources.join(", ")}`)
  }

  // Validate date parameters
  if (startDate && !isValidDateString(startDate)) {
    errors.push("Invalid startDate format. Use ISO 8601 format")
  }
  if (endDate && !isValidDateString(endDate)) {
    errors.push("Invalid endDate format. Use ISO 8601 format")
  }
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push("Start date cannot be after end date")
  }

  return {
    success: errors.length === 0,
    errors,
    params: {
      query,
      location,
      category,
      categories,
      page,
      limit,
      offset,
      lat,
      lng,
      radius,
      priceMin,
      priceMax,
      sortBy,
      sortOrder,
      tags,
      source,
      hasImages,
      hasDescription,
      forceRefresh,
      startDate,
      endDate,
    },
  }
}

// Helper function to validate date strings
function isValidDateString(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && dateString.includes('T') // Basic ISO format check
  } catch {
    return false
  }
}

// Legacy validation function for backward compatibility
function validateSearchParams(searchParams: URLSearchParams) {
  const errors: string[] = []

  const searchTerm = searchParams.get("searchTerm") || searchParams.get("keyword") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "0", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : undefined
  const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : undefined
  const radius = Number.parseInt(searchParams.get("radius") || "25", 10)

  // Validate search term length
  if (searchTerm.length > 200) {
    errors.push("Search term too long (max 200 characters)")
  }

  // Validate pagination
  if (page < 0) {
    errors.push("Page must be non-negative")
  }
  if (limit < 1 || limit > 100) {
    errors.push("Limit must be between 1 and 100")
  }

  // Validate coordinates
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    errors.push("Latitude must be between -90 and 90")
  }
  if (lng !== undefined && (lng < -180 || lng > 180)) {
    errors.push("Longitude must be between -180 and 180")
  }

  // Validate radius
  if (radius < 1 || radius > 500) {
    errors.push("Radius must be between 1 and 500 km")
  }

  return {
    isValid: errors.length === 0,
    errors,
    params: {
      searchTerm,
      category,
      page,
      limit,
      lat,
      lng,
      radius,
    },
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // Parse enhanced parameters
    const enhancedParams = {
      query: searchParams.get("query") || searchParams.get("searchTerm") || searchParams.get("keyword") || "",
      location: searchParams.get("location") || "",
      category: searchParams.get("category") || "all",
      categories: searchParams.get("categories") ? searchParams.get("categories")!.split(",") : [],
      page: searchParams.get("page") || "0",
      limit: searchParams.get("limit") || "20",
      offset: searchParams.get("offset"),
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius") || "25",
      priceMin: searchParams.get("priceMin"),
      priceMax: searchParams.get("priceMax"),
      sortBy: searchParams.get("sortBy") || "date",
      sortOrder: searchParams.get("sortOrder") || "asc",
      tags: searchParams.get("tags") ? searchParams.get("tags")!.split(",") : [],
      source: searchParams.get("source") || "all",
      hasImages: searchParams.get("hasImages"),
      hasDescription: searchParams.get("hasDescription"),
      forceRefresh: searchParams.get("forceRefresh"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    }

    const validation = validateEnhancedEventSearchParams(enhancedParams)

    if (!validation.success) {
      logger.warn("Invalid search parameters", {
        component: "EventsAPI",
        action: "GET",
        errors: validation.errors,
      })
      return NextResponse.json(
        {
          success: false,
          message: "Invalid parameters",
          errors: validation.errors
        },
        { status: 400 }
      )
    }

    const validatedParams = validation.params

    logger.info("Enhanced Events API request", {
      component: "EventsAPI",
      action: "GET",
      metadata: validatedParams,
    })

    // Create cache key (skip if force refresh)
    const cacheKey = `enhanced_events_${JSON.stringify(validatedParams)}`

    if (!validatedParams.forceRefresh) {
      const cachedResult = memoryCache.get(cacheKey)
      if (cachedResult) {
        logger.info("Returning cached events", {
          component: "EventsAPI",
          action: "cache_hit",
          cacheKey,
        })
        return NextResponse.json({
          ...cachedResult,
          cached: true,
          responseTime: Date.now() - startTime,
        })
      }
    }

    // Convert to unified service parameters
    const unifiedParams = {
      query: validatedParams.query || undefined,
      lat: validatedParams.lat,
      lng: validatedParams.lng,
      radius: validatedParams.radius,
      category: validatedParams.category !== "all" ? validatedParams.category : undefined,
      categories: validatedParams.categories.length > 0 ? validatedParams.categories : undefined,
      startDate: validatedParams.startDate,
      endDate: validatedParams.endDate,
      priceMin: validatedParams.priceMin,
      priceMax: validatedParams.priceMax,
      sortBy: validatedParams.sortBy,
      sortOrder: validatedParams.sortOrder,
      limit: validatedParams.limit,
      offset: validatedParams.offset || (validatedParams.page * validatedParams.limit),
      tags: validatedParams.tags.length > 0 ? validatedParams.tags : undefined,
      source: validatedParams.source !== "all" ? validatedParams.source : undefined,
      hasImages: validatedParams.hasImages || undefined,
      hasDescription: validatedParams.hasDescription || undefined,
      forceRefresh: validatedParams.forceRefresh,
    }

    // Search events using unified service
    const result = await unifiedEventsService.searchEvents(unifiedParams)

    const response = {
      success: true,
      events: result.events,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      sources: result.sources,
      error: result.error,
      responseTime: Date.now() - startTime,
      cached: false,
      searchParams: validatedParams, // Include search params for debugging
    }

    // Cache successful results for 5 minutes (unless force refresh)
    if (!result.error && result.events.length > 0 && !validatedParams.forceRefresh) {
      memoryCache.set(cacheKey, response, 300)
    }

    logger.info("Enhanced Events API response", {
      component: "EventsAPI",
      action: "success",
      metadata: {
        eventsCount: result.events.length,
        sources: result.sources,
        responseTime: response.responseTime,
        searchParams: validatedParams,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    logger.error("Enhanced Events API error", {
      component: "EventsAPI",
      action: "error",
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime,
    })

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: errorMessage,
        events: [],
        totalCount: 0,
        hasMore: false,
        sources: { rapidapi: 0, ticketmaster: 0, cached: 0 },
        responseTime,
      },
      { status: 500 }
    )
  }
}
