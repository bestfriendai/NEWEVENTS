// Supabase Edge Function for optimized events search
// Runs on Deno runtime at the edge for better performance

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParams {
  lat?: number
  lng?: number
  radius?: number
  query?: string
  category?: string
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request parameters
    const url = new URL(req.url)
    const params: SearchParams = {
      lat: url.searchParams.get('lat') ? parseFloat(url.searchParams.get('lat')!) : undefined,
      lng: url.searchParams.get('lng') ? parseFloat(url.searchParams.get('lng')!) : undefined,
      radius: parseInt(url.searchParams.get('radius') || '25'),
      query: url.searchParams.get('query') || undefined,
      category: url.searchParams.get('category') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
    }

    console.log('Edge function search params:', params)

    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        category,
        start_date,
        end_date,
        location_name,
        location_address,
        location_lat,
        location_lng,
        price_min,
        price_max,
        price_currency,
        image_url,
        organizer_name,
        attendee_count,
        ticket_links,
        tags,
        popularity_score
      `)
      .eq('is_active', true)
      .gte('start_date', new Date().toISOString())

    // Apply location-based filtering using PostGIS
    if (params.lat && params.lng) {
      const { data: nearbyEvents, error: locationError } = await supabase
        .rpc('get_events_near_location', {
          user_lat: params.lat,
          user_lng: params.lng,
          radius_miles: params.radius || 25,
          limit_count: params.limit || 50,
          offset_count: params.offset || 0
        })

      if (locationError) {
        console.error('Location search error:', locationError)
        throw locationError
      }

      // Apply additional filters to location results
      let filteredEvents = nearbyEvents || []

      if (params.query) {
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_events_fulltext', {
            search_query: params.query,
            user_lat: params.lat,
            user_lng: params.lng,
            radius_miles: params.radius || 25,
            limit_count: params.limit || 50
          })

        if (searchError) {
          console.error('Full-text search error:', searchError)
        } else {
          // Merge location and search results
          const searchIds = new Set(searchResults.map((e: any) => e.id))
          filteredEvents = filteredEvents.filter((e: any) => searchIds.has(e.id))
        }
      }

      if (params.category) {
        filteredEvents = filteredEvents.filter((e: any) => 
          e.category?.toLowerCase().includes(params.category!.toLowerCase())
        )
      }

      if (params.startDate) {
        filteredEvents = filteredEvents.filter((e: any) => 
          new Date(e.start_date) >= new Date(params.startDate!)
        )
      }

      if (params.endDate) {
        filteredEvents = filteredEvents.filter((e: any) => 
          new Date(e.start_date) <= new Date(params.endDate!)
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            events: filteredEvents,
            totalCount: filteredEvents.length,
            hasMore: false, // Location-based search returns all results
            source: 'edge-function-location'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fallback to regular query if no location provided
    if (params.query) {
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_events_fulltext', {
          search_query: params.query,
          limit_count: params.limit || 50
        })

      if (searchError) {
        console.error('Search error:', searchError)
        throw searchError
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            events: searchResults || [],
            totalCount: searchResults?.length || 0,
            hasMore: false,
            source: 'edge-function-search'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Apply filters to base query
    if (params.category) {
      query = query.ilike('category', `%${params.category}%`)
    }

    if (params.startDate) {
      query = query.gte('start_date', params.startDate)
    }

    if (params.endDate) {
      query = query.lte('start_date', params.endDate)
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('popularity_score', { ascending: false })
      .order('start_date', { ascending: true })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          events: data || [],
          totalCount: count || 0,
          hasMore: (count || 0) > (params.offset || 0) + (params.limit || 50),
          source: 'edge-function-basic'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        data: {
          events: [],
          totalCount: 0,
          hasMore: false
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* To deploy this function:
1. Install Supabase CLI: npm install -g supabase
2. Login: supabase login
3. Link project: supabase link --project-ref YOUR_PROJECT_REF
4. Deploy: supabase functions deploy events-search

Environment variables needed:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
*/
