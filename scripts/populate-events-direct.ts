#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function populateEventsDirectly() {
  console.log('🚀 Populating Database with Real Events...')
  console.log('==========================================')
  
  try {
    // Environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY!
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'real-time-events-search.p.rapidapi.com'

    console.log('\n📋 Environment Check:')
    console.log('SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
    console.log('SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌')
    console.log('TICKETMASTER_KEY:', TICKETMASTER_KEY ? '✅' : '❌')
    console.log('RAPIDAPI_KEY:', RAPIDAPI_KEY ? '✅' : '❌')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Check current database state
    console.log('\n🔍 Checking current database state...')
    const { data: currentEvents, error: countError } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (countError) {
      console.log('❌ Error checking events table:', countError.message)
      console.log('📝 The events table might need to be created first')
      return
    }

    console.log('✅ Events table accessible')

    // Clear existing events
    console.log('\n🗑️ Clearing existing events...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .neq('id', 0)

    if (deleteError) {
      console.log('❌ Error clearing events:', deleteError.message)
    } else {
      console.log('✅ Existing events cleared')
    }

    let totalEventsAdded = 0

    // Fetch from Ticketmaster API
    if (TICKETMASTER_KEY) {
      console.log('\n🎫 Fetching events from Ticketmaster...')
      try {
        const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco']
        
        for (const city of cities) {
          console.log(`   📍 Fetching events for ${city}...`)
          
          const response = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_KEY}&city=${encodeURIComponent(city)}&size=20&sort=date,asc`
          )

          if (response.ok) {
            const data = await response.json()
            const events = data._embedded?.events || []
            
            console.log(`   ✅ Found ${events.length} events for ${city}`)

            if (events.length > 0) {
              const eventsToInsert = events.map((event: any) => {
                const startDate = event.dates?.start?.localDate && event.dates?.start?.localTime
                  ? `${event.dates.start.localDate}T${event.dates.start.localTime}`
                  : event.dates?.start?.localDate
                    ? `${event.dates.start.localDate}T19:00:00`
                    : new Date().toISOString()

                return {
                  external_id: event.id,
                  source: 'ticketmaster',
                  title: event.name,
                  description: event.info || event.pleaseNote || 'Event details available at venue',
                  category: event.classifications?.[0]?.segment?.name || 'Entertainment',
                  start_date: startDate,
                  location_name: event._embedded?.venues?.[0]?.name,
                  location_address: event._embedded?.venues?.[0]?.address?.line1,
                  location_lat: parseFloat(event._embedded?.venues?.[0]?.location?.latitude) || null,
                  location_lng: parseFloat(event._embedded?.venues?.[0]?.location?.longitude) || null,
                  price_min: event.priceRanges?.[0]?.min || null,
                  price_max: event.priceRanges?.[0]?.max || null,
                  image_url: event.images?.[0]?.url,
                  organizer_name: event.promoter?.name,
                  ticket_links: event.url ? JSON.stringify([{ url: event.url, type: 'primary' }]) : '[]'
                }
              })

              const { data: inserted, error: insertError } = await supabase
                .from('events')
                .insert(eventsToInsert)
                .select('id')

              if (insertError) {
                console.log(`   ❌ Error inserting events for ${city}:`, insertError.message)
              } else {
                const insertedCount = inserted?.length || 0
                totalEventsAdded += insertedCount
                console.log(`   ✅ Inserted ${insertedCount} events for ${city}`)
              }
            }
          } else {
            console.log(`   ❌ Ticketmaster API failed for ${city}: ${response.status}`)
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.log('❌ Ticketmaster API error:', error)
      }
    }

    // Fetch from RapidAPI
    if (RAPIDAPI_KEY) {
      console.log('\n⚡ Fetching events from RapidAPI...')
      try {
        const queries = ['concert', 'sports', 'theater', 'comedy', 'festival']
        
        for (const query of queries) {
          console.log(`   🔍 Searching for ${query} events...`)
          
          const response = await fetch(
            `https://${RAPIDAPI_HOST}/search-events?query=${query}&start=0&is_virtual=false`,
            {
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            const events = data.data || []
            
            console.log(`   ✅ Found ${events.length} ${query} events`)

            if (events.length > 0) {
              const eventsToInsert = events.slice(0, 15).map((event: any) => {
                const startDate = event.start_time
                  ? new Date(event.start_time).toISOString()
                  : new Date().toISOString()

                return {
                  external_id: (event.event_id || event.id || Math.random().toString()).toString(),
                  source: 'rapidapi',
                  title: event.title || event.name || `${query} Event`,
                  description: event.description || `${query} event`,
                  category: query.charAt(0).toUpperCase() + query.slice(1),
                  start_date: startDate,
                  location_name: event.venue?.name || event.location?.name,
                  location_address: event.venue?.address || event.location?.address,
                  location_lat: event.venue?.latitude || event.location?.latitude || null,
                  location_lng: event.venue?.longitude || event.location?.longitude || null,
                  price_min: event.is_free ? 0 : null,
                  image_url: event.thumbnail || event.image,
                  organizer_name: event.organizer?.name,
                  ticket_links: event.link || event.url ? JSON.stringify([{ url: event.link || event.url, type: 'primary' }]) : '[]'
                }
              })

              const { data: inserted, error: insertError } = await supabase
                .from('events')
                .insert(eventsToInsert)
                .select('id')

              if (insertError) {
                console.log(`   ❌ Error inserting ${query} events:`, insertError.message)
              } else {
                const insertedCount = inserted?.length || 0
                totalEventsAdded += insertedCount
                console.log(`   ✅ Inserted ${insertedCount} ${query} events`)
              }
            }
          } else {
            console.log(`   ❌ RapidAPI failed for ${query}: ${response.status}`)
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.log('❌ RapidAPI error:', error)
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
    console.log('==========================================')

  } catch (error) {
    console.log('\n❌ Population failed:', error)
    process.exit(1)
  }
}

// Run the population script
populateEventsDirectly().catch(console.error)
