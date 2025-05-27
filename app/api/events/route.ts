import { NextRequest, NextResponse } from "next/server"
import { eventsService } from "@/lib/services/events-service"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined
    const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 25
    const category = searchParams.get("category") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0

    logger.info("Events API request", {
      component: "EventsAPI",
      action: "GET",
      metadata: { lat, lng, radius, category, limit, offset },
    })

    // Search for events
    const result = await eventsService.searchEvents({
      lat,
      lng,
      radius,
      category,
      startDate,
      endDate,
      limit,
      offset,
    })

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch events",
          error: result.error,
          data: {
            events: [],
            totalCount: 0,
            hasMore: false,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Events fetched successfully",
      data: {
        events: result.events,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pagination: {
          limit,
          offset,
          total: result.totalCount,
        },
      },
    })
  } catch (error) {
    logger.error("Events API error", {
      component: "EventsAPI",
      action: "GET",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          events: [],
          totalCount: 0,
          hasMore: false,
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lat,
      lng,
      radius = 25,
      category,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = body

    logger.info("Events API POST request", {
      component: "EventsAPI",
      action: "POST",
      metadata: { lat, lng, radius, category, limit, offset },
    })

    // Search for events using the service
    const result = await eventsService.searchEvents({
      lat,
      lng,
      radius,
      category,
      startDate,
      endDate,
      limit,
      offset,
    })

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch events",
          error: result.error,
          data: {
            events: [],
            totalCount: 0,
            hasMore: false,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Events fetched successfully",
      data: {
        events: result.events,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pagination: {
          limit,
          offset,
          total: result.totalCount,
        },
      },
    })
  } catch (error) {
    logger.error("Events API POST error", {
      component: "EventsAPI",
      action: "POST",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          events: [],
          totalCount: 0,
          hasMore: false,
        },
      },
      { status: 500 }
    )
  }
}
