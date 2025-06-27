import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { getSupabaseApiConfig } from "@/lib/api/supabase-env-config"
import { logger, logError } from "@/lib/utils/logger"

export async function GET() {
  try {
    // Try to get config from Supabase first, fallback to local env
    let apiKeys = await getSupabaseApiConfig()
    const localConfig = getServerConfig()
    
    // Merge configs, preferring Supabase values when available
    const config = {
      ticketmaster: {
        baseUrl: localConfig.ticketmaster.baseUrl,
        apiKey: apiKeys.TICKETMASTER_API_KEY || localConfig.ticketmaster.apiKey,
      },
      rapidapi: {
        baseUrl: localConfig.rapidapi.baseUrl,
        apiKey: apiKeys.RAPIDAPI_KEY || localConfig.rapidapi.apiKey,
        host: localConfig.rapidapi.host,
      },
      eventbrite: {
        baseUrl: localConfig.eventbrite.baseUrl,
        apiKey: apiKeys.EVENTBRITE_API_KEY || localConfig.eventbrite.apiKey,
        privateToken: apiKeys.EVENTBRITE_PRIVATE_TOKEN || localConfig.eventbrite.privateToken,
      },
      tomtom: {
        baseUrl: localConfig.tomtom.baseUrl,
        apiKey: apiKeys.TOMTOM_API_KEY || localConfig.tomtom.apiKey,
      },
      predicthq: {
        baseUrl: localConfig.predicthq.baseUrl,
        apiKey: apiKeys.PREDICTHQ_API_KEY || localConfig.predicthq.apiKey,
      },
    }
    
    const results: Record<string, { status: string; message: string; data?: any }> = {}

    // Test Ticketmaster API
    try {
      const tmResponse = await fetch(
        `${config.ticketmaster.baseUrl}/events.json?apikey=${config.ticketmaster.apiKey}&size=1&countryCode=US`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      )

      if (tmResponse.ok) {
        const tmData = await tmResponse.json()
        results.ticketmaster = {
          status: "success",
          message: "Ticketmaster API connected successfully",
          data: { eventCount: tmData._embedded?.events?.length || 0 },
        }
      } else {
        results.ticketmaster = {
          status: "error",
          message: `Ticketmaster API error: ${tmResponse.status}`,
        }
      }
    } catch (error) {
      results.ticketmaster = {
        status: "error",
        message: `Ticketmaster connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }

    // Test RapidAPI using our service
    try {
      const { rapidAPIRealtimeEventsService } = await import("@/lib/api/rapidapi-realtime-events")
      const rapidEvents = await rapidAPIRealtimeEventsService.searchEvents({
        query: "music concert",
        location: "New York",
        limit: 10
      })
      
      results.rapidapi = {
        status: "success",
        message: "RapidAPI connected successfully",
        data: { 
          eventCount: rapidEvents.length,
          events: rapidEvents.slice(0, 3).map(e => ({
            name: e.title,
            date: e.date,
            location: e.location
          }))
        },
      }
    } catch (error) {
      results.rapidapi = {
        status: "error",
        message: `RapidAPI connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }

    // Test Eventbrite API
    try {
      const ebResponse = await fetch(
        `${config.eventbrite.baseUrl}/events/search/?token=${config.eventbrite.privateToken}&location.address=New York&expand=venue`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      )

      if (ebResponse.ok) {
        const ebData = await ebResponse.json()
        results.eventbrite = {
          status: "success",
          message: "Eventbrite API connected successfully",
          data: { eventCount: ebData.events?.length || 0 },
        }
      } else {
        results.eventbrite = {
          status: "error",
          message: `Eventbrite API error: ${ebResponse.status}`,
        }
      }
    } catch (error) {
      results.eventbrite = {
        status: "error",
        message: `Eventbrite connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }

    // Test TomTom API
    try {
      const tomtomResponse = await fetch(
        `${config.tomtom.baseUrl}/search/2/geocode/New York.json?key=${config.tomtom.apiKey}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      )

      if (tomtomResponse.ok) {
        const tomtomData = await tomtomResponse.json()
        results.tomtom = {
          status: "success",
          message: "TomTom API connected successfully",
          data: { resultCount: tomtomData.results?.length || 0 },
        }
      } else {
        results.tomtom = {
          status: "error",
          message: `TomTom API error: ${tomtomResponse.status}`,
        }
      }
    } catch (error) {
      results.tomtom = {
        status: "error",
        message: `TomTom connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }

    // Test PredictHQ API (if available)
    if (config.predicthq?.apiKey) {
      try {
        const phqResponse = await fetch(`${config.predicthq.baseUrl}/events/?limit=1`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.predicthq.apiKey}`,
            Accept: "application/json",
          },
        })

        if (phqResponse.ok) {
          const phqData = await phqResponse.json()
          results.predicthq = {
            status: "success",
            message: "PredictHQ API connected successfully",
            data: { eventCount: phqData.results?.length || 0 },
          }
        } else {
          results.predicthq = {
            status: "error",
            message: `PredictHQ API error: ${phqResponse.status}`,
          }
        }
      } catch (error) {
        results.predicthq = {
          status: "error",
          message: `PredictHQ connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    } else {
      results.predicthq = {
        status: "warning",
        message: "PredictHQ API key not configured",
      }
    }

    // Count successful connections
    const successCount = Object.values(results).filter((r) => r.status === "success").length
    const totalCount = Object.keys(results).length

    logger.info("API connection test completed", {
      component: "APITestRoute",
      action: "test_all_apis",
      metadata: { successCount, totalCount, results },
    })

    return NextResponse.json({
      success: true,
      summary: {
        connected: successCount,
        total: totalCount,
        percentage: Math.round((successCount / totalCount) * 100),
      },
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError(
      "API test failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "APITestRoute",
        action: "test_error",
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: "Failed to test API connections",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
