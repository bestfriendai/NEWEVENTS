import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    const config = getServerConfig()
    
    if (!config.predicthq.apiKey) {
      return NextResponse.json({
        success: false,
        message: "PredictHQ API key not configured",
        data: { hasApiKey: false }
      })
    }

    // Test basic API connectivity
    const connectivityTest = await testPredictHQConnectivity(config.predicthq)
    
    // Test event search functionality
    const eventSearchTest = await testPredictHQEventSearch(config.predicthq)

    const allTestsPassed = connectivityTest.success && eventSearchTest.success

    logger.info("PredictHQ API test completed", {
      component: "PredictHQTestRoute",
      action: "test_predicthq",
      metadata: { 
        connectivity: connectivityTest.success,
        eventSearch: eventSearchTest.success,
        overall: allTestsPassed
      },
    })

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? "PredictHQ API is working correctly" 
        : "Some PredictHQ API tests failed",
      data: {
        hasApiKey: true,
        connectivity: connectivityTest,
        eventSearch: eventSearchTest,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error(
      "PredictHQ API test failed",
      {
        component: "PredictHQTestRoute",
        action: "test_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        success: false,
        message: "PredictHQ API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { hasApiKey: !!getServerConfig().predicthq.apiKey }
      },
      { status: 500 }
    )
  }
}

async function testPredictHQConnectivity(config: { baseUrl: string; apiKey: string }) {
  try {
    // Test with a simple events query
    const searchParams = new URLSearchParams({
      limit: "1"
    })

    const response = await fetch(
      `${config.baseUrl}/events/?${searchParams.toString()}`,
      {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${config.apiKey}`,
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
      hasResults: !!(data.results?.length),
      resultCount: data.results?.length || 0,
      totalCount: data.count || 0,
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

async function testPredictHQEventSearch(config: { baseUrl: string; apiKey: string }) {
  try {
    // Test event search with location and category
    const searchParams = new URLSearchParams({
      "location.origin": "40.7128,-74.0060", // New York coordinates
      "location.radius": "25mi",
      category: "concerts,festivals,performing-arts",
      limit: "5",
      sort: "start"
    })

    const response = await fetch(
      `${config.baseUrl}/events/?${searchParams.toString()}`,
      {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${config.apiKey}`,
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
    const events = data.results || []

    // Validate event data structure
    const validEvents = events.filter((event: any) => 
      event.id && 
      event.title && 
      event.start
    )

    return {
      success: true,
      message: "Event search successful",
      statusCode: response.status,
      searchResults: {
        totalFound: data.count || 0,
        returnedCount: events.length,
        validEvents: validEvents.length,
        hasCategories: events.some((e: any) => e.category),
        hasLocations: events.some((e: any) => e.location?.length > 0),
        hasImpact: events.some((e: any) => e.phq_attendance || e.local_rank),
        sampleEvent: validEvents[0] ? {
          id: validEvents[0].id,
          title: validEvents[0].title,
          start: validEvents[0].start,
          category: validEvents[0].category,
          location: validEvents[0].location?.[0],
          attendance: validEvents[0].phq_attendance,
          rank: validEvents[0].local_rank
        } : null
      },
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
