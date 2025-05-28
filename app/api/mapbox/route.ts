import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()
    const mapboxApiKey = process.env.MAPBOX_API_KEY

    if (!mapboxApiKey) {
      return NextResponse.json({ success: false, error: "Mapbox API key not configured" }, { status: 500 })
    }

    switch (action) {
      case "geocode":
        return await handleGeocode(params.query, mapboxApiKey)
      case "reverse":
        return await handleReverseGeocode(params.lat, params.lng, mapboxApiKey)
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    logger.error("Mapbox API error", {
      component: "MapboxAPI",
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

async function handleGeocode(query: string, apiKey: string) {
  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
    url.searchParams.set("access_token", apiKey)
    url.searchParams.set("limit", "1")
    url.searchParams.set("types", "place,locality,neighborhood,address")

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Geocoding failed" },
      { status: 500 },
    )
  }
}

async function handleReverseGeocode(lat: number, lng: number, apiKey: string) {
  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`)
    url.searchParams.set("access_token", apiKey)
    url.searchParams.set("limit", "1")

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Reverse geocoding failed" },
      { status: 500 },
    )
  }
}
