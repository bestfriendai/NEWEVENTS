#!/usr/bin/env tsx

import { rapidAPIEventsService } from '../lib/api/rapidapi-events'

// Your sample RapidAPI event data
const sampleEvent = {
  "event_id": "L2F1dGhvcml0eS9ob3Jpem9uL2NsdXN0ZXJlZF9ldmVudC8yMDI0LTA2LTE0fDEwNDI0MTY1NDYxNzYzMzMzNTg4",
  "event_mid": "/g/11vwlyzf43",
  "name": "CupcakKe",
  "link": "https://open.spotify.com/concert/5F7Xucy4SoiYK5xi6GzB5h",
  "description": "FRIDAY JUNE 14 2024\n\nDJ Dials & 1015 Folsom Present: cupcakKe",
  "start_time": "2024-06-14 22:00:00",
  "start_time_utc": "2024-06-15 05:00:00",
  "start_time_precision_sec": 1,
  "end_time": "2024-06-14 23:30:00",
  "end_time_utc": "2024-06-15 06:30:00",
  "end_time_precision_sec": 1,
  "is_virtual": false,
  "thumbnail": "https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F762008039%2F121998919041%2F1%2Foriginal.20240507-212848?w=1000&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C198%2C1920%2C960&s=182c6aab47493c1b87d41a43cff0597d",
  "publisher": "Open.spotify.com",
  "publisher_favicon": "https://encrypted-tbn2.gstatic.com/faviconV2?url=https://spotify.com&client=HORIZON&size=96&type=FAVICON&fallback_opts=TYPE,SIZE,URL&nfrp=2",
  "publisher_domain": "Spotify.com",
  "ticket_links": [
    {
      "source": "Eventbrite",
      "link": "https://www.eventbrite.com/e/cupcakke-tickets-900711340867"
    },
    {
      "source": "seetickets",
      "link": "https://wl.seetickets.us/event/cupcakke/595965?afflky=1015Folsom"
    },
    {
      "source": "bandsintown",
      "link": "https://www.bandsintown.com/e/1031449986?app_id=ggl_feed&came_from=289&utm_medium=web&utm_source=ggl_feed&utm_campaign=event"
    },
    {
      "source": "vividseats",
      "link": "https://www.vividseats.com/cupcakke-tickets-san-francisco-1015-folsom-6-14-2024--concerts-rap-hip-hop/production/4898041?utm_source=google&utm_medium=organic&utm_campaign=ttd"
    }
  ],
  "info_links": [
    {
      "source": "Spotify",
      "link": "https://open.spotify.com/concert/5F7Xucy4SoiYK5xi6GzB5h"
    }
  ],
  "venue": {
    "google_id": "0x8085808197e10547:0x6fd616f55e58c728",
    "name": "1015 Folsom",
    "phone_number": "+14157923256",
    "website": "http://1015.com/",
    "review_count": 373,
    "rating": 3.5,
    "subtype": "night_club",
    "subtypes": [
      "night_club",
      "art",
      "bar",
      "bars_and_pubs",
      "beverages",
      "culture",
      "dancing",
      "discos_and_night_clubs",
      "education_and_culture",
      "entertainment",
      "entertainment_and_recreation",
      "establishment",
      "establishment_poi",
      "event_venue",
      "feature",
      "food_and_drink",
      "live_music_venue",
      "music",
      "nightlife",
      "performing_arts",
      "public_api_establishment"
    ],
    "full_address": "1015 Folsom Street, San Francisco, CA 94103, United States",
    "latitude": 37.77811,
    "longitude": -122.4058,
    "street_number": "1015",
    "street": "Folsom Street",
    "city": "San Francisco",
    "state": "California",
    "country": "US",
    "timezone": "America/Los_Angeles",
    "google_mid": "/m/0k5329c"
  },
  "tags": [
    "concert",
    "music",
    "show"
  ],
  "language": "en"
}

async function testPricingExtraction() {
  console.log('🎫 Testing RapidAPI Pricing Extraction\n')
  
  console.log('Event:', sampleEvent.name)
  console.log('Venue:', sampleEvent.venue.name)
  console.log('Date:', sampleEvent.start_time)
  console.log('Ticket Links:', sampleEvent.ticket_links.length)
  
  console.log('\n📊 Available Ticket Platforms:')
  sampleEvent.ticket_links.forEach((link, index) => {
    console.log(`  ${index + 1}. ${link.source}: ${link.link}`)
  })
  
  console.log('\n💰 Pricing Extraction Results:')
  
  // Test standard extraction
  const standardPrice = rapidAPIEventsService.extractPrice(sampleEvent)
  console.log(`Standard extraction: ${standardPrice}`)
  
  // Test enhanced extraction
  const enhancedPrice = await rapidAPIEventsService.getEnhancedPricing(sampleEvent)
  console.log(`Enhanced extraction: ${enhancedPrice}`)
  
  // Test categorization
  const category = rapidAPIEventsService.categorizeEvent(sampleEvent)
  console.log(`Event category: ${category}`)
  
  console.log('\n🧪 Testing Different Scenarios:')
  
  // Test with explicit pricing
  const eventWithPrice = { ...sampleEvent, min_price: "25.00", max_price: "50.00" }
  const priceWithExplicit = await rapidAPIEventsService.getEnhancedPricing(eventWithPrice)
  console.log(`With explicit pricing: ${priceWithExplicit}`)
  
  // Test free event
  const freeEvent = { ...sampleEvent, is_free: true }
  const freePrice = await rapidAPIEventsService.getEnhancedPricing(freeEvent)
  console.log(`Free event: ${freePrice}`)
  
  // Test with price in description
  const eventWithDescPrice = {
    ...sampleEvent,
    description: "Amazing concert! Tickets only $30. Don't miss out!",
    ticket_links: []
  }
  const descPrice = await rapidAPIEventsService.getEnhancedPricing(eventWithDescPrice)
  console.log(`Price from description: ${descPrice}`)
  
  console.log('\n✅ Pricing extraction test completed!')
}

// Run the test
testPricingExtraction().catch(console.error)
