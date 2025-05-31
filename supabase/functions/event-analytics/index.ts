// Supabase Edge Function for event analytics and tracking
// Handles view tracking, popularity updates, and real-time stats

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsEvent {
  type: 'view' | 'click' | 'favorite' | 'unfavorite'
  eventId: number
  userId?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method === 'POST') {
      const body: AnalyticsEvent = await req.json()
      
      console.log('Analytics event:', body)

      // Validate required fields
      if (!body.type || !body.eventId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Update event statistics
      const { error: upsertError } = await supabase
        .from('event_stats')
        .upsert({
          event_id: body.eventId,
          views: body.type === 'view' ? 1 : 0,
          clicks: body.type === 'click' ? 1 : 0,
          favorites: body.type === 'favorite' ? 1 : body.type === 'unfavorite' ? -1 : 0,
          last_viewed: body.type === 'view' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'event_id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('Error updating event stats:', upsertError)
        
        // Try to increment existing record instead
        if (body.type === 'view') {
          await supabase.rpc('increment_event_views', { event_id: body.eventId })
        } else if (body.type === 'click') {
          await supabase.rpc('increment_event_clicks', { event_id: body.eventId })
        } else if (body.type === 'favorite') {
          await supabase.rpc('increment_event_favorites', { event_id: body.eventId })
        } else if (body.type === 'unfavorite') {
          await supabase.rpc('decrement_event_favorites', { event_id: body.eventId })
        }
      }

      // Update popularity score based on new stats
      const { data: stats } = await supabase
        .from('event_stats')
        .select('views, clicks, favorites')
        .eq('event_id', body.eventId)
        .single()

      if (stats) {
        const popularityScore = calculatePopularityScore(stats.views, stats.clicks, stats.favorites)
        
        await supabase
          .from('events')
          .update({ popularity_score: popularityScore })
          .eq('id', body.eventId)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Analytics event recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // GET request - return analytics data
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const eventId = url.searchParams.get('eventId')
      const type = url.searchParams.get('type') // 'popular', 'trending', 'stats'

      if (type === 'popular') {
        // Return popular events
        const { data: popularEvents, error } = await supabase
          .from('events')
          .select(`
            id, title, category, start_date, location_name, image_url, 
            popularity_score, attendee_count
          `)
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString())
          .order('popularity_score', { ascending: false })
          .limit(20)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: popularEvents }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      if (type === 'trending') {
        // Return trending events (high recent activity)
        const { data: trendingEvents, error } = await supabase
          .from('events')
          .select(`
            id, title, category, start_date, location_name, image_url,
            popularity_score, attendee_count,
            event_stats!inner(views, clicks, favorites, last_viewed)
          `)
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString())
          .gte('event_stats.last_viewed', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order('event_stats.views', { ascending: false })
          .limit(20)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: trendingEvents }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      if (eventId && type === 'stats') {
        // Return specific event stats
        const { data: eventStats, error } = await supabase
          .from('event_stats')
          .select('*')
          .eq('event_id', parseInt(eventId))
          .single()

        if (error && error.code !== 'PGRST116') throw error

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: eventStats || { views: 0, clicks: 0, favorites: 0 }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Default: return general analytics
      const { data: totalStats, error } = await supabase
        .from('event_stats')
        .select('views, clicks, favorites')

      if (error) throw error

      const aggregated = totalStats.reduce(
        (acc, stat) => ({
          totalViews: acc.totalViews + (stat.views || 0),
          totalClicks: acc.totalClicks + (stat.clicks || 0),
          totalFavorites: acc.totalFavorites + (stat.favorites || 0)
        }),
        { totalViews: 0, totalClicks: 0, totalFavorites: 0 }
      )

      return new Response(
        JSON.stringify({ success: true, data: aggregated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )

  } catch (error) {
    console.error('Analytics function error:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function calculatePopularityScore(views: number, clicks: number, favorites: number): number {
  // Weighted popularity calculation
  const viewWeight = 0.1
  const clickWeight = 2.0
  const favoriteWeight = 5.0
  
  return Math.round(
    (views * viewWeight + clicks * clickWeight + favorites * favoriteWeight) * 100
  ) / 100
}

/* Database functions needed (add to migration):

CREATE OR REPLACE FUNCTION increment_event_views(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, views, last_viewed)
    VALUES (event_id, 1, NOW())
    ON CONFLICT (event_id)
    DO UPDATE SET 
        views = event_stats.views + 1,
        last_viewed = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_event_clicks(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, clicks)
    VALUES (event_id, 1)
    ON CONFLICT (event_id)
    DO UPDATE SET 
        clicks = event_stats.clicks + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_event_favorites(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, favorites)
    VALUES (event_id, 1)
    ON CONFLICT (event_id)
    DO UPDATE SET 
        favorites = event_stats.favorites + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_event_favorites(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, favorites)
    VALUES (event_id, -1)
    ON CONFLICT (event_id)
    DO UPDATE SET 
        favorites = GREATEST(0, event_stats.favorites - 1),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

*/
