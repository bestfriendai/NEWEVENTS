import { NextRequest, NextResponse } from "next/server"
import { unifiedRealEventsAPI } from "@/lib/api/unified-real-events-api"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const location = searchParams.get("location") || "United States"
    const limit = parseInt(searchParams.get("limit") || "20")

    logger.info("Featured events API called", {
      component: "events-featured-api",
      action: "GET", 
      metadata: { location, limit }
    })

    const events = await unifiedRealEventsAPI.getFeaturedEvents(location, limit)

    return NextResponse.json({
      success: true,
      data: events,
      totalCount: events.length,
      location,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error("Error in featured events API", {
      component: "events-featured-api",
      action: "GET",
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false, 
        error: "Failed to fetch featured events",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}