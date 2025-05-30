import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : 40.7128
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : -74.006
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    logger.info("🧪 Testing Enhanced Events API", {
      component: "TestEnhancedEventsAPI",
      action: "GET",
      metadata: { lat, lng, limit },
    })

    // Test the enhanced events API
    const enhancedResponse = await fetch(
      `${request.nextUrl.origin}/api/events/enhanced?lat=${lat}&lng=${lng}&limit=${limit}&radius=50`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!enhancedResponse.ok) {
      throw new Error(`Enhanced API failed: ${enhancedResponse.status}`)
    }

    const enhancedData = await enhancedResponse.json()

    // Analyze the results
    const analysis = {
      success: true,
      totalEvents: enhancedData.data?.events?.length || 0,
      totalFound: enhancedData.data?.totalCount || 0,
      strategies: enhancedData.data?.strategies || 0,
      sources: enhancedData.data?.sources || [],
      metadata: enhancedData.data?.metadata || {},
      
      // Image analysis
      eventsWithRealImages: 0,
      eventsWithPlaceholderImages: 0,
      
      // Time analysis
      eventsWithValidDates: 0,
      eventsWithValidTimes: 0,
      
      // Sample events for inspection
      sampleEvents: [],
    }

    // Analyze the events
    if (enhancedData.data?.events) {
      const events = enhancedData.data.events

      events.forEach((event: any) => {
        // Image analysis
        if (event.image && 
            !event.image.includes('/community-event.png') && 
            !event.image.includes('/images/categories/')) {
          analysis.eventsWithRealImages++
        } else {
          analysis.eventsWithPlaceholderImages++
        }

        // Date/time analysis
        if (event.date && event.date !== "Date TBA") {
          analysis.eventsWithValidDates++
        }
        if (event.time && event.time !== "Time TBA") {
          analysis.eventsWithValidTimes++
        }
      })

      // Get sample events for inspection
      analysis.sampleEvents = events.slice(0, 3).map((event: any) => ({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        hasRealImage: event.image && 
          !event.image.includes('/community-event.png') && 
          !event.image.includes('/images/categories/'),
        imageUrl: event.image,
        coordinates: event.coordinates,
        price: event.price,
      }))
    }

    // Calculate percentages
    const imageQualityRate = analysis.totalEvents > 0 
      ? (analysis.eventsWithRealImages / analysis.totalEvents * 100).toFixed(1)
      : "0"
    
    const dateValidityRate = analysis.totalEvents > 0 
      ? (analysis.eventsWithValidDates / analysis.totalEvents * 100).toFixed(1)
      : "0"
    
    const timeValidityRate = analysis.totalEvents > 0 
      ? (analysis.eventsWithValidTimes / analysis.totalEvents * 100).toFixed(1)
      : "0"

    logger.info("✅ Enhanced Events API Test Results", {
      component: "TestEnhancedEventsAPI",
      action: "analysis_complete",
      metadata: {
        totalEvents: analysis.totalEvents,
        imageQualityRate: `${imageQualityRate}%`,
        dateValidityRate: `${dateValidityRate}%`,
        timeValidityRate: `${timeValidityRate}%`,
        sources: analysis.sources,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Enhanced Events API test completed",
      analysis: {
        ...analysis,
        rates: {
          imageQuality: `${imageQualityRate}%`,
          dateValidity: `${dateValidityRate}%`,
          timeValidity: `${timeValidityRate}%`,
        }
      },
      rawResponse: enhancedData,
    })

  } catch (error) {
    logger.error("❌ Enhanced Events API test failed", {
      component: "TestEnhancedEventsAPI",
      action: "GET_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Enhanced Events API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
