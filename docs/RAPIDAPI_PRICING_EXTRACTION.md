# RapidAPI Event Pricing Extraction Guide

## Overview

The RapidAPI Real-Time Events Search API doesn't always include direct pricing information in the main event response. However, it provides `ticket_links` that point to external ticketing platforms where pricing can be extracted.

## Current Implementation

### Enhanced Pricing Extraction Methods

1. **Direct Price Fields**: Check for `min_price`, `max_price`, and `is_free` fields
2. **Ticket Link Analysis**: Extract pricing from ticket platform URLs
3. **Text Pattern Matching**: Parse event descriptions and names for price information
4. **Intelligent Estimation**: Provide estimated pricing based on event type and venue

### Key Features

#### 1. Ticket Link URL Analysis
```typescript
// Extract pricing from ticket platform URLs
private extractPriceFromTicketUrl(url: string, source: string): number | null {
  // Eventbrite URL patterns
  if (source.toLowerCase().includes('eventbrite')) {
    const priceParam = urlObj.searchParams.get('price')
    // ... extract price from URL parameters
  }
  
  // SeeTickets, VividSeats, and other platforms
  // ... platform-specific extraction logic
}
```

#### 2. Enhanced Pricing Method
```typescript
async getEnhancedPricing(event: RapidAPIEvent): Promise<string> {
  // 1. Try standard extraction
  const standardPrice = this.extractPrice(event)
  
  // 2. If no price found, analyze ticket links
  if (standardPrice === "Price TBA") {
    // Analyze ticket_links for pricing information
    // Return platform-specific pricing or "See [Platform]"
  }
  
  return standardPrice
}
```

## RapidAPI Response Structure

Based on your example response, RapidAPI events include:

```json
{
  "event_id": "...",
  "name": "CupcakKe",
  "description": "FRIDAY JUNE 14 2024...",
  "start_time": "2024-06-14 22:00:00",
  "is_virtual": false,
  "thumbnail": "https://...",
  "ticket_links": [
    {
      "source": "Eventbrite",
      "link": "https://www.eventbrite.com/e/cupcakke-tickets-900711340867"
    },
    {
      "source": "seetickets", 
      "link": "https://wl.seetickets.us/event/cupcakke/595965?afflky=1015Folsom"
    }
  ],
  "venue": {
    "name": "1015 Folsom",
    "latitude": 37.77811,
    "longitude": -122.4058,
    // ... other venue details
  }
}
```

## Pricing Extraction Strategies

### 1. URL Parameter Analysis
- **Eventbrite**: Look for `price`, `cost` parameters
- **SeeTickets**: Check URL path and query parameters
- **VividSeats**: Extract from URL patterns
- **Generic**: Use regex patterns for common price formats

### 2. Platform-Specific API Integration (Future Enhancement)
```typescript
// Potential future implementation
async getEventbritePrice(eventId: string): Promise<number | null> {
  // Make API call to Eventbrite to get actual pricing
}

async getSeeTicketsPrice(eventUrl: string): Promise<number | null> {
  // Scrape or use API to get pricing from SeeTickets
}
```

### 3. Intelligent Fallbacks
- **Free Event Detection**: Check for "free" indicators in URLs and descriptions
- **Price Estimation**: Based on event category and venue type
- **Platform Redirection**: Show "See [Platform]" for ticket availability

## Implementation Benefits

1. **Improved Accuracy**: Extract real pricing from ticket platforms
2. **Better User Experience**: Show actual prices instead of "Price TBA"
3. **Platform Integration**: Leverage existing ticket platform data
4. **Fallback Handling**: Graceful degradation when pricing isn't available

## Usage in Codebase

The enhanced pricing extraction is now integrated into:

- `lib/api/rapidapi-events.ts` - Core pricing extraction logic
- `lib/api/events-api.ts` - Event transformation with enhanced pricing
- `lib/api/real-time-events-api.ts` - Real-time event processing

## Future Enhancements

1. **Direct API Integration**: Connect to Eventbrite, SeeTickets APIs for real pricing
2. **Caching**: Cache pricing information to reduce API calls
3. **Price Tracking**: Monitor price changes over time
4. **Currency Conversion**: Support multiple currencies
5. **Dynamic Pricing**: Handle time-sensitive pricing (early bird, etc.)

## Testing

To test the enhanced pricing extraction:

```typescript
import { rapidAPIEventsService } from './lib/api/rapidapi-events'

// Test with your sample event
const sampleEvent = {
  // ... your RapidAPI event data
  ticket_links: [
    {
      source: "Eventbrite",
      link: "https://www.eventbrite.com/e/cupcakke-tickets-900711340867"
    }
  ]
}

const pricing = await rapidAPIEventsService.getEnhancedPricing(sampleEvent)
console.log('Extracted pricing:', pricing)
```

## Conclusion

This enhanced pricing extraction system provides multiple layers of price detection, from direct API fields to intelligent URL analysis and smart fallbacks. It significantly improves the pricing information available for RapidAPI events while maintaining backward compatibility.
