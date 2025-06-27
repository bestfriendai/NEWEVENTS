import { NextResponse } from "next/server"
import { rapidAPIRealtimeEventsService } from "@/lib/api/rapidapi-realtime-events"

export async function GET() {
  try {
    // Test 1: Basic search
    const test1 = await rapidAPIRealtimeEventsService.searchEvents({
      query: "concert",
      location: "New York",
      limit: 5
    })
    
    // Test 2: Coordinate-based search
    const test2 = await rapidAPIRealtimeEventsService.searchEvents({
      coordinates: { lat: 40.7128, lng: -74.0060 },
      radius: 25,
      limit: 5
    })
    
    // Test 3: Query only
    const test3 = await rapidAPIRealtimeEventsService.searchEvents({
      query: "music festival",
      limit: 5
    })
    
    return NextResponse.json({
      test1: {
        description: "Search with query and location",
        count: test1.length,
        sample: test1[0] ? {
          title: test1[0].title,
          date: test1[0].date,
          location: test1[0].location
        } : null
      },
      test2: {
        description: "Search with coordinates",
        count: test2.length,
        sample: test2[0] ? {
          title: test2[0].title,
          date: test2[0].date,
          location: test2[0].location
        } : null
      },
      test3: {
        description: "Search with query only",
        count: test3.length,
        sample: test3[0] ? {
          title: test3[0].title,
          date: test3[0].date,
          location: test3[0].location
        } : null
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}