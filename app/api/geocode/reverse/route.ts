import { NextRequest, NextResponse } from "next/server"
import { reverseGeocodeCoordinates } from "@/lib/api/map-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates" },
        { status: 400 }
      )
    }

    const result = await reverseGeocodeCoordinates(latitude, longitude)

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Could not reverse geocode location" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        address: result.address,
        city: result.city,
        state: result.state,
        country: result.country,
        lat: latitude,
        lng: longitude
      }
    })
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}