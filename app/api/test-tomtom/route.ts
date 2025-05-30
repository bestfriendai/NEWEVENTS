import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    const config = getServerConfig()
    
    if (!config.tomtom.apiKey) {
      return NextResponse.json({
        success: false,
        message: "TomTom API key not configured",
        data: { hasApiKey: false }
      })
    }

    // Test basic API connectivity
    const connectivityTest = await testTomTomConnectivity(config.tomtom)
    
    // Test geocoding functionality
    const geocodingTest = await testTomTomGeocoding(config.tomtom)

    // Test reverse geocoding functionality
    const reverseGeocodingTest = await testTomTomReverseGeocoding(config.tomtom)

    const allTestsPassed = connectivityTest.success && geocodingTest.success && reverseGeocodingTest.success

    logger.info("TomTom API test completed", {
      component: "TomTomTestRoute",
      action: "test_tomtom",
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
        ? "TomTom API is working correctly" 
        : "Some TomTom API tests failed",
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
      "TomTom API test failed",
      {
        component: "TomTomTestRoute",
        action: "test_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        success: false,
        message: "TomTom API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: { hasApiKey: !!getServerConfig().tomtom.apiKey }
      },
      { status: 500 }
    )
  }
}

async function testTomTomConnectivity(config: { baseUrl: string; apiKey: string }) {
  try {
    // Test with a simple geocoding request
    const address = encodeURIComponent("New York")
    const response = await fetch(
      `${config.baseUrl}/search/2/geocode/${address}.json?key=${config.apiKey}&limit=1`,
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
      hasResults: !!(data.results?.length),
      resultCount: data.results?.length || 0,
      summary: data.summary
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connectivity test failed",
      error: error instanceof Error ? error.name : "Unknown"
    }
  }
}

async function testTomTomGeocoding(config: { baseUrl: string; apiKey: string }) {
  try {
    // Test geocoding with a known address
    const address = encodeURIComponent("New York, NY, USA")
    const response = await fetch(
      `${config.baseUrl}/search/2/geocode/${address}.json?key=${config.apiKey}&limit=5`,
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
    const results = data.results || []

    return {
      success: true,
      message: "Geocoding successful",
      statusCode: response.status,
      geocodingResults: {
        query: "New York, NY, USA",
        resultCount: results.length,
        hasResults: results.length > 0,
        summary: data.summary,
        sampleResult: results[0] ? {
          address: results[0].address?.freeformAddress,
          position: results[0].position,
          score: results[0].score,
          type: results[0].type,
          entityType: results[0].entityType
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

async function testTomTomReverseGeocoding(config: { baseUrl: string; apiKey: string }) {
  try {
    // Test reverse geocoding with NYC coordinates
    const lat = 40.7128
    const lng = -74.0060
    
    const response = await fetch(
      `${config.baseUrl}/search/2/reverseGeocode/${lat},${lng}.json?key=${config.apiKey}`,
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
    const addresses = data.addresses || []

    return {
      success: true,
      message: "Reverse geocoding successful",
      statusCode: response.status,
      reverseGeocodingResults: {
        coordinates: { lat, lng },
        resultCount: addresses.length,
        hasResults: addresses.length > 0,
        summary: data.summary,
        sampleResult: addresses[0] ? {
          address: addresses[0].address?.freeformAddress,
          streetNumber: addresses[0].address?.streetNumber,
          streetName: addresses[0].address?.streetName,
          municipality: addresses[0].address?.municipality,
          countrySubdivision: addresses[0].address?.countrySubdivision,
          country: addresses[0].address?.country
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
