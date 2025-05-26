import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    const config = getServerConfig()
    const mapboxKey = config.supabase.url ? 
      process.env.NEXT_PUBLIC_MAPBOX_API_KEY : 
      undefined // Mapbox key is in the client env vars
    
    if (!mapboxKey) {
      return NextResponse.json({
        success: false,
        message: "Mapbox API key not configured",
        data: { hasApiKey: false }
      })
    }

    // Test basic API connectivity
    const connectivityTest = await testMapboxConnectivity(mapboxKey)
    
    // Test geocoding functionality
    const geocodingTest = await testMapboxGeocoding(mapboxKey)

    // Test reverse geocoding functionality
    const reverseGeocodingTest = await testMapboxReverseGeocoding(mapboxKey)

    const allTestsPassed = connectivityTest.success && geocodingTest.success && reverseGeocodingTest.success

    logger.info("Mapbox API test completed", {
      component: "MapboxTestRoute",
      action: "test_mapbox",
      metadata: { 
        connectivity: connectivityTest.success,
        geocoding: geocodingTest.success,
        reverseGeocoding: reverseGeocodingTest.success,
        overall: allTestsPassed
      },
    })

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? "Mapbox API is working correctly" 
        : "Some Mapbox API tests failed",
      data: {
        hasApiKey: true,
        connectivity: connectivityTest,
        geocoding: geocodingTest,
        reverseGeocoding: reverseGeocodingTest,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error(
      "Mapbox API test failed",
      {
        component: "MapboxTestRoute",
        action: "test_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        success: false,
        message: "Mapbox API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { hasApiKey: !!process.env.NEXT_PUBLIC_MAPBOX_API_KEY }
      },
      { status: 500 }
    )
  }
}

async function testMapboxConnectivity(apiKey: string) {
  try {
    // Test with account info endpoint
    const response = await fetch(
      `https://api.mapbox.com/accounts/v1?access_token=${apiKey}`,
      {
        method: "GET",
        headers: { 
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      message: "API connectivity successful",
      statusCode: response.status,
      accountInfo: {
        id: data.id,
        username: data.username,
        type: data.type
      }
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connectivity test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}

async function testMapboxGeocoding(apiKey: string) {
  try {
    // Test geocoding with a known address
    const address = encodeURIComponent("New York, NY")
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${apiKey}&limit=1`,
      {
        method: "GET",
        headers: { 
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `Geocoding failed: HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    const data = await response.json()
    const features = data.features || []

    return {
      success: true,
      message: "Geocoding successful",
      statusCode: response.status,
      geocodingResults: {
        query: "New York, NY",
        resultCount: features.length,
        hasResults: features.length > 0,
        sampleResult: features[0] ? {
          placeName: features[0].place_name,
          coordinates: features[0].center,
          relevance: features[0].relevance,
          placeType: features[0].place_type
        } : null
      }
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Geocoding test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}

async function testMapboxReverseGeocoding(apiKey: string) {
  try {
    // Test reverse geocoding with NYC coordinates
    const lng = -74.0060
    const lat = 40.7128
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${apiKey}&limit=1`,
      {
        method: "GET",
        headers: { 
          Accept: "application/json",
          "User-Agent": "NEWEVENTS-API-Test/1.0"
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      return {
        success: false,
        message: `Reverse geocoding failed: HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    const data = await response.json()
    const features = data.features || []

    return {
      success: true,
      message: "Reverse geocoding successful",
      statusCode: response.status,
      reverseGeocodingResults: {
        coordinates: [lng, lat],
        resultCount: features.length,
        hasResults: features.length > 0,
        sampleResult: features[0] ? {
          placeName: features[0].place_name,
          context: features[0].context?.map((c: any) => c.text),
          relevance: features[0].relevance,
          placeType: features[0].place_type
        } : null
      }
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Reverse geocoding test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}
