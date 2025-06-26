import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { logger, logError } from "@/lib/utils/logger"

export async function GET() {
  try {
    const config = getServerConfig()

    const hasApiKey = !!(config.eventbrite.apiKey || config.eventbrite.privateToken)

    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        message: "Eventbrite API key or private token not configured",
        data: { hasApiKey: false }
      })
    }

    // Test basic API connectivity
    const connectivityTest = await testEventbriteConnectivity(config.eventbrite)

    // Test event search functionality
    const eventSearchTest = await testEventbriteEventSearch(config.eventbrite)

    const allTestsPassed = connectivityTest.success && eventSearchTest.success

    logger.info("Eventbrite API test completed", {
      component: "EventbriteTestRoute",
      action: "test_eventbrite",
      metadata: {
        connectivity: connectivityTest.success,
        eventSearch: eventSearchTest.success,
        overall: allTestsPassed
      },
    })

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed
        ? "Eventbrite API is working correctly"
        : "Some Eventbrite API tests failed",
      data: {
        hasApiKey: true,
        connectivity: connectivityTest,
        eventSearch: eventSearchTest,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logError(
      "Eventbrite API test failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "EventbriteTestRoute",
        action: "test_error",
      }
    )

    return NextResponse.json(
      {
        success: false,
        message: "Eventbrite API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { hasApiKey: !!(getServerConfig().eventbrite.apiKey || getServerConfig().eventbrite.privateToken) }
      },
      { status: 500 }
    )
  }
}

async function testEventbriteConnectivity(config: { baseUrl: string; apiKey?: string; privateToken?: string }) {
  try {
    const token = config.privateToken || config.apiKey
    if (!token) {
      return {
        success: false,
        message: "No valid token available for authentication"
      }
    }

    // Test with user info endpoint (requires authentication)
    const response = await fetch(
      `${config.baseUrl}/users/me/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      // If user endpoint fails, try a simpler public endpoint
      const publicResponse = await fetch(
        `${config.baseUrl}/events/search/?token=${token}&location.address=New York&page_size=1`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "NEWEVENTS-API-Test/1.0"
          },
          signal: AbortSignal.timeout(10000)
        }
      )

      if (!publicResponse.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          fallbackStatusCode: publicResponse.status
        }
      }

      const publicData = await publicResponse.json()
      return {
        success: true,
        message: "API connectivity successful (via public endpoint)",
        statusCode: publicResponse.status,
        method: "public_search",
        hasEvents: !!(publicData.events?.length),
        eventCount: publicData.events?.length || 0
      }
    }

    const data = await response.json()

    return {
      success: true,
      message: "API connectivity successful",
      statusCode: response.status,
      method: "authenticated",
      userInfo: {
        id: data.id,
        name: data.name,
        email: data.email
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

async function testEventbriteEventSearch(config: { baseUrl: string; apiKey?: string; privateToken?: string }) {
  try {
    const token = config.privateToken || config.apiKey
    if (!token) {
      return {
        success: false,
        message: "No valid token available for event search"
      }
    }

    // Test event search with location using proper authentication
    const searchParams = new URLSearchParams({
      "location.address": "New York",
      "location.within": "25mi",
      expand: "venue,organizer",
      page_size: "5",
      sort_by: "date"
    })

    // Try the correct Eventbrite search endpoint
    let response = await fetch(
      `${config.baseUrl}/events/search/?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }
    )

    // If search endpoint fails, try getting user's events instead
    if (!response.ok && response.status === 404) {
      response = await fetch(
        `${config.baseUrl}/users/me/events/?${new URLSearchParams({ page_size: "5" }).toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "User-Agent": "NEWEVENTS-API-Test/1.0"
          },
          signal: AbortSignal.timeout(15000)
        }
      )
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Event search failed: HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    const data = await response.json()
    const events = data.events || []

    // Validate event data structure
    const validEvents = events.filter((event: any) =>
      event.id &&
      event.name?.text &&
      event.start?.local
    )

    return {
      success: true,
      message: "Event search successful",
      statusCode: response.status,
      searchResults: {
        totalFound: data.pagination?.object_count || 0,
        returnedCount: events.length,
        validEvents: validEvents.length,
        hasVenues: events.some((e: any) => e.venue?.name),
        hasOrganizers: events.some((e: any) => e.organizer?.name),
        sampleEvent: validEvents[0] ? {
          id: validEvents[0].id,
          name: validEvents[0].name?.text,
          start: validEvents[0].start?.local,
          venue: validEvents[0].venue?.name,
          organizer: validEvents[0].organizer?.name
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
