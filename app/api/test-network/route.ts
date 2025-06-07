import { type NextRequest, NextResponse } from "next/server"
import { serverEnv } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        hasTicketmasterKey: !!serverEnv.TICKETMASTER_API_KEY,
        hasRapidApiKey: !!serverEnv.RAPIDAPI_KEY,
        rapidApiHost: serverEnv.RAPIDAPI_HOST || "real-time-events-search.p.rapidapi.com",
      },
      tests: {
        ticketmaster: { status: "pending", error: null, responseTime: 0 },
        rapidapi: { status: "pending", error: null, responseTime: 0 },
        basicFetch: { status: "pending", error: null, responseTime: 0 },
      },
    }

    // Test basic fetch capability
    try {
      const startTime = Date.now()
      const response = await fetch("https://httpbin.org/get", {
        method: "GET",
        headers: { "User-Agent": "DateAI-Test/1.0" },
      })
      const responseTime = Date.now() - startTime

      if (response.ok) {
        results.tests.basicFetch = { status: "success", error: null, responseTime }
      } else {
        results.tests.basicFetch = {
          status: "failed",
          error: `HTTP ${response.status}`,
          responseTime,
        }
      }
    } catch (error) {
      results.tests.basicFetch = {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        responseTime: 0,
      }
    }

    // Test Ticketmaster API
    if (serverEnv.TICKETMASTER_API_KEY) {
      try {
        const startTime = Date.now()
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${serverEnv.TICKETMASTER_API_KEY}&size=1&sort=date,asc`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "DateAI-Test/1.0",
          },
        })

        const responseTime = Date.now() - startTime

        if (response.ok) {
          const data = await response.json()
          results.tests.ticketmaster = {
            status: "success",
            error: null,
            responseTime,
            // @ts-ignore
            eventCount: data._embedded?.events?.length || 0,
          }
        } else {
          const errorText = await response.text().catch(() => "Unknown error")
          results.tests.ticketmaster = {
            status: "failed",
            error: `HTTP ${response.status}: ${errorText}`,
            responseTime,
          }
        }
      } catch (error) {
        results.tests.ticketmaster = {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          responseTime: 0,
        }
      }
    } else {
      results.tests.ticketmaster = {
        status: "skipped",
        error: "API key not configured",
        responseTime: 0,
      }
    }

    // Test RapidAPI
    if (serverEnv.RAPIDAPI_KEY) {
      try {
        const startTime = Date.now()
        const url = "https://real-time-events-search.p.rapidapi.com/search-events?query=test&limit=1"

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": serverEnv.RAPIDAPI_KEY,
            "X-RapidAPI-Host": serverEnv.RAPIDAPI_HOST || "real-time-events-search.p.rapidapi.com",
            "Content-Type": "application/json",
            "User-Agent": "DateAI-Test/1.0",
          },
        })

        const responseTime = Date.now() - startTime

        if (response.ok) {
          const data = await response.json()
          results.tests.rapidapi = {
            status: "success",
            error: null,
            responseTime,
            // @ts-ignore
            eventCount: data.data?.length || 0,
          }
        } else {
          const errorText = await response.text().catch(() => "Unknown error")
          results.tests.rapidapi = {
            status: "failed",
            error: `HTTP ${response.status}: ${errorText}`,
            responseTime,
          }
        }
      } catch (error) {
        results.tests.rapidapi = {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          responseTime: 0,
        }
      }
    } else {
      results.tests.rapidapi = {
        status: "skipped",
        error: "API key not configured",
        responseTime: 0,
      }
    }

    logger.info("Network connectivity test completed", {
      component: "network-test",
      results,
    })

    return NextResponse.json(results)
  } catch (error) {
    logger.error("Network test failed", {
      component: "network-test",
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        error: "Network test failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
