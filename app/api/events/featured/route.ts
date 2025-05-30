/**
 * Featured Events API Route
 */

import { NextResponse } from "next/server"
import { getFeaturedEvents } from "@/app/actions/event-actions"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    logger.info("Featured events API request received", {
      component: "featured-events-api",
      action: "request_received",
    })

    const events = await getFeaturedEvents(20)

    const response = NextResponse.json({ events, count: events.length })
    response.headers.set("Cache-Control", "public, max-age=1800") // 30 minutes

    logger.info("Featured events API request completed", {
      component: "featured-events-api",
      action: "request_completed",
      metadata: { eventCount: events.length },
    })

    return response
  } catch (error) {
    logger.error("Featured events API error", {
      component: "featured-events-api",
      action: "request_error",
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
