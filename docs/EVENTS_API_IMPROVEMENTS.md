# Events API Improvements

## Overview

This document outlines the comprehensive improvements made to the events backend system to exclusively use RapidAPI and Ticketmaster APIs while ensuring proper image handling and Supabase integration.

## Key Improvements

### 1. Unified Events Service (`lib/api/unified-events-service.ts`)

**Purpose**: Centralized service that fetches events from both RapidAPI and Ticketmaster, stores them in Supabase, and provides a unified interface.

**Features**:
- Fetches events from both RapidAPI and Ticketmaster APIs
- Intelligent caching in Supabase to reduce API calls
- Duplicate detection and removal
- Location-based filtering with proper distance calculations
- Category mapping between different API formats
- Comprehensive error handling and logging

**Key Methods**:
- `searchEvents()`: Main search method that coordinates between APIs and cache
- `fetchFromRapidAPI()`: Fetches and transforms RapidAPI events
- `fetchFromTicketmaster()`: Fetches and transforms Ticketmaster events
- `getCachedEvents()`: Retrieves cached events from Supabase
- `storeEvents()`: Stores new events in Supabase with upsert logic

### 2. Enhanced Image Service (`lib/services/image-service.ts`)

**Purpose**: Ensures all events have proper, validated images with intelligent fallbacks.

**Features**:
- Validates external image URLs for security and availability
- Provides category-based fallback images
- Supports trusted domain validation
- Preprocesses images from different API sources
- Deterministic fallback selection based on event title

**Image Validation Process**:
1. Check if image URL exists and is valid
2. Verify HTTPS protocol for security
3. Validate against trusted domains (Ticketmaster, RapidAPI, etc.)
4. Attempt to fetch image headers to verify availability
5. Fall back to category-appropriate local images if needed

**Fallback Images**:
- Concerts: `/event-1.png`, `/event-2.png`, `/event-3.png`
- Club Events: `/event-4.png`, `/event-5.png`, `/event-6.png`
- Day Parties: `/event-7.png`, `/event-8.png`, `/event-9.png`
- Parties: `/event-10.png`, `/event-11.png`, `/event-12.png`
- General Events: `/community-event.png`

### 3. Database Schema (`supabase/migrations/001_create_events_table.sql`)

**Purpose**: Optimized Supabase table structure for storing events from multiple sources.

**Key Features**:
- Unique constraint on `external_id` and `source` to prevent duplicates
- Proper indexing for performance (location, date, category, source)
- JSONB support for ticket links and tags
- Row Level Security (RLS) enabled
- Automatic timestamp updates

**Table Structure**:
\`\`\`sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('rapidapi', 'ticketmaster')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  price_currency TEXT DEFAULT 'USD',
  image_url TEXT,
  organizer_name TEXT,
  organizer_avatar TEXT,
  attendee_count INTEGER DEFAULT 0,
  ticket_links JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_external_event UNIQUE (external_id, source)
);
\`\`\`

### 4. Updated Events Service (`lib/services/events-service.ts`)

**Purpose**: Modified to use the new unified events service instead of only reading from Supabase.

**Changes**:
- Now calls `unifiedEventsService.searchEvents()` instead of direct Supabase queries
- Automatically fetches fresh data from APIs when cache is stale
- Maintains backward compatibility with existing API interface

## API Integration Details

### RapidAPI Integration

**Endpoint**: `https://real-time-events-search.p.rapidapi.com`
**Features**:
- Real-time event search
- Venue information with coordinates
- Event categorization
- Thumbnail images
- Ticket links

**Category Mapping**:
- Automatically categorizes events based on tags, venue type, and content
- Maps to: Concerts, Club Events, Day Parties, Parties, General Events

### Ticketmaster Integration

**Endpoint**: `https://app.ticketmaster.com/discovery/v2`
**Features**:
- Comprehensive event data
- High-quality images
- Precise location data
- Price information
- Official ticket links

**Rate Limiting**:
- 5 requests per second
- 200 requests per minute
- 5000 requests per day
- Automatic rate limiting with queuing

## Image Handling Improvements

### Problem Solved
Events were not displaying images properly due to:
- Invalid or broken image URLs from APIs
- Missing fallback mechanisms
- No validation of external images
- Security concerns with untrusted domains

### Solution Implemented
1. **Image Validation Pipeline**:
   - Validate URL format and protocol
   - Check against trusted domains
   - Verify image availability with HEAD requests
   - Timeout protection (5 seconds)

2. **Smart Fallbacks**:
   - Category-based fallback selection
   - Deterministic image selection based on event title
   - High-quality local fallback images

3. **Security Measures**:
   - HTTPS-only external images
   - Trusted domain whitelist
   - Content-type validation

## Performance Optimizations

### Caching Strategy
- **Level 1**: Memory cache for API responses (10-30 minutes)
- **Level 2**: Supabase database cache (24 hours)
- **Level 3**: Fresh API calls when cache is stale

### Database Optimizations
- Proper indexing on frequently queried fields
- Efficient location-based queries
- Pagination support
- Bulk upsert operations

### API Efficiency
- Parallel API calls to RapidAPI and Ticketmaster
- Rate limiting to prevent API quota exhaustion
- Retry logic with exponential backoff
- Request deduplication

## Error Handling

### Graceful Degradation
- If RapidAPI fails, continue with Ticketmaster
- If Ticketmaster fails, continue with RapidAPI
- If both APIs fail, serve cached events
- If cache is empty, return empty results with error message

### Logging and Monitoring
- Comprehensive logging at all levels
- Performance metrics tracking
- Error rate monitoring
- API usage tracking

## Testing

### Test Script (`scripts/test-unified-events.ts`)
Comprehensive test suite that validates:
- Basic event search functionality
- Location-based filtering
- Category-specific searches
- Image availability and validation
- Error handling scenarios
- Performance metrics

### Usage
\`\`\`bash
npm run test:events
# or
npx ts-node scripts/test-unified-events.ts
\`\`\`

## Environment Variables Required

\`\`\`env
# RapidAPI
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=real-time-events-search.p.rapidapi.com

# Ticketmaster
TICKETMASTER_API_KEY=your_ticketmaster_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Migration Guide

### For Existing Applications
1. Run the Supabase migration: `001_create_events_table.sql`
2. Update environment variables
3. The existing API endpoints will continue to work unchanged
4. Events will automatically start populating from RapidAPI and Ticketmaster

### API Compatibility
- All existing API endpoints remain unchanged
- Response format is identical
- Additional metadata available (source tracking, enhanced images)

## Benefits Achieved

1. **Reliable Event Data**: Dual API sources ensure high availability
2. **Enhanced Images**: All events now have proper, validated images
3. **Better Performance**: Intelligent caching reduces API calls and improves response times
4. **Scalability**: Database-backed caching supports high traffic
5. **Maintainability**: Clean separation of concerns and comprehensive error handling
6. **Security**: Validated image URLs and trusted domain restrictions
7. **Monitoring**: Comprehensive logging and performance tracking

## Future Enhancements

1. **Additional API Sources**: Easy to add more event APIs
2. **Machine Learning**: Event categorization and recommendation improvements
3. **Real-time Updates**: WebSocket support for live event updates
4. **Advanced Filtering**: More sophisticated search and filtering options
5. **Analytics**: Event popularity and user engagement tracking
