import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { logger, logError } from "@/lib/utils/logger"

export async function GET() {
  try {
    const config = getServerConfig()
    
    if (!config.ticketmaster.apiKey) {
      return NextResponse.json({
        success: false,
        message: "Ticketmaster API key not configured",
        data: { hasApiKey: false }
      })
    }

    // Test basic API connectivity
    const connectivityTest = await testTicketmasterConnectivity(config.ticketmaster)
    
    // Test event search functionality
    const eventSearchTest = await testTicketmasterEventSearch(config.ticketmaster)

    const allTestsPassed = connectivityTest.success && eventSearchTest.success

    logger.info("Ticketmaster API test completed", {
      component: "TicketmasterTestRoute",
      action: "test_ticketmaster",
      metadata: { 
        connectivity: connectivityTest.success,
        eventSearch: eventSearchTest.success,
        overall: allTestsPassed
      },
    })

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? "Ticketmaster API is working correctly" 
        : "Some Ticketmaster API tests failed",
      data: {
        hasApiKey: true,
        connectivity: connectivityTest,
        eventSearch: eventSearchTest,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logError(
      "Ticketmaster API test failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "TicketmasterTestRoute",
        action: "test_error",
      }
    )

    return NextResponse.json(
      {
        success: false,
        message: "Ticketmaster API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { hasApiKey: !!getServerConfig().ticketmaster.apiKey }
      },
      { status: 500 }
    )
  }
}

async function testTicketmasterConnectivity(config: { baseUrl: string; apiKey: string }) {
  try {
    const response = await fetch(
      `${config.baseUrl}/events.json?apikey=${config.apiKey}&size=1&countryCode=US`,
      {
        method: "GET",
        headers: { 
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      message: "API connectivity successful",
      statusCode: response.status,
      hasEvents: !!(data._embedded?.events?.length),
      eventCount: data._embedded?.events?.length || 0,
      totalElements: data.page?.totalElements || 0
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connectivity test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}

async function testTicketmasterEventSearch(config: { baseUrl: string; apiKey: string }) {
  try {
    // Test event search with location and keyword
    const searchParams = new URLSearchParams({
      apikey: config.apiKey,
      keyword: "concert",
      city: "New York",
      size: "5",
      sort: "date,asc"
    })

    const response = await fetch(
      `${config.baseUrl}/events.json?${searchParams.toString()}`,
      {
        method: "GET",
        headers: { 
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `Event search failed: HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    const data = await response.json()
    const events = data._embedded?.events || []

    // Validate event data structure
    const validEvents = events.filter((event: any) => 
      event.id && 
      event.name && 
      event.dates?.start?.localDate
    )

    return {
      success: true,
      message: "Event search successful",
      statusCode: response.status,
      searchResults: {
        totalFound: data.page?.totalElements || 0,
        returnedCount: events.length,
        validEvents: validEvents.length,
        hasVenues: events.some((e: any) => e._embedded?.venues?.length > 0),
        hasPricing: events.some((e: any) => e.priceRanges?.length > 0),
        sampleEvent: validEvents[0] ? {
          id: validEvents[0].id,
          name: validEvents[0].name,
          date: validEvents[0].dates?.start?.localDate,
          venue: validEvents[0]._embedded?.venues?.[0]?.name
        } : null
      }
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Event search test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}
