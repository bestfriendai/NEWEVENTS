import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"

async function testUnifiedEventsAPI() {
  console.log("🚀 Testing Unified Events API...")
  
  try {
    // Test 1: Basic search without location
    console.log("\n📍 Test 1: Basic search for events")
    const basicResult = await unifiedEventsService.searchEvents({
      limit: 5,
      category: "Concerts",
    })
    
    console.log(`✅ Found ${basicResult.events.length} events`)
    console.log(`📊 Sources: RapidAPI: ${basicResult.sources.rapidapi}, Ticketmaster: ${basicResult.sources.ticketmaster}, Cached: ${basicResult.sources.cached}`)
    
    if (basicResult.events.length > 0) {
      const firstEvent = basicResult.events[0]
      console.log(`🎵 First event: "${firstEvent.title}"`)
      console.log(`📅 Date: ${firstEvent.date} at ${firstEvent.time}`)
      console.log(`📍 Location: ${firstEvent.location}`)
      console.log(`🖼️ Image: ${firstEvent.image}`)
      console.log(`💰 Price: ${firstEvent.price}`)
      console.log(`🎫 Ticket Links: ${firstEvent.ticketLinks?.length || 0} available`)
      if (firstEvent.ticketLinks && firstEvent.ticketLinks.length > 0) {
        firstEvent.ticketLinks.forEach((link, index) => {
          console.log(`   ${index + 1}. ${link.source}: ${link.link}`)
        })
      }
    }

    // Test 2: Location-based search (New York City)
    console.log("\n📍 Test 2: Location-based search (NYC)")
    const locationResult = await unifiedEventsService.searchEvents({
      lat: 40.7128,
      lng: -74.0060,
      radius: 50,
      limit: 5,
    })
    
    console.log(`✅ Found ${locationResult.events.length} events near NYC`)
    console.log(`📊 Sources: RapidAPI: ${locationResult.sources.rapidapi}, Ticketmaster: ${locationResult.sources.ticketmaster}, Cached: ${locationResult.sources.cached}`)

    // Test 3: Featured events near user
    console.log("\n📍 Test 3: Featured events near NYC")
    const featuredResult = await unifiedEventsService.getFeaturedEventsNearUser(40.7128, -74.0060, 50, 5)
    
    console.log(`✅ Found ${featuredResult.events.length} featured events`)
    console.log(`📊 Sources: RapidAPI: ${featuredResult.sources.rapidapi}, Ticketmaster: ${featuredResult.sources.ticketmaster}, Cached: ${featuredResult.sources.cached}`)
    
    if (featuredResult.events.length > 0) {
      console.log("🌟 Featured events:")
      featuredResult.events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} (${event.category}) - ${event.date}`)
      })
    }

    // Test 4: Category-specific search
    console.log("\n📍 Test 4: Club Events search")
    const clubResult = await unifiedEventsService.searchEvents({
      category: "Club Events",
      limit: 5,
    })
    
    console.log(`✅ Found ${clubResult.events.length} club events`)
    console.log(`📊 Sources: RapidAPI: ${clubResult.sources.rapidapi}, Ticketmaster: ${clubResult.sources.ticketmaster}, Cached: ${clubResult.sources.cached}`)

    // Test 5: Check for images in events
    console.log("\n📍 Test 5: Checking image availability")
    const allEvents = [
      ...basicResult.events,
      ...locationResult.events,
      ...featuredResult.events,
      ...clubResult.events,
    ]
    
    const eventsWithImages = allEvents.filter(event =>
      event.image &&
      event.image !== "/community-event.png" &&
      event.image.startsWith("http")
    )
    
    console.log(`🖼️ Events with real images: ${eventsWithImages.length}/${allEvents.length}`)
    
    if (eventsWithImages.length > 0) {
      console.log("📸 Sample images:")
      eventsWithImages.slice(0, 3).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}: ${event.image}`)
      })
    }

    // Test 6: Check event sorting (soonest first)
    console.log("\n📍 Test 6: Checking event sorting (soonest first)")
    if (allEvents.length > 1) {
      const sortedCorrectly = allEvents.every((event, index) => {
        if (index === 0) return true
        const currentDate = new Date(`${event.date} ${event.time}`)
        const previousDate = new Date(`${allEvents[index - 1].date} ${allEvents[index - 1].time}`)
        return currentDate >= previousDate
      })
      console.log(`📅 Events sorted correctly: ${sortedCorrectly ? "✅ Yes" : "❌ No"}`)
      
      console.log("📅 Event dates:")
      allEvents.slice(0, 3).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title}: ${event.date} at ${event.time}`)
      })
    }

    // Test 7: Check ticket links
    console.log("\n📍 Test 7: Checking ticket links availability")
    const eventsWithTickets = allEvents.filter(event =>
      event.ticketLinks && event.ticketLinks.length > 0
    )
    
    console.log(`🎫 Events with ticket links: ${eventsWithTickets.length}/${allEvents.length}`)
    
    if (eventsWithTickets.length > 0) {
      console.log("🎫 Sample ticket links:")
      eventsWithTickets.slice(0, 2).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}:`)
        event.ticketLinks?.forEach((link, linkIndex) => {
          console.log(`     - ${link.source}: ${link.link}`)
        })
      })
    }

    // Test 8: Error handling
    console.log("\n📍 Test 8: Error handling with invalid parameters")
    const errorResult = await unifiedEventsService.searchEvents({
      lat: 999, // Invalid latitude
      lng: 999, // Invalid longitude
      limit: 1,
    })
    
    if (errorResult.error) {
      console.log(`❌ Expected error handled: ${errorResult.error}`)
    } else {
      console.log(`✅ No error occurred (graceful handling)`)
    }

    console.log("\n🎉 All tests completed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    logger.error("Unified events test failed", { error })
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testUnifiedEventsAPI()
    .then(() => {
      console.log("✅ Test script completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Test script failed:", error)
      process.exit(1)
    })
}

export { testUnifiedEventsAPI }
