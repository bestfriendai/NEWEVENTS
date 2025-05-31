"use client"

/**
 * Real-time Events Hook using Supabase Realtime
 * Provides live updates for events, favorites, and analytics
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { logger } from '@/lib/utils/logger'
import { eventsQueryKeys } from '@/hooks/use-events-query'
import { advancedCache, cacheKeys, cacheTags } from '@/lib/cache/advanced-cache'
import type { EventDetailProps } from '@/components/event-detail-modal'

interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

interface RealtimeStats {
  connected: boolean
  lastUpdate: number
  updateCount: number
  errors: number
  latency: number
}

interface UseRealtimeEventsOptions {
  enabled?: boolean
  userLocation?: { lat: number; lng: number }
  radius?: number
  autoReconnect?: boolean
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const {
    enabled = true,
    userLocation,
    radius = 25,
    autoReconnect = true
  } = options

  const [stats, setStats] = useState<RealtimeStats>({
    connected: false,
    lastUpdate: 0,
    updateCount: 0,
    errors: 0,
    latency: 0
  })

  const [liveEvents, setLiveEvents] = useState<EventDetailProps[]>([])
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'new_event' | 'event_updated' | 'popular_event' | 'nearby_event'
    message: string
    event?: EventDetailProps
    timestamp: number
  }>>([])

  const queryClient = useQueryClient()
  const supabaseRef = useRef<any>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Supabase client
  const initializeSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        }
      )
    }
    return supabaseRef.current
  }, [])

  // Handle realtime event updates
  const handleEventUpdate = useCallback((payload: RealtimeEvent) => {
    const { type, record, old_record } = payload
    
    logger.info('Realtime event received', { type, recordId: record?.id })
    
    setStats(prev => ({
      ...prev,
      lastUpdate: Date.now(),
      updateCount: prev.updateCount + 1
    }))

    try {
      if (type === 'INSERT' && record) {
        // New event added
        const newEvent = transformDatabaseEventToProps(record)
        
        // Check if event is nearby
        if (userLocation && record.location_lat && record.location_lng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            record.location_lat,
            record.location_lng
          )
          
          if (distance <= radius) {
            // Add to live events
            setLiveEvents(prev => [newEvent, ...prev.slice(0, 49)]) // Keep last 50
            
            // Add notification
            addNotification({
              type: 'nearby_event',
              message: `New event "${record.title}" added near you (${distance.toFixed(1)} miles away)`,
              event: newEvent
            })
            
            // Invalidate location-based queries
            queryClient.invalidateQueries({
              queryKey: eventsQueryKeys.list({ 
                lat: userLocation.lat, 
                lng: userLocation.lng, 
                radius 
              })
            })
          }
        }
        
        // Clear related cache
        advancedCache.clearByTags([cacheTags.EVENTS, cacheTags.LOCATION_BASED])
        
        // Invalidate popular events if this might be popular
        if (record.attendee_count > 100 || record.popularity_score > 50) {
          queryClient.invalidateQueries({ queryKey: eventsQueryKeys.popular() })
          
          addNotification({
            type: 'popular_event',
            message: `Popular event "${record.title}" is now available!`,
            event: newEvent
          })
        }
      }
      
      else if (type === 'UPDATE' && record) {
        // Event updated
        const updatedEvent = transformDatabaseEventToProps(record)
        
        // Update live events
        setLiveEvents(prev => 
          prev.map(event => event.id === record.id ? updatedEvent : event)
        )
        
        // Update cache
        const cacheKey = cacheKeys.events.detail(record.id)
        advancedCache.set(cacheKey, updatedEvent, 10 * 60 * 1000, [cacheTags.EVENTS])
        
        // Invalidate queries for this specific event
        queryClient.invalidateQueries({ queryKey: eventsQueryKeys.detail(record.id) })
        
        // Check for significant updates
        if (old_record && record.attendee_count > old_record.attendee_count * 1.5) {
          addNotification({
            type: 'event_updated',
            message: `"${record.title}" is getting popular! ${record.attendee_count} people attending.`,
            event: updatedEvent
          })
        }
      }
      
      else if (type === 'DELETE' && old_record) {
        // Event deleted
        setLiveEvents(prev => prev.filter(event => event.id !== old_record.id))
        
        // Remove from cache
        advancedCache.delete(cacheKeys.events.detail(old_record.id))
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: eventsQueryKeys.detail(old_record.id) })
      }
      
    } catch (error) {
      logger.error('Error handling realtime event', { error, payload })
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
    }
  }, [userLocation, radius, queryClient])

  // Handle event stats updates
  const handleStatsUpdate = useCallback((payload: RealtimeEvent) => {
    const { type, record } = payload
    
    if (type === 'UPDATE' && record) {
      // Invalidate trending events if stats changed significantly
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.trending() })
      
      // Update analytics cache
      const cacheKey = cacheKeys.events.analytics(record.event_id)
      advancedCache.delete(cacheKey) // Force refresh
    }
  }, [queryClient])

  // Add notification
  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]) // Keep last 10
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 10000)
  }, [])

  // Connect to realtime
  const connect = useCallback(() => {
    if (!enabled) return
    
    const supabase = initializeSupabase()
    
    try {
      // Create channel for events
      const channel = supabase
        .channel('events-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: 'is_active=eq.true'
          },
          handleEventUpdate
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_stats'
          },
          handleStatsUpdate
        )
        .subscribe((status) => {
          logger.info('Realtime subscription status', { status })
          
          setStats(prev => ({
            ...prev,
            connected: status === 'SUBSCRIBED'
          }))
          
          if (status === 'SUBSCRIBED') {
            // Start ping interval to measure latency
            pingIntervalRef.current = setInterval(() => {
              const start = Date.now()
              channel.send({
                type: 'broadcast',
                event: 'ping',
                payload: { timestamp: start }
              })
            }, 30000) // Ping every 30 seconds
          }
        })
      
      // Handle pong responses for latency measurement
      channel.on('broadcast', { event: 'pong' }, (payload) => {
        const latency = Date.now() - payload.payload.timestamp
        setStats(prev => ({ ...prev, latency }))
      })
      
      channelRef.current = channel
      
    } catch (error) {
      logger.error('Failed to connect to realtime', { error })
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
      
      // Auto-reconnect
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
    }
  }, [enabled, initializeSupabase, handleEventUpdate, handleStatsUpdate, autoReconnect])

  // Disconnect from realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setStats(prev => ({ ...prev, connected: false }))
    
    logger.info('Realtime disconnected')
  }, [])

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Clear notification by id
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Initialize connection
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Reconnect when options change
  useEffect(() => {
    if (channelRef.current) {
      disconnect()
      setTimeout(connect, 1000) // Reconnect after 1 second
    }
  }, [userLocation, radius, enabled, connect, disconnect])

  return {
    // Connection state
    isConnected: stats.connected,
    stats,
    
    // Live data
    liveEvents,
    notifications,
    
    // Actions
    connect,
    disconnect,
    clearNotifications,
    clearNotification,
    
    // Utilities
    addNotification
  }
}

// Helper functions
function transformDatabaseEventToProps(dbEvent: any): EventDetailProps {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description || '',
    category: dbEvent.category || 'General',
    date: dbEvent.start_date?.split('T')[0] || '',
    time: dbEvent.start_date ? new Date(dbEvent.start_date).toLocaleTimeString() : '',
    location: dbEvent.location_name || '',
    address: dbEvent.location_address || '',
    price: dbEvent.price_min ? `$${dbEvent.price_min}${dbEvent.price_max ? ` - $${dbEvent.price_max}` : ''}` : 'Free',
    image: dbEvent.image_url || '/community-event.png',
    organizer: {
      name: dbEvent.organizer_name || 'Unknown',
      avatar: dbEvent.organizer_avatar || '/avatar-placeholder.png',
    },
    attendees: dbEvent.attendee_count || 0,
    coordinates: dbEvent.location_lat && dbEvent.location_lng ? {
      lat: dbEvent.location_lat,
      lng: dbEvent.location_lng
    } : undefined,
    ticketLinks: dbEvent.ticket_links || [],
    isFavorite: false, // Will be updated by favorites hook
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
