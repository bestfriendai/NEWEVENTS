/**
 * Proxy route for Supabase Event Analytics Edge Function
 * Handles analytics tracking and popular/trending events
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'popular', 'trending', 'stats'
    const eventId = searchParams.get('eventId')
    
    logger.info('Analytics API GET request', {
      component: 'AnalyticsAPI',
      type,
      eventId
    })

    // Try edge function first
    try {
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/event-analytics?${searchParams.toString()}`
      
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (edgeResponse.ok) {
        const data = await edgeResponse.json()
        return NextResponse.json(data)
      }
    } catch (edgeError) {
      logger.warn('Analytics edge function failed, using fallback', {
        error: edgeError instanceof Error ? edgeError.message : String(edgeError)
      })
    }

    // Fallback to direct Supabase queries
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    if (type === 'popular') {
      const { data: popularEvents, error } = await supabase
        .from('events')
        .select(`
          id, title, category, start_date, location_name, image_url, 
          popularity_score, attendee_count, price_min, price_max
        `)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('popularity_score', { ascending: false })
        .order('attendee_count', { ascending: false })
        .limit(20)

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: popularEvents || []
      })
    }

    if (type === 'trending') {
      // Get events with recent activity (views in last 24 hours)
      const { data: trendingEvents, error } = await supabase
        .from('events')
        .select(`
          id, title, category, start_date, location_name, image_url,
          popularity_score, attendee_count, price_min, price_max,
          event_stats!inner(views, clicks, favorites, last_viewed)
        `)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .gte('event_stats.last_viewed', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('event_stats.views', { ascending: false })
        .limit(20)

      if (error) {
        // Fallback to popular events if trending query fails
        const { data: fallbackEvents } = await supabase
          .from('events')
          .select(`
            id, title, category, start_date, location_name, image_url,
            popularity_score, attendee_count, price_min, price_max
          `)
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString())
          .order('popularity_score', { ascending: false })
          .limit(20)

        return NextResponse.json({
          success: true,
          data: fallbackEvents || [],
          fallback: true
        })
      }

      return NextResponse.json({
        success: true,
        data: trendingEvents || []
      })
    }

    if (eventId && type === 'stats') {
      const { data: eventStats, error } = await supabase
        .from('event_stats')
        .select('*')
        .eq('event_id', parseInt(eventId))
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return NextResponse.json({
        success: true,
        data: eventStats || { views: 0, clicks: 0, favorites: 0 }
      })
    }

    // Default: return general analytics
    const { data: totalStats, error } = await supabase
      .from('event_stats')
      .select('views, clicks, favorites')

    if (error) throw error

    const aggregated = (totalStats || []).reduce(
      (acc, stat) => ({
        totalViews: acc.totalViews + (stat.views || 0),
        totalClicks: acc.totalClicks + (stat.clicks || 0),
        totalFavorites: acc.totalFavorites + (stat.favorites || 0)
      }),
      { totalViews: 0, totalClicks: 0, totalFavorites: 0 }
    )

    return NextResponse.json({
      success: true,
      data: aggregated
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Analytics API GET error', {
      component: 'AnalyticsAPI',
      error: errorMessage
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, eventId, userId, metadata } = body
    
    logger.info('Analytics API POST request', {
      component: 'AnalyticsAPI',
      type,
      eventId,
      userId: userId ? 'present' : 'none'
    })

    // Validate required fields
    if (!type || !eventId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type and eventId'
        },
        { status: 400 }
      )
    }

    // Try edge function first
    try {
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/event-analytics`
      
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
      logger.warn('Analytics edge function POST failed, using fallback', {
        error: edgeError instanceof Error ? edgeError.message : String(edgeError)
      })
    }

    // Fallback to direct Supabase operations
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Update event statistics based on type
    if (type === 'view') {
      const { error } = await supabase.rpc('increment_event_views', {
        event_id: eventId
      })
      
      if (error) {
        logger.error('Failed to increment views:', error)
        // Continue anyway, don't fail the request
      }
    } else if (type === 'click') {
      const { error } = await supabase.rpc('increment_event_clicks', {
        event_id: eventId
      })
      
      if (error) {
        logger.error('Failed to increment clicks:', error)
      }
    } else if (type === 'favorite') {
      const { error } = await supabase.rpc('increment_event_favorites', {
        event_id: eventId
      })
      
      if (error) {
        logger.error('Failed to increment favorites:', error)
      }
    } else if (type === 'unfavorite') {
      const { error } = await supabase.rpc('decrement_event_favorites', {
        event_id: eventId
      })
      
      if (error) {
        logger.error('Failed to decrement favorites:', error)
      }
    }

    // Update popularity score
    try {
      const { data: stats } = await supabase
        .from('event_stats')
        .select('views, clicks, favorites')
        .eq('event_id', eventId)
        .single()

      if (stats) {
        const popularityScore = calculatePopularityScore(
          stats.views || 0,
          stats.clicks || 0,
          stats.favorites || 0
        )
        
        await supabase
          .from('events')
          .update({ popularity_score: popularityScore })
          .eq('id', eventId)
      }
    } catch (popularityError) {
      logger.warn('Failed to update popularity score:', popularityError)
      // Don't fail the request for this
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics event recorded'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Analytics API POST error', {
      component: 'AnalyticsAPI',
      error: errorMessage
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

function calculatePopularityScore(views: number, clicks: number, favorites: number): number {
  // Weighted popularity calculation
  const viewWeight = 0.1
  const clickWeight = 2.0
  const favoriteWeight = 5.0
  
  return Math.round(
    (views * viewWeight + clicks * clickWeight + favorites * favoriteWeight) * 100
  ) / 100
}
