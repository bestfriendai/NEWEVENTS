import { NextRequest, NextResponse } from "next/server"
import { unifiedRealEventsAPI } from "@/lib/api/unified-real-events-api"
import { logger } from "@/lib/utils/logger"
import type { EventSearchParams } from "@/types/event.types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params: EventSearchParams = {
      keyword: searchParams.get("keyword") || searchParams.get("query") || undefined,
      location: searchParams.get("location") || "United States",
      category: searchParams.get("category") || undefined,
      categories: searchParams.get("categories")?.split(",") || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      page: parseInt(searchParams.get("page") || "0"),
      sortBy: (searchParams.get("sortBy") as "date" | "popularity" | "distance") || "date",
      lat: searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined,
      lng: searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined,
      radius: searchParams.get("radius") ? parseInt(searchParams.get("radius")!) : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined
    }

    logger.info("Real events API called", {
      component: "events-real-api",
      action: "GET",
      metadata: { params }
    })

    const response = await unifiedRealEventsAPI.searchEvents(params)

    return NextResponse.json({
      success: true,
      data: response.events,
      totalCount: response.totalCount,
      hasMore: response.hasMore,
      params
    })

  } catch (error) {
    logger.error("Error in real events API", {
      component: "events-real-api",
      action: "GET",
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params: EventSearchParams = {
      limit: 20,
      page: 0,
      location: "United States",
      ...body
    }

    logger.info("Real events API POST called", {
      component: "events-real-api",
      action: "POST",
      metadata: { params }
    })

    const response = await unifiedRealEventsAPI.searchEvents(params)

    return NextResponse.json({
      success: true,
      data: response.events,
      totalCount: response.totalCount,
      hasMore: response.hasMore,
      params
    })

  } catch (error) {
    logger.error("Error in real events API POST", {
      component: "events-real-api",
      action: "POST",
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}