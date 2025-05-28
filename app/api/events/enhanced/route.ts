import { type NextRequest, NextResponse } from "next/server"
import { searchEvents } from "@/lib/api/events-api"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters with enhanced defaults
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : undefined
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : undefined
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius")!) : 50 // Increased default radius
    const keyword = searchParams.get("keyword") || searchParams.get("q") || undefined
    const location = searchParams.get("location") || undefined
    const category = searchParams.get("category") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "100"), 200) // Increased default and max
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    logger.info("Enhanced Events API request", {
      component: "EnhancedEventsAPI",
      action: "GET",
      metadata: { lat, lng, radius, keyword, location, category, limit, offset },
    })

    // Multiple search strategies for better coverage
    const searchStrategies = []

    // Primary search with user parameters
    searchStrategies.push({
      keyword,
      location,
      coordinates: lat && lng ? { lat, lng } : undefined,
      radius,
      startDate,
      endDate,
      size: Math.floor(limit / 3),
      page: 0,
    })

    // Broader search if we have location
    if (lat && lng) {
      searchStrategies.push({
        keyword: keyword || "events entertainment music",
        coordinates: { lat, lng },
        radius: radius * 1.5, // Expand radius
        startDate,
        endDate,
        size: Math.floor(limit / 3),
        page: 0,
      })
    }

    // Category-based search
    if (category) {
      searchStrategies.push({
        keyword: category,
        location,
        coordinates: lat && lng ? { lat, lng } : undefined,
        radius,
        categories: [category],
        size: Math.floor(limit / 3),
        page: 0,
      })
    } else {
      // Popular categories search
      searchStrategies.push({
        keyword: "concert festival music entertainment",
        location,
        coordinates: lat && lng ? { lat, lng } : undefined,
        radius,
        size: Math.floor(limit / 3),
        page: 0,
      })
    }

    // Execute all search strategies in parallel
    const searchPromises = searchStrategies.map(async (strategy) => {
      try {
        const result = await searchEvents(strategy)
        return result.events
      } catch (error) {
        logger.warn("Search strategy failed", { strategy, error })
        return []
      }
    })

    const results = await Promise.all(searchPromises)

    // Combine and deduplicate events
    const allEvents = results.flat()
    const uniqueEvents = Array.from(
      new Map(allEvents.map((event) => [`${event.title}-${event.date}-${event.location}`, event])).values(),
    )

    // Apply pagination to final results
    const paginatedEvents = uniqueEvents.slice(offset, offset + limit)

    logger.info("Enhanced Events API completed", {
      component: "EnhancedEventsAPI",
      action: "GET_SUCCESS",
      metadata: {
        strategiesUsed: searchStrategies.length,
        totalFound: uniqueEvents.length,
        returned: paginatedEvents.length,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Events fetched successfully",
      data: {
        events: paginatedEvents,
        totalCount: uniqueEvents.length,
        hasMore: offset + limit < uniqueEvents.length,
        pagination: {
          limit,
          offset,
          total: uniqueEvents.length,
        },
        strategies: searchStrategies.length,
      },
    })
  } catch (error) {
    logger.error("Enhanced Events API error", {
      component: "EnhancedEventsAPI",
      action: "GET_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          events: [],
          totalCount: 0,
          hasMore: false,
        },
      },
      { status: 500 },
    )
  }
}
