import { NextResponse } from "next/server"
import { unifiedEventsService } from "@/lib/api/unified-events-service"

export async function GET() {
  try {
    // Force a completely fresh search with unique parameters
    const uniqueLat = 40.7128 + (Math.random() * 0.01)
    const uniqueLng = -74.0060 + (Math.random() * 0.01)
    
    const result = await unifiedEventsService.searchEvents({
      lat: uniqueLat,
      lng: uniqueLng,
      radius: 25,
      limit: 10,
      forceRefresh: true,
      includeCache: false
    })
    
    return NextResponse.json({
      request: {
        lat: uniqueLat,
        lng: uniqueLng,
        radius: 25
      },
      response: {
        totalCount: result.totalCount,
        sources: result.sources,
        responseTime: result.responseTime,
        hasError: !!result.error,
        error: result.error
      },
      events: result.events.slice(0, 5).map(e => ({
        title: e.title,
        date: e.date,
        location: e.location,
        externalId: (e as any).externalId,
        source: (e as any).source,
        hasValidExternalId: !!(e as any).externalId
      }))
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}