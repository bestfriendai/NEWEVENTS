import { NextRequest, NextResponse } from "next/server"
import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined
    const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 25
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10

    logger.info("Featured Events API request", {
      component: "FeaturedEventsAPI",
      action: "GET",
      metadata: { lat, lng, radius, limit },
    })

    // Validate required parameters
    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          message: "Location coordinates (lat, lng) are required for featured events",
          error: "Missing required parameters",
          data: {
            events: [],
            totalCount: 0,
            hasMore: false,
          },
        },
        { status: 400 }
      )
    }

    // Get featured events near user
    const result = await unifiedEventsService.getFeaturedEventsNearUser(lat, lng, radius, limit)

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch featured events",
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
      message: "Featured events fetched successfully",
      data: {
        events: result.events,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        sources: result.sources,
      },
    })
  } catch (error) {
    logger.error("Featured Events API error", {
      component: "FeaturedEventsAPI",
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
      limit = 10
    } = body

    logger.info("Featured Events API POST request", {
      component: "FeaturedEventsAPI",
      action: "POST",
      metadata: { lat, lng, radius, limit },
    })

    // Validate required parameters
    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          message: "Location coordinates (lat, lng) are required for featured events",
          error: "Missing required parameters",
          data: {
            events: [],
            totalCount: 0,
            hasMore: false,
          },
        },
        { status: 400 }
      )
    }

    // Get featured events near user
    const result = await unifiedEventsService.getFeaturedEventsNearUser(lat, lng, radius, limit)

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch featured events",
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
      message: "Featured events fetched successfully",
      data: {
        events: result.events,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        sources: result.sources,
      },
    })
  } catch (error) {
    logger.error("Featured Events API POST error", {
      component: "FeaturedEventsAPI",
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
