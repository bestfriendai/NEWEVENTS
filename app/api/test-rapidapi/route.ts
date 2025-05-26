import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    const config = getServerConfig()
    
    if (!config.rapidapi.apiKey || !config.rapidapi.host) {
      return NextResponse.json({
        success: false,
        message: "RapidAPI key or host not configured",
        data: { 
          hasApiKey: !!config.rapidapi.apiKey,
          hasHost: !!config.rapidapi.host
        }
      })
    }

    // Test basic API connectivity
    const connectivityTest = await testRapidApiConnectivity(config.rapidapi)
    
    // Test event search functionality
    const eventSearchTest = await testRapidApiEventSearch(config.rapidapi)

    const allTestsPassed = connectivityTest.success && eventSearchTest.success

    logger.info("RapidAPI test completed", {
      component: "RapidAPITestRoute",
      action: "test_rapidapi",
      metadata: { 
        connectivity: connectivityTest.success,
        eventSearch: eventSearchTest.success,
        overall: allTestsPassed
      },
    })

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? "RapidAPI Events is working correctly" 
        : "Some RapidAPI tests failed",
      data: {
        hasApiKey: true,
        hasHost: true,
        connectivity: connectivityTest,
        eventSearch: eventSearchTest,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error(
      "RapidAPI test failed",
      {
        component: "RapidAPITestRoute",
        action: "test_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        success: false,
        message: "RapidAPI test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { 
          hasApiKey: !!getServerConfig().rapidapi.apiKey,
          hasHost: !!getServerConfig().rapidapi.host
        }
      },
      { status: 500 }
    )
  }
}

async function testRapidApiConnectivity(config: { baseUrl: string; apiKey: string; host: string }) {
  try {
    // Test with a simple search query
    const searchParams = new URLSearchParams({
      query: "test",
      limit: "1"
    })

    const response = await fetch(
      `${config.baseUrl}/search-events?${searchParams.toString()}`,
      {
        method: "GET",
        headers: { 
          "X-RapidAPI-Key": config.apiKey,
          "X-RapidAPI-Host": config.host,
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        headers: {
          "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining"),
          "x-ratelimit-limit": response.headers.get("x-ratelimit-limit")
        }
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      message: "API connectivity successful",
      statusCode: response.status,
      hasData: !!(data.data?.length || data.events?.length),
      dataCount: data.data?.length || data.events?.length || 0,
      requestId: data.request_id,
      status: data.status,
      headers: {
        "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining"),
        "x-ratelimit-limit": response.headers.get("x-ratelimit-limit")
      }
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connectivity test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}

async function testRapidApiEventSearch(config: { baseUrl: string; apiKey: string; host: string }) {
  try {
    // Test event search with location and keyword
    const searchParams = new URLSearchParams({
      query: "music concert",
      location: "New York",
      limit: "5"
    })

    const response = await fetch(
      `${config.baseUrl}/search-events?${searchParams.toString()}`,
      {
        method: "GET",
        headers: { 
          "X-RapidAPI-Key": config.apiKey,
          "X-RapidAPI-Host": config.host,
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(20000) // 20 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `Event search failed: HTTP ${response.status}`,
        statusCode: response.status,
        headers: {
          "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining"),
          "x-ratelimit-limit": response.headers.get("x-ratelimit-limit")
        }
      }
    }

    const data = await response.json()
    const events = data.data || data.events || []

    // Validate event data structure
    const validEvents = events.filter((event: any) => 
      event.event_id && 
      event.name && 
      (event.start_time || event.start_date)
    )

    return {
      success: true,
      message: "Event search successful",
      statusCode: response.status,
      searchResults: {
        totalFound: events.length,
        returnedCount: events.length,
        validEvents: validEvents.length,
        hasVenues: events.some((e: any) => e.venue?.name),
        hasTicketLinks: events.some((e: any) => e.ticket_links?.length > 0),
        hasImages: events.some((e: any) => e.thumbnail || e.image),
        sampleEvent: validEvents[0] ? {
          id: validEvents[0].event_id,
          name: validEvents[0].name,
          start_time: validEvents[0].start_time || validEvents[0].start_date,
          venue: validEvents[0].venue?.name,
          location: validEvents[0].venue?.city || validEvents[0].location,
          hasTickets: !!(validEvents[0].ticket_links?.length)
        } : null
      },
      requestId: data.request_id,
      status: data.status,
      headers: {
        "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining"),
        "x-ratelimit-limit": response.headers.get("x-ratelimit-limit")
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
