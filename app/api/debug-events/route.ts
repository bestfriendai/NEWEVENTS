import { NextRequest, NextResponse } from "next/server"
import { rapidAPIEventsService } from "@/lib/api/rapidapi-events"
import { searchTicketmasterEvents } from "@/lib/api/ticketmaster-api"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug: Testing raw API responses...")
    
    const results = {
      rapidapi: {
        success: false,
        events: [] as any[],
        error: null as string | null,
      },
      ticketmaster: {
        success: false,
        events: [] as any[],
        error: null as string | null,
      }
    }

    // Test RapidAPI
    try {
      console.log("Testing RapidAPI...")
      const rapidEvents = await rapidAPIEventsService.searchEvents({
        query: "concert",
        start: 0,
      })
      
      results.rapidapi.success = true
      results.rapidapi.events = rapidEvents.slice(0, 3).map(event => ({
        name: event.name,
        thumbnail: event.thumbnail,
        hasValidThumbnail: event.thumbnail && event.thumbnail.startsWith('http'),
        venue: event.venue?.name,
        start_time: event.start_time,
      }))
      
      console.log(`RapidAPI returned ${rapidEvents.length} events`)
      rapidEvents.slice(0, 3).forEach((event, i) => {
        console.log(`${i + 1}. ${event.name}`)
        console.log(`   Thumbnail: ${event.thumbnail}`)
        console.log(`   Valid: ${event.thumbnail && event.thumbnail.startsWith('http')}`)
      })
      
    } catch (error) {
      console.error("RapidAPI error:", error)
      results.rapidapi.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test Ticketmaster
    try {
      console.log("Testing Ticketmaster...")
      const tmResult = await searchTicketmasterEvents({
        keyword: "concert",
        coordinates: { lat: 40.7128, lng: -74.006 },
        radius: 50,
        size: 3,
        page: 0,
      })
      
      results.ticketmaster.success = true
      results.ticketmaster.events = tmResult.events.slice(0, 3).map(event => ({
        title: event.title,
        image: event.image,
        hasValidImage: event.image && event.image.startsWith('http'),
        location: event.location,
        date: event.date,
      }))
      
      console.log(`Ticketmaster returned ${tmResult.events.length} events`)
      tmResult.events.slice(0, 3).forEach((event, i) => {
        console.log(`${i + 1}. ${event.title}`)
        console.log(`   Image: ${event.image}`)
        console.log(`   Valid: ${event.image && event.image.startsWith('http')}`)
      })
      
    } catch (error) {
      console.error("Ticketmaster error:", error)
      results.ticketmaster.error = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("❌ Debug test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
