#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Direct environment access for testing
const testEnv = {
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST,
  EVENTBRITE_API_KEY: process.env.EVENTBRITE_API_KEY,
  EVENTBRITE_PRIVATE_TOKEN: process.env.EVENTBRITE_PRIVATE_TOKEN,
  TOMTOM_API_KEY: process.env.TOMTOM_API_KEY,
  NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

import { logger } from '../lib/utils/logger'

async function testAllAPIs() {
  console.log('🔍 Testing All API Connections...')
  console.log('==================================')
  
  const results = {
    ticketmaster: false,
    rapidapi: false,
    eventbrite: false,
    tomtom: false,
    mapbox: false
  }

  // Test Ticketmaster API
  console.log('\n🎫 Testing Ticketmaster API...')
  console.log(`   Key available: ${testEnv.TICKETMASTER_API_KEY ? '✅' : '❌'}`)
  try {
    if (!testEnv.TICKETMASTER_API_KEY) {
      console.log('❌ Ticketmaster API key not found')
    } else {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${testEnv.TICKETMASTER_API_KEY}&size=1&city=New York`
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Ticketmaster API working')
        console.log(`📊 Sample event: ${data._embedded?.events?.[0]?.name || 'No events found'}`)
        results.ticketmaster = true
      } else {
        console.log(`❌ Ticketmaster API failed: ${response.status} ${response.statusText}`)
      }
    }
  } catch (error) {
    console.log('❌ Ticketmaster API error:', error)
  }

  // Test RapidAPI
  console.log('\n⚡ Testing RapidAPI Events...')
  console.log(`   Key available: ${testEnv.RAPIDAPI_KEY ? '✅' : '❌'}`)
  try {
    if (!testEnv.RAPIDAPI_KEY) {
      console.log('❌ RapidAPI key not found')
    } else {
      const response = await fetch(
        'https://real-time-events-search.p.rapidapi.com/search-events?query=concert&start=0&is_virtual=false',
        {
          headers: {
            'X-RapidAPI-Key': testEnv.RAPIDAPI_KEY,
            'X-RapidAPI-Host': testEnv.RAPIDAPI_HOST || 'real-time-events-search.p.rapidapi.com'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ RapidAPI working')
        console.log(`📊 Found ${data.data?.length || 0} events`)
        if (data.data?.[0]) {
          console.log(`📋 Sample event: ${data.data[0].title}`)
        }
        results.rapidapi = true
      } else {
        console.log(`❌ RapidAPI failed: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.log('Error details:', errorText)
      }
    }
  } catch (error) {
    console.log('❌ RapidAPI error:', error)
  }

  // Test Eventbrite API
  console.log('\n🎪 Testing Eventbrite API...')
  console.log(`   Key available: ${testEnv.EVENTBRITE_API_KEY || testEnv.EVENTBRITE_PRIVATE_TOKEN ? '✅' : '❌'}`)
  try {
    if (!testEnv.EVENTBRITE_API_KEY && !testEnv.EVENTBRITE_PRIVATE_TOKEN) {
      console.log('❌ Eventbrite API key not found')
    } else {
      const token = testEnv.EVENTBRITE_PRIVATE_TOKEN || testEnv.EVENTBRITE_API_KEY
      const response = await fetch(
        'https://www.eventbriteapi.com/v3/events/search/?location.address=New York&expand=venue',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Eventbrite API working')
        console.log(`📊 Found ${data.events?.length || 0} events`)
        if (data.events?.[0]) {
          console.log(`📋 Sample event: ${data.events[0].name?.text}`)
        }
        results.eventbrite = true
      } else {
        console.log(`❌ Eventbrite API failed: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.log('Error details:', errorText.substring(0, 200))
      }
    }
  } catch (error) {
    console.log('❌ Eventbrite API error:', error)
  }

  // Test TomTom Geocoding API
  console.log('\n🗺️ Testing TomTom Geocoding API...')
  console.log(`   Key available: ${testEnv.TOMTOM_API_KEY ? '✅' : '❌'}`)
  try {
    if (!testEnv.TOMTOM_API_KEY) {
      console.log('❌ TomTom API key not found')
    } else {
      const response = await fetch(
        `https://api.tomtom.com/search/2/geocode/New York.json?key=${testEnv.TOMTOM_API_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ TomTom API working')
        console.log(`📊 Found ${data.results?.length || 0} location results`)
        if (data.results?.[0]) {
          const result = data.results[0]
          console.log(`📍 Sample location: ${result.address?.freeformAddress} (${result.position?.lat}, ${result.position?.lon})`)
        }
        results.tomtom = true
      } else {
        console.log(`❌ TomTom API failed: ${response.status} ${response.statusText}`)
      }
    }
  } catch (error) {
    console.log('❌ TomTom API error:', error)
  }

  // Test Mapbox API
  console.log('\n🗺️ Testing Mapbox API...')
  console.log(`   Key available: ${testEnv.NEXT_PUBLIC_MAPBOX_API_KEY ? '✅' : '❌'}`)
  try {
    if (!testEnv.NEXT_PUBLIC_MAPBOX_API_KEY) {
      console.log('❌ Mapbox API key not found')
    } else {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/New York.json?access_token=${testEnv.NEXT_PUBLIC_MAPBOX_API_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Mapbox API working')
        console.log(`📊 Found ${data.features?.length || 0} location results`)
        if (data.features?.[0]) {
          const feature = data.features[0]
          console.log(`📍 Sample location: ${feature.place_name}`)
        }
        results.mapbox = true
      } else {
        console.log(`❌ Mapbox API failed: ${response.status} ${response.statusText}`)
      }
    }
  } catch (error) {
    console.log('❌ Mapbox API error:', error)
  }

  // Summary
  console.log('\n📊 API Test Results Summary:')
  console.log('============================')
  Object.entries(results).forEach(([api, working]) => {
    console.log(`${working ? '✅' : '❌'} ${api.toUpperCase()}: ${working ? 'Working' : 'Failed'}`)
  })

  const workingAPIs = Object.values(results).filter(Boolean).length
  const totalAPIs = Object.keys(results).length
  
  console.log(`\n🎯 Overall Status: ${workingAPIs}/${totalAPIs} APIs working`)
  
  if (workingAPIs === 0) {
    console.log('❌ No APIs are working - check your environment variables!')
    process.exit(1)
  } else if (workingAPIs < totalAPIs) {
    console.log('⚠️ Some APIs are not working - the app will use available ones')
  } else {
    console.log('🎉 All APIs are working perfectly!')
  }

  logger.info('API connection test completed', {
    component: 'APIConnectionTest',
    action: 'testAllAPIs',
    metadata: {
      results,
      workingCount: workingAPIs,
      totalCount: totalAPIs
    }
  })

  return results
}

// Run the test
testAllAPIs().catch(console.error)
