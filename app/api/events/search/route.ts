import { type NextRequest, NextResponse } from "next/server"
import { searchEvents, type EventSearchParams } from "@/lib/api/events-api"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract search parameters
    const params: EventSearchParams = {
      keyword: searchParams.get("keyword") || undefined,
      location: searchParams.get("location") || undefined,
      radius: searchParams.get("radius") ? Number.parseInt(searchParams.get("radius")!) : 25,
      size: searchParams.get("size") ? Number.parseInt(searchParams.get("size")!) : 20,
      page: searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 0,
      sort: searchParams.get("sort") || "date",
    }

    // Handle coordinates if provided
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    if (lat && lng) {
      params.coordinates = {
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
      }
    }

    // Handle categories
    const categories = searchParams.get("categories")
    if (categories) {
      params.categories = categories.split(",")
    }

    logger.info("Events search API called", { params })

    const result = await searchEvents(params)

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Events search API error", { error })
    return NextResponse.json({ error: "Failed to search events" }, { status: 500 })
  }
}
