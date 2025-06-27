import { NextResponse } from "next/server"
import { env, API_CONFIG, hasMapboxApiKey, hasTicketmasterApiKey, hasEventbriteApiKey, hasRapidApiKey, hasTomTomApiKey } from "@/lib/env"
import { unifiedLocationService } from "@/lib/services/unified-location-service"

export async function GET() {
  try {
    // Check API keys availability
    const apiKeyStatus = {
      mapbox: {
        configured: hasMapboxApiKey(),
        hasClientKey: !!(env.NEXT_PUBLIC_MAPBOX_API_KEY && env.NEXT_PUBLIC_MAPBOX_API_KEY.length > 10),
        hasServerKey: !!(API_CONFIG.maps.mapbox.apiKey && API_CONFIG.maps.mapbox.apiKey.length > 10)
      },
      tomtom: {
        configured: hasTomTomApiKey()
      },
      ticketmaster: {
        configured: hasTicketmasterApiKey()
      },
      eventbrite: {
        configured: hasEventbriteApiKey()
      },
      rapidapi: {
        configured: hasRapidApiKey()
      },
      supabase: {
        hasUrl: !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')),
        hasAnonKey: !!(env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 10)
      }
    }

    // Test location services
    const locationServices = unifiedLocationService.getAvailableServices()
    
    // Test geocoding with fallback
    let geocodeTest = null
    try {
      geocodeTest = await unifiedLocationService.geocodeAddress("New York, NY")
    } catch (error) {
      geocodeTest = { error: error instanceof Error ? error.message : "Failed to geocode" }
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeyStatus,
      locationServices,
      geocodeTest,
      recommendations: {
        mapbox: !apiKeyStatus.mapbox.configured ? "Add NEXT_PUBLIC_MAPBOX_API_KEY to .env.local for geocoding" : null,
        tomtom: !apiKeyStatus.tomtom.configured ? "Add TOMTOM_API_KEY to .env.local for fallback geocoding" : null,
        ticketmaster: !apiKeyStatus.ticketmaster.configured ? "Add TICKETMASTER_API_KEY to .env.local for real events" : null,
        rapidapi: !apiKeyStatus.rapidapi.configured ? "Add RAPIDAPI_KEY to .env.local for more events" : null,
      },
      mockDataAvailable: true,
      message: "System is configured with fallback options. Add API keys for full functionality."
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Error checking configuration"
    }, { status: 500 })
  }
}