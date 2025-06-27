import { NextResponse } from "next/server"
import { serverEnv } from "@/lib/env"
import { unifiedEventsService } from "@/lib/api/unified-events-service"

export async function GET() {
  // Test RapidAPI directly
  const testParams = {
    lat: 40.7128,
    lng: -74.0060,
    radius: 25,
    limit: 5
  }
  
  // Call searchEvents to see full flow
  const result = await unifiedEventsService.searchEvents(testParams)
  
  return NextResponse.json({
    environment: {
      hasRapidAPIKey: !!serverEnv.RAPIDAPI_KEY,
      rapidAPIKeyLength: serverEnv.RAPIDAPI_KEY?.length || 0,
      hasTicketmasterKey: !!serverEnv.TICKETMASTER_API_KEY,
      nodeEnv: process.env.NODE_ENV
    },
    searchResult: {
      totalEvents: result.totalCount,
      sources: result.sources,
      responseTime: result.responseTime,
      error: result.error
    },
    sampleEvents: result.events.slice(0, 3).map(e => ({
      title: e.title,
      externalId: (e as any).externalId,
      source: (e as any).source
    }))
  })
}