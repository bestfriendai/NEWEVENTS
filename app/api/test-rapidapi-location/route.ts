import { NextResponse } from "next/server"
import { rapidAPIRealtimeEventsService } from "@/lib/api/rapidapi-realtime-events"

export async function GET() {
  try {
    // Test different location formats
    const tests = [
      {
        name: "Coordinates as string",
        params: { location: "40.7128,-74.0060", limit: 5 }
      },
      {
        name: "City name",
        params: { location: "New York, NY", limit: 5 }
      },
      {
        name: "Query with location",
        params: { query: "concert", location: "New York", limit: 5 }
      },
      {
        name: "Query only (no location)",
        params: { query: "music events concert", limit: 5 }
      },
      {
        name: "Default unified params",
        params: { 
          query: "events music concert festival show",
          location: "40.7128,-74.006",
          limit: 5
        }
      }
    ]
    
    const results = []
    
    for (const test of tests) {
      const events = await rapidAPIRealtimeEventsService.searchEvents(test.params)
      results.push({
        test: test.name,
        params: test.params,
        eventsFound: events.length,
        firstEvent: events[0] ? {
          title: events[0].title,
          date: events[0].date,
          location: events[0].location
        } : null
      })
    }
    
    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}