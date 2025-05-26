/**
 * Enhanced Events API Route
 * Provides high-performance event search with caching and database integration
 */

import { type NextRequest, NextResponse } from "next/server"
import { fetchEvents } from "@/app/actions/event-actions"
import { logger } from "@/lib/utils/logger"
import { z } from "zod"

// Request validation schema
const EventSearchRequestSchema = z.object({
  keyword: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().min(1).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categories: z.array(z.string()).optional(),
  page: z.number().min(0).optional(),
  size: z.number().min(1).max(100).optional(),
  sort: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const params = {
      keyword: searchParams.get("keyword") || undefined,
      location: searchParams.get("location") || undefined,
      radius: searchParams.get("radius") ? Number.parseInt(searchParams.get("radius")!) : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      categories: searchParams.get("categories")?.split(",") || undefined,
      page: searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 0,
      size: searchParams.get("size") ? Number.parseInt(searchParams.get("size")!) : 20,
      sort: searchParams.get("sort") || undefined,
    }

    // Validate parameters
    const validationResult = EventSearchRequestSchema.safeParse(params)
    if (!validationResult.success) {
      logger.warn("Invalid API request parameters", {
        component: "events-api",
        action: "validation_error",
        metadata: { errors: validationResult.error.flatten() },
      })

      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      )
    }

    logger.info("Events API request received", {
      component: "events-api",
      action: "request_received",
      metadata: { params: validationResult.data },
    })

    // Fetch events using enhanced backend
    const result = await fetchEvents(validationResult.data)

    // Add performance headers
    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "public, max-age=300") // 5 minutes
    response.headers.set("X-Source", result.source || "unknown")

    logger.info("Events API request completed", {
      component: "events-api",
      action: "request_completed",
      metadata: {
        eventCount: result.events.length,
        totalCount: result.totalCount,
        source: result.source,
      },
    })

    return response
  } catch (error) {
    logger.error(
      "Events API error",
      {
        component: "events-api",
        action: "request_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = EventSearchRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      )
    }

    logger.info("Events API POST request received", {
      component: "events-api",
      action: "post_request_received",
      metadata: { params: validationResult.data },
    })

    // Fetch events using enhanced backend
    const result = await fetchEvents(validationResult.data)

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "public, max-age=300")
    response.headers.set("X-Source", result.source || "unknown")

    return response
  } catch (error) {
    logger.error(
      "Events API POST error",
      {
        component: "events-api",
        action: "post_request_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
