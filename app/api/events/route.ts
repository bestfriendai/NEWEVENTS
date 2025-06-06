import { type NextRequest, NextResponse } from "next/server"
import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"

export const runtime = "nodejs"

// Input validation helper
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
    const validation = validateSearchParams(searchParams)

    if (!validation.isValid) {
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

    const { searchTerm, category, page, limit, lat, lng, radius } = validation.params

    logger.info("Events API request", {
      component: "EventsAPI",
      action: "GET",
      metadata: { searchTerm, category, page, limit, lat, lng, radius },
    })

    // Create cache key
    const cacheKey = `events_${JSON.stringify(validation.params)}`
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

    // Search events using unified service
    const result = await unifiedEventsService.searchEvents({
      query: searchTerm,
      category,
      lat,
      lng,
      radius,
      limit,
      offset: page * limit,
    })

    const response = {
      success: true,
      events: result.events,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      sources: result.sources,
      error: result.error,
      responseTime: Date.now() - startTime,
      cached: false,
    }

    // Cache successful results for 5 minutes
    if (!result.error && result.events.length > 0) {
      memoryCache.set(cacheKey, response, 300)
    }

    logger.info("Events API response", {
      component: "EventsAPI",
      action: "success",
      metadata: {
        eventsCount: result.events.length,
        sources: result.sources,
        responseTime: response.responseTime,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    logger.error("Events API error", {
      component: "EventsAPI",
      action: "error",
      error: errorMessage,
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
