import { NextRequest, NextResponse } from "next/server"
import { searchEvents } from "@/lib/api/events-api"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location") || "Washington DC"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    logger.info("Testing image extraction", {
      component: "test-images",
      location,
      limit,
    })

    // Search for events to test image extraction
    const result = await searchEvents({
      location,
      size: limit,
    })

    // Analyze image results
    const imageAnalysis = result.events.map(event => ({
      id: event.id,
      title: event.title,
      image: event.image,
      hasRealImage: event.image && event.image !== "/community-event.png",
      imageSource: event.image?.includes("ticketmaster") ? "Ticketmaster" :
                   event.image?.includes("evbuc") ? "Eventbrite" :
                   event.image?.includes("rapidapi") ? "RapidAPI" :
                   event.image?.includes("community-event") ? "Fallback" : "Unknown",
    }))

    const stats = {
      totalEvents: result.events.length,
      eventsWithRealImages: imageAnalysis.filter(e => e.hasRealImage).length,
      eventsWithFallback: imageAnalysis.filter(e => !e.hasRealImage).length,
      imageSourceBreakdown: {
        ticketmaster: imageAnalysis.filter(e => e.imageSource === "Ticketmaster").length,
        eventbrite: imageAnalysis.filter(e => e.imageSource === "Eventbrite").length,
        rapidapi: imageAnalysis.filter(e => e.imageSource === "RapidAPI").length,
        fallback: imageAnalysis.filter(e => e.imageSource === "Fallback").length,
        unknown: imageAnalysis.filter(e => e.imageSource === "Unknown").length,
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image extraction test completed",
      data: {
        stats,
        events: imageAnalysis,
        searchResult: {
          totalCount: result.totalCount,
          sources: result.sources,
          cached: result.cached,
        }
      },
    })

  } catch (error) {
    logger.error("Image extraction test failed", {
      component: "test-images",
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
