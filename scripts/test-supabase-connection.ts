#!/usr/bin/env tsx

/**
 * Simple test script to verify Supabase connection
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })

import { createClient } from "@supabase/supabase-js"

async function testSupabaseConnection() {
  console.log("🧪 Testing Supabase Connection...")
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log("Supabase URL:", supabaseUrl ? "✅ Found" : "❌ Missing")
    console.log("Supabase Key:", supabaseKey ? "✅ Found" : "❌ Missing")
    
    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Missing required environment variables")
      return
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test 1: Simple query to check connection
    console.log("\n1. Testing basic connection...")
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .limit(1)

    if (error) {
      console.log("❌ Connection failed:", error.message)
      return
    }

    console.log("✅ Connection successful!")
    console.log("Sample data:", data)

    // Test 2: Check if events table exists and has data
    console.log("\n2. Checking events table...")
    const { data: events, error: eventsError, count } = await supabase
      .from("events")
      .select("*", { count: "exact" })
      .limit(5)

    if (eventsError) {
      console.log("❌ Events query failed:", eventsError.message)
      return
    }

    console.log(`✅ Found ${count} total events in database`)
    if (events && events.length > 0) {
      console.log("Sample events:")
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title || "Untitled"} (ID: ${event.id})`)
      })
    } else {
      console.log("⚠️  No events found in database")
    }

    console.log("\n🎉 All tests completed successfully!")

  } catch (error) {
    console.error("❌ Test failed with error:", error)
  }
}

// Run the test
if (require.main === module) {
  testSupabaseConnection().catch(console.error)
}

export { testSupabaseConnection }
