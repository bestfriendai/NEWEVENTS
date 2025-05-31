/**
 * Proxy route for Supabase Edge Function
 * Provides fallback and error handling for edge function calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract all search parameters
    const params = Object.fromEntries(searchParams.entries())
    
    logger.info('Supabase edge function proxy request', {
      component: 'SupabaseEdgeFunctionProxy',
      action: 'events-search',
      params
    })

    // Try to call the edge function directly first
    try {
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/events-search?${searchParams.toString()}`
      
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (edgeResponse.ok) {
        const data = await edgeResponse.json()
        
        logger.info('Edge function success', {
          component: 'SupabaseEdgeFunctionProxy',
          eventsCount: data.data?.events?.length || 0,
          source: data.data?.source
        })
        
        return NextResponse.json(data)
      } else {
        logger.warn('Edge function failed, falling back to direct query', {
          status: edgeResponse.status,
          statusText: edgeResponse.statusText
        })
      }
    } catch (edgeError) {
      logger.warn('Edge function error, falling back to direct query', {
        error: edgeError instanceof Error ? edgeError.message : String(edgeError)
      })
    }

    // Fallback to direct Supabase query
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const lat = params.lat ? parseFloat(params.lat) : undefined
    const lng = params.lng ? parseFloat(params.lng) : undefined
    const radius = parseInt(params.radius || '25')
    const category = params.category || undefined
    const query = params.query || undefined
    const limit = parseInt(params.limit || '50')
    const offset = parseInt(params.offset || '0')
    const startDate = params.startDate || new Date().toISOString()
    const endDate = params.endDate || undefined

    let dbQuery = supabase
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
      .gte('start_date', startDate)

    // Apply location filtering if coordinates provided
    if (lat && lng) {
      // Use PostGIS function for location-based search
      const { data: locationEvents, error: locationError } = await supabase
        .rpc('get_events_near_location', {
          user_lat: lat,
          user_lng: lng,
          radius_miles: radius,
          limit_count: limit,
          offset_count: offset
        })

      if (locationError) {
        logger.error('Location search error:', locationError)
        throw locationError
      }

      // Apply additional filters
      let filteredEvents = locationEvents || []

      if (category) {
        filteredEvents = filteredEvents.filter((event: any) =>
          event.category?.toLowerCase().includes(category.toLowerCase())
        )
      }

      if (query) {
        // Use full-text search for query
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_events_fulltext', {
            search_query: query,
            user_lat: lat,
            user_lng: lng,
            radius_miles: radius,
            limit_count: limit
          })

        if (!searchError && searchResults) {
          const searchIds = new Set(searchResults.map((e: any) => e.id))
          filteredEvents = filteredEvents.filter((e: any) => searchIds.has(e.id))
        }
      }

      if (endDate) {
        filteredEvents = filteredEvents.filter((event: any) =>
          new Date(event.start_date) <= new Date(endDate)
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          events: filteredEvents,
          totalCount: filteredEvents.length,
          hasMore: false, // Location search returns all matching results
          source: 'fallback-location'
        }
      })
    }

    // Fallback to basic query without location
    if (category) {
      dbQuery = dbQuery.ilike('category', `%${category}%`)
    }

    if (endDate) {
      dbQuery = dbQuery.lte('start_date', endDate)
    }

    // Full-text search if query provided
    if (query) {
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_events_fulltext', {
          search_query: query,
          limit_count: limit
        })

      if (searchError) {
        logger.error('Full-text search error:', searchError)
        throw searchError
      }

      return NextResponse.json({
        success: true,
        data: {
          events: searchResults || [],
          totalCount: searchResults?.length || 0,
          hasMore: false,
          source: 'fallback-search'
        }
      })
    }

    // Execute basic query
    const { data, error, count } = await dbQuery
      .order('popularity_score', { ascending: false })
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Database query error:', error)
      throw error
    }

    logger.info('Fallback query success', {
      component: 'SupabaseEdgeFunctionProxy',
      eventsCount: data?.length || 0,
      totalCount: count
    })

    return NextResponse.json({
      success: true,
      data: {
        events: data || [],
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit,
        source: 'fallback-basic'
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Supabase edge function proxy error', {
      component: 'SupabaseEdgeFunctionProxy',
      error: errorMessage
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: {
          events: [],
          totalCount: 0,
          hasMore: false,
          source: 'error'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    logger.info('Supabase edge function proxy POST request', {
      component: 'SupabaseEdgeFunctionProxy',
      action: 'events-search-post',
      body
    })

    // Try edge function first
    try {
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/events-search`
      
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (edgeResponse.ok) {
        const data = await edgeResponse.json()
        return NextResponse.json(data)
      }
    } catch (edgeError) {
      logger.warn('Edge function POST failed, using fallback', {
        error: edgeError instanceof Error ? edgeError.message : String(edgeError)
      })
    }

    // Fallback to GET with query parameters
    const searchParams = new URLSearchParams()
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const getRequest = new NextRequest(
      `${request.url}?${searchParams.toString()}`,
      { method: 'GET' }
    )

    return GET(getRequest)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Supabase edge function proxy POST error', {
      component: 'SupabaseEdgeFunctionProxy',
      error: errorMessage
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: {
          events: [],
          totalCount: 0,
          hasMore: false,
          source: 'error'
        }
      },
      { status: 500 }
    )
  }
}
