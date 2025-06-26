/**
 * Category Events API Route
 */

import { type NextRequest, NextResponse } from "next/server"
import { getEventsByCategory } from "@/app/actions/event-actions"
import { logger, logError } from "@/lib/utils/logger"

export async function GET(request: NextRequest, { params }: { params: { category: string } }) {
  try {
    const category = decodeURIComponent(params.category)
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "30")

    logger.info("Category events API request received", {
      component: "category-events-api",
      action: "request_received",
      metadata: { category, limit },
    })

    const events = await getEventsByCategory(category, limit)

    const response = NextResponse.json({
      events,
      count: events.length,
      category,
    })
    response.headers.set("Cache-Control", "public, max-age=1800") // 30 minutes

    logger.info("Category events API request completed", {
      component: "category-events-api",
      action: "request_completed",
      metadata: { category, eventCount: events.length },
    })

    return response
  } catch (error) {
    logError(
      "Category events API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "category-events-api",
        action: "request_error",
        metadata: { category: params.category },
      }
    )

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
