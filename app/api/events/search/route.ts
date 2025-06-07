import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/utils/logger"
import { eventbriteAPI } from "@/lib/api/eventbrite-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const keyword = searchParams.get("keyword") || undefined
    const location = searchParams.get("location") || undefined
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : undefined
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : undefined
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius")!) : 25
    const startDateTime = searchParams.get("startDateTime") || undefined
    const endDateTime = searchParams.get("endDateTime") || undefined
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 0
    const size = searchParams.get("size") ? Number.parseInt(searchParams.get("size")!) : 20

    logger.info("Event search API request", {
      component: "EventSearchAPI",
      action: "GET",
      metadata: { keyword, location, lat, lng, radius, page, size },
    })

    // Search for events using Eventbrite API
    const result = await eventbriteAPI.searchEvents({
      keyword,
      location,
      coordinates: lat && lng ? { lat, lng } : undefined,
      radius,
      startDateTime,
      endDateTime,
      page,
      size,
    })

    return NextResponse.json({
      success: !result.error,
      message: result.error ? `Failed to search events: ${result.error}` : "Events found successfully",
      data: {
        events: result.events,
        totalCount: result.totalCount,
        page: result.page,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    logger.error("Event search API error", {
      component: "EventSearchAPI",
      action: "GET",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search events",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          events: [],
          totalCount: 0,
          page: 0,
          totalPages: 0,
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Parse request body
    const { keyword, location, lat, lng, radius = 25, startDateTime, endDateTime, page = 0, size = 20 } = body

    logger.info("Event search API POST request", {
      component: "EventSearchAPI",
      action: "POST",
      metadata: { keyword, location, lat, lng, radius, page, size },
    })

    // Search for events using Eventbrite API
    const result = await eventbriteAPI.searchEvents({
      keyword,
      location,
      coordinates: lat && lng ? { lat, lng } : undefined,
      radius,
      startDateTime,
      endDateTime,
      page,
      size,
    })

    return NextResponse.json({
      success: !result.error,
      message: result.error ? `Failed to search events: ${result.error}` : "Events found successfully",
      data: {
        events: result.events,
        totalCount: result.totalCount,
        page: result.page,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    logger.error("Event search API POST error", {
      component: "EventSearchAPI",
      action: "POST",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search events",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          events: [],
          totalCount: 0,
          page: 0,
          totalPages: 0,
        },
      },
      { status: 500 },
    )
  }
}
