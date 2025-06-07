import { NextRequest, NextResponse } from "next/server"
import { unifiedEventsService } from "@/lib/api/unified-events-service"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing unified events service...")
    
    // Test search events
    const searchResult = await unifiedEventsService.searchEvents({
      query: "concert",
      lat: 40.7128,
      lng: -74.006,
      radius: 25,
      limit: 3,
    })

    const response = {
      success: true,
      totalEvents: searchResult.events.length,
      sources: searchResult.sources,
      error: searchResult.error,
      events: searchResult.events.map(event => ({
        title: event.title,
        image: event.image,
        category: event.category,
        date: event.date,
        time: event.time,
        location: event.location,
        price: event.price,
        isRealImage: event.image && 
                    !event.image.includes('/community-event.png') && 
                    !event.image.includes('/images/categories/') &&
                    (event.image.includes('http') || event.image.includes('https'))
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
