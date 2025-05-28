import { NextRequest, NextResponse } from "next/server"
import { calculateDistance } from "@/lib/utils/event-utils"
import { logger } from "@/lib/utils/logger"

// Simple geocoding for testing
async function simpleGeocode(location: string) {
  const cityCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
    "washington dc": { lat: 38.9072, lng: -77.0369, name: "Washington, DC" },
    "new york": { lat: 40.7128, lng: -74.006, name: "New York, NY" },
    "los angeles": { lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA" },
    "chicago": { lat: 41.8781, lng: -87.6298, name: "Chicago, IL" },
    "houston": { lat: 29.7604, lng: -95.3698, name: "Houston, TX" },
    "philadelphia": { lat: 39.9526, lng: -75.1652, name: "Philadelphia, PA" },
    "baltimore": { lat: 39.2904, lng: -76.6122, name: "Baltimore, MD" },
    "richmond": { lat: 37.5407, lng: -77.4360, name: "Richmond, VA" },
  }

  const normalized = location.toLowerCase().trim()
  return cityCoordinates[normalized] || cityCoordinates["washington dc"]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location") || "Washington DC"
    const testRadius = Number.parseInt(searchParams.get("radius") || "25")

    logger.info("Testing Mapbox geocoding and distance filtering", {
      component: "test-mapbox",
      location,
      radius: testRadius,
    })

    // Test geocoding
    const geocodedLocation = await simpleGeocode(location)

    if (!geocodedLocation) {
      return NextResponse.json({
        success: false,
        error: "Failed to geocode location",
        location,
      })
    }

    // Test distance calculations with sample points
    const testPoints = [
      { name: "New York City", lat: 40.7128, lng: -74.0060 },
      { name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
      { name: "Baltimore", lat: 39.2904, lng: -76.6122 },
      { name: "Richmond", lat: 37.5407, lng: -77.4360 },
      { name: "Norfolk", lat: 36.8508, lng: -76.2859 },
    ]

    const distanceTests = testPoints.map(point => {
      const distance = calculateDistance(
        geocodedLocation.lat,
        geocodedLocation.lng,
        point.lat,
        point.lng
      )

      return {
        ...point,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        withinRadius: distance <= testRadius,
      }
    })

    // Filter points within radius
    const pointsWithinRadius = distanceTests.filter(point => point.withinRadius)

    return NextResponse.json({
      success: true,
      geocoding: {
        query: location,
        result: geocodedLocation,
      },
      distanceFiltering: {
        centerPoint: {
          lat: geocodedLocation.lat,
          lng: geocodedLocation.lng,
          name: geocodedLocation.name,
        },
        radius: testRadius,
        testPoints: distanceTests,
        pointsWithinRadius,
        summary: {
          totalTestPoints: testPoints.length,
          pointsWithinRadius: pointsWithinRadius.length,
          filteringWorking: pointsWithinRadius.length > 0 && pointsWithinRadius.length < testPoints.length,
        },
      },
      recommendations: {
        geocodingAccuracy: 0.8,
        suggestedRadius: testRadius,
        mapboxProvider: "simple-fallback",
      },
    })

  } catch (error) {
    logger.error("Mapbox test failed", {
      component: "test-mapbox",
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userLocation, testEvents } = body

    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return NextResponse.json({
        success: false,
        error: "User location with lat/lng is required",
      }, { status: 400 })
    }

    const radius = body.radius || 25

    // Test event filtering
    const eventsWithDistance = (testEvents || []).map((event: any) => {
      const eventLat = event.coordinates?.lat || event.venue?.lat || event.location_lat
      const eventLng = event.coordinates?.lng || event.venue?.lng || event.location_lng

      if (!eventLat || !eventLng) {
        return {
          ...event,
          distance: null,
          withinRadius: false,
          error: "Missing event coordinates",
        }
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        eventLat,
        eventLng
      )

      return {
        ...event,
        distance: Math.round(distance * 10) / 10,
        withinRadius: distance <= radius,
      }
    })

    const filteredEvents = eventsWithDistance.filter((event: any) => event.withinRadius)

    return NextResponse.json({
      success: true,
      filtering: {
        userLocation,
        radius,
        totalEvents: eventsWithDistance.length,
        eventsWithinRadius: filteredEvents.length,
        eventsWithDistance,
        filteredEvents,
      },
      summary: {
        filteringEffective: filteredEvents.length < eventsWithDistance.length,
        averageDistance: eventsWithDistance.reduce((sum: number, event: any) =>
          sum + (event.distance || 0), 0) / eventsWithDistance.length,
      },
    })

  } catch (error) {
    logger.error("Mapbox POST test failed", {
      component: "test-mapbox",
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, { status: 500 })
  }
}
