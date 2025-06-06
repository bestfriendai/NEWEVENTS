#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { env } from '../lib/env'
import { logger } from '../lib/utils/logger'
import { unifiedEventsService } from '../lib/api/unified-events-service'

async function populateRealEvents() {
  console.log('🚀 Populating Database with Real Events from APIs...')
  console.log('====================================================')
  
  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('\n📋 Environment Check:')
    console.log('SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
    console.log('RAPIDAPI_KEY:', env.RAPIDAPI_KEY ? '✅' : '❌')
    console.log('TICKETMASTER_API_KEY:', env.TICKETMASTER_API_KEY ? '✅' : '❌')
    console.log('EVENTBRITE_API_KEY:', env.EVENTBRITE_API_KEY ? '✅' : '❌')

    // Check current database state
    console.log('\n🔍 Checking current database state...')
    
    // Check if events table exists and get current count
    const { data: currentEvents, error: countError } = await supabase
      .from('events')
      .select('id, title, source, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (countError) {
      console.log('❌ Error checking events table:', countError.message)
      console.log('📝 The events table might need to be created first')
      return
    }

    console.log(`📊 Current events in database: ${currentEvents?.length || 0}`)
    if (currentEvents && currentEvents.length > 0) {
      console.log('📋 Recent events:')
      currentEvents.slice(0, 5).forEach((event: any) => {
        console.log(`   - ${event.title} (${event.source}) - ${event.created_at}`)
      })
    }

    // Clear existing events (optional - comment out if you want to keep them)
    console.log('\n🗑️ Clearing existing events...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .neq('id', 0) // Delete all records

    if (deleteError) {
      console.log('❌ Error clearing events:', deleteError.message)
    } else {
      console.log('✅ Existing events cleared')
    }

    // Fetch real events from multiple locations
    const locations = [
      { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
      { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
      { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 }
    ]

    const categories = ['concerts', 'sports', 'theater', 'comedy', 'festivals']
    let totalEventsAdded = 0

    for (const location of locations) {
      console.log(`\n🌍 Fetching events for ${location.name}...`)
      
      for (const category of categories) {
        try {
          console.log(`   📅 Searching for ${category} events...`)
          
          const searchResult = await unifiedEventsService.searchEvents({
            query: category,
            lat: location.lat,
            lng: location.lng,
            radius: 50,
            limit: 10,
            category: category
          })

          if (searchResult.error) {
            console.log(`   ❌ Error fetching ${category} events: ${searchResult.error}`)
            continue
          }

          console.log(`   ✅ Found ${searchResult.events.length} ${category} events`)

          // Insert events into database
          if (searchResult.events.length > 0) {
            const eventsToInsert = searchResult.events.map(event => ({
              title: event.title,
              description: event.description,
              date: event.date,
              time: event.time,
              venue_name: event.venue?.name,
              venue_address: event.venue?.address,
              latitude: event.coordinates?.lat,
              longitude: event.coordinates?.lng,
              category: event.category,
              price: event.price,
              image_url: event.image,
              ticket_url: event.ticketLinks?.[0]?.url,
              source: event.source,
              external_id: event.id?.toString(),
              organizer_name: event.organizer?.name,
              attendees_count: event.attendees,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))

            const { data: insertedEvents, error: insertError } = await supabase
              .from('events')
              .insert(eventsToInsert)
              .select('id, title')

            if (insertError) {
              console.log(`   ❌ Error inserting ${category} events:`, insertError.message)
            } else {
              const insertedCount = insertedEvents?.length || 0
              totalEventsAdded += insertedCount
              console.log(`   ✅ Inserted ${insertedCount} ${category} events`)
            }
          }

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.log(`   ❌ Error processing ${category} for ${location.name}:`, error)
        }
      }
    }

    // Final database check
    console.log('\n📊 Final database state...')
    const { data: finalEvents, error: finalError } = await supabase
      .from('events')
      .select('id, title, source, category')
      .order('created_at', { ascending: false })
      .limit(10)

    if (finalError) {
      console.log('❌ Error checking final state:', finalError.message)
    } else {
      console.log(`✅ Total events now in database: ${finalEvents?.length || 0}`)
      console.log('📋 Sample events added:')
      finalEvents?.slice(0, 5).forEach((event: any) => {
        console.log(`   - ${event.title} (${event.source}) [${event.category}]`)
      })
    }

    console.log('\n🎉 Database Population Complete!')
    console.log(`📈 Total events added: ${totalEventsAdded}`)
    console.log('====================================================')

    logger.info('Real events population completed', {
      component: 'PopulateRealEvents',
      action: 'populateComplete',
      metadata: {
        totalEventsAdded,
        locationsProcessed: locations.length,
        categoriesProcessed: categories.length
      }
    })

  } catch (error) {
    console.log('\n❌ Population failed:', error)
    
    logger.error('Real events population failed', {
      component: 'PopulateRealEvents',
      action: 'populateError'
    }, error instanceof Error ? error : new Error(String(error)))
    
    process.exit(1)
  }
}

// Run the population script
populateRealEvents().catch(console.error)
