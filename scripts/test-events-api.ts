#!/usr/bin/env tsx

/**
 * Test script to verify the events API is working correctly
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })

// Set environment variables directly for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ejsllpjzxnbndrrfpjkz.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xscGp6eG5ibmRycmZwamt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTYxNDYsImV4cCI6MjA2MzQ5MjE0Nn0.uFthMUbM4dkOqlxGWC2tVoTjo_5b9VmvhnYdXWnlLXU"

import { eventsService } from "../lib/services/events-service"
import { logger } from "../lib/utils/logger"

async function testEventsAPI() {
  console.log("🧪 Testing Events API...")
  
  try {
    // Test 1: Database connection
    console.log("\n1. Testing database connection...")
    const connectionTest = await eventsService.testConnection()
    if (connectionTest.success) {
      console.log("✅ Database connection successful")
    } else {
      console.log("❌ Database connection failed:", connectionTest.error)
      return
    }

    // Test 2: Get upcoming events
    console.log("\n2. Testing upcoming events...")
    const upcomingResult = await eventsService.getUpcomingEvents(5)
    if (upcomingResult.error) {
      console.log("❌ Failed to get upcoming events:", upcomingResult.error)
    } else {
      console.log(`✅ Found ${upcomingResult.events.length} upcoming events`)
      if (upcomingResult.events.length > 0) {
        console.log("   Sample event:", upcomingResult.events[0].title)
      }
    }

    // Test 3: Search events by location
    console.log("\n3. Testing location-based search...")
    const locationResult = await eventsService.getEventsNearLocation(40.7128, -74.0060, 25, 10)
    if (locationResult.error) {
      console.log("❌ Failed to search events by location:", locationResult.error)
    } else {
      console.log(`✅ Found ${locationResult.events.length} events near NYC`)
      if (locationResult.events.length > 0) {
        console.log("   Sample event:", locationResult.events[0].title)
      }
    }

    // Test 4: Search events by category
    console.log("\n4. Testing category search...")
    const categoryResult = await eventsService.getEventsByCategory("Music", 5)
    if (categoryResult.error) {
      console.log("❌ Failed to search events by category:", categoryResult.error)
    } else {
      console.log(`✅ Found ${categoryResult.events.length} music events`)
      if (categoryResult.events.length > 0) {
        console.log("   Sample event:", categoryResult.events[0].title)
      }
    }

    console.log("\n🎉 All tests completed!")

  } catch (error) {
    console.error("❌ Test failed with error:", error)
  }
}

// Run the test
if (require.main === module) {
  testEventsAPI().catch(console.error)
}

export { testEventsAPI }
