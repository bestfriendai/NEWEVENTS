import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"

async function testEventsImages() {
  try {
    console.log("🔍 Testing unified events service for real images...")
    
    // Test search events
    const searchResult = await unifiedEventsService.searchEvents({
      query: "concert",
      lat: 40.7128,
      lng: -74.006,
      radius: 25,
      limit: 5,
    })

    console.log("\n📊 Search Results:")
    console.log(`- Total events found: ${searchResult.events.length}`)
    console.log(`- Sources: RapidAPI: ${searchResult.sources.rapidapi}, Ticketmaster: ${searchResult.sources.ticketmaster}, Cached: ${searchResult.sources.cached}`)
    
    if (searchResult.error) {
      console.log(`- Error: ${searchResult.error}`)
    }

    console.log("\n🖼️ Event Images:")
    searchResult.events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`)
      console.log(`   Image: ${event.image}`)
      console.log(`   Category: ${event.category}`)
      console.log(`   Date: ${event.date}`)
      console.log(`   Time: ${event.time}`)
      console.log(`   Location: ${event.location}`)
      console.log(`   Price: ${event.price}`)
      
      // Check if it's a real API image or placeholder
      const isRealImage = event.image &&
                         !event.image.includes('/community-event.png') &&
                         !event.image.includes('/images/categories/') &&
                         (event.image.includes('http') || event.image.includes('https'))
      
      console.log(`   ✅ Real API Image: ${isRealImage ? 'YES' : 'NO'}`)
      console.log("")
    })

    // Test featured events
    console.log("\n🌟 Testing Featured Events:")
    const featuredResult = await unifiedEventsService.getFeaturedEventsNearUser(
      40.7128, // NYC lat
      -74.006, // NYC lng
      50, // radius
      3 // limit
    )

    console.log(`- Featured events found: ${featuredResult.events.length}`)
    featuredResult.events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`)
      console.log(`   Image: ${event.image}`)
      
      const isRealImage = event.image &&
                         !event.image.includes('/community-event.png') &&
                         !event.image.includes('/images/categories/') &&
                         (event.image.includes('http') || event.image.includes('https'))
      
      console.log(`   ✅ Real API Image: ${isRealImage ? 'YES' : 'NO'}`)
      console.log("")
    })

  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testEventsImages()