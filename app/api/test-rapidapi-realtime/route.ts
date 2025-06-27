import { NextResponse } from "next/server"
import { rapidAPIRealtimeEventsService } from "@/lib/api/rapidapi-realtime-events"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    logger.info("Testing RapidAPI Real-Time Events Search", {
      component: "TestRapidAPIRealtime",
      action: "test_start"
    })

    // Test search functionality
    const searchResults = await rapidAPIRealtimeEventsService.searchEvents({
      query: "music concerts",
      location: "New York, NY",
      limit: 5
    })

    // Test event details (if we have results)
    let eventDetails = null
    if (searchResults.length > 0 && searchResults[0].id) {
      const externalId = (searchResults[0] as any).externalId
      if (externalId && externalId.includes('rapidapi_realtime_')) {
        const eventId = externalId.replace('rapidapi_realtime_', '')
        eventDetails = await rapidAPIRealtimeEventsService.getEventDetails(eventId)
      }
    }

    const response = {
      success: true,
      searchTest: {
        success: searchResults.length >= 0,
        eventsFound: searchResults.length,
        sample: searchResults.slice(0, 2).map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          price: event.price,
          hasImage: !!event.image && event.image !== "/community-event.png"
        }))
      },
      detailsTest: {
        success: !!eventDetails,
        eventTitle: eventDetails?.title || "N/A"
      },
      timestamp: new Date().toISOString()
    }

    logger.info("RapidAPI Real-Time Events test completed", {
      component: "TestRapidAPIRealtime",
      action: "test_complete",
      metadata: response
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error("RapidAPI Real-Time Events test failed", {
      component: "TestRapidAPIRealtime",
      action: "test_error",
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}