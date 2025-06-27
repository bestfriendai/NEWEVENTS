# Environment Setup Guide

## Quick Start

The application now works with or without API keys. Without API keys, it uses mock data and fallback geocoding for major US cities.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mapbox (Recommended for geocoding)
NEXT_PUBLIC_MAPBOX_API_KEY=your-mapbox-access-token
```

## Optional API Keys for Full Functionality

```env
# Geocoding Fallback
TOMTOM_API_KEY=your-tomtom-api-key

# Event Data Sources
TICKETMASTER_API_KEY=your-ticketmaster-api-key
RAPIDAPI_KEY=your-rapidapi-key
EVENTBRITE_API_KEY=your-eventbrite-api-key
PREDICTHQ_API_KEY=your-predicthq-api-key

# AI Features (optional)
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Getting Free API Keys

### 1. Mapbox (Geocoding & Maps)
- Sign up at https://www.mapbox.com/
- Free tier: 50,000 requests/month
- Copy your default public token

### 2. TomTom (Geocoding Fallback)
- Sign up at https://developer.tomtom.com/
- Free tier: 2,500 requests/day
- Create an app and copy the API key

### 3. Ticketmaster (Event Data)
- Register at https://developer.ticketmaster.com/
- Free tier available
- Get your API key from the dashboard

### 4. RapidAPI (Additional Events)
- Sign up at https://rapidapi.com/
- Subscribe to "Real-Time Events Search" API
- Copy your RapidAPI key

## Testing Your Configuration

Visit `/api/test-config` to check your configuration status:

```bash
curl http://localhost:3000/api/test-config
```

## Fallback Behavior

When API keys are not configured:

1. **Geocoding**: Falls back to major US cities database
2. **Events**: Uses mock event data
3. **Maps**: Shows static map placeholder
4. **Location**: Browser geolocation still works

## Troubleshooting

### Missing Mapbox API Key
- The app will use the fallback geocoding for major US cities
- Map features will be limited

### No Event API Keys
- The app will display mock events
- Real-time event data won't be available

### Supabase Connection Issues
- Check if your Supabase URL starts with `https://`
- Verify the anon key is correct
- The app can still function with mock data

## Development vs Production

For production deployment:
1. Set all API keys in your hosting platform's environment variables
2. Remove any `.env.local` files from version control
3. Enable Supabase Row Level Security (RLS)
4. Configure CORS settings for your domain