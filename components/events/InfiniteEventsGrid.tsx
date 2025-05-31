"use client"

/**
 * Infinite Scroll Events Grid Component
 * Optimized for performance with virtual scrolling and intersection observer
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIntersection } from '@mantine/hooks'
import { useInfiniteEventsQuery, useEventAnalytics } from '@/hooks/use-events-query'
import { EventCard } from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import type { EventDetailProps } from '@/components/event-detail-modal'

interface InfiniteEventsGridProps {
  searchParams: {
    lat?: number
    lng?: number
    radius?: number
    category?: string
    query?: string
    startDate?: string
    endDate?: string
  }
  onEventSelect: (event: EventDetailProps) => void
  onToggleFavorite: (eventId: number) => void
  favoriteEvents: Set<number>
  className?: string
}

export function InfiniteEventsGrid({
  searchParams,
  onEventSelect,
  onToggleFavorite,
  favoriteEvents,
  className = ''
}: InfiniteEventsGridProps) {
  const [isOnline, setIsOnline] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Intersection observer for infinite scroll
  const { ref: intersectionRef, entry } = useIntersection({
    root: null,
    rootMargin: '100px', // Load more when 100px from bottom
    threshold: 0.1,
  })
  
  // Infinite query hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useInfiniteEventsQuery(searchParams, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
  
  // Analytics tracking
  const { trackEvent } = useEventAnalytics()
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Infinite scroll trigger
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage && isOnline) {
      logger.info('Loading more events via intersection observer')
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage, isOnline])
  
  // Track page view
  useEffect(() => {
    trackEvent({
      type: 'view',
      eventId: 0, // Page view
      metadata: { 
        page: 'infinite-events-grid',
        searchParams,
        timestamp: new Date().toISOString()
      }
    })
  }, [searchParams, trackEvent])
  
  // Handle event click with analytics
  const handleEventClick = useCallback((event: EventDetailProps) => {
    trackEvent({
      type: 'click',
      eventId: event.id,
      metadata: {
        source: 'infinite-grid',
        position: allEvents.findIndex(e => e.id === event.id),
        searchParams
      }
    })
    onEventSelect(event)
  }, [trackEvent, onEventSelect, searchParams])
  
  // Handle favorite toggle with analytics
  const handleFavoriteToggle = useCallback((eventId: number) => {
    const isFavorite = favoriteEvents.has(eventId)
    trackEvent({
      type: isFavorite ? 'unfavorite' : 'favorite',
      eventId,
      metadata: { source: 'infinite-grid' }
    })
    onToggleFavorite(eventId)
  }, [trackEvent, onToggleFavorite, favoriteEvents])
  
  // Flatten all events from pages
  const allEvents = data?.pages.flatMap(page => page.events) || []
  const totalCount = data?.pages[0]?.totalCount || 0
  
  // Manual load more function
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  
  // Retry function
  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  
  // Error state
  if (isError) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Alert className="max-w-md">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            {!isOnline 
              ? "You're offline. Please check your internet connection."
              : `Failed to load events: ${error?.message || 'Unknown error'}`
            }
          </AlertDescription>
        </Alert>
        <Button 
          onClick={handleRetry} 
          className="mt-4"
          disabled={isRefetching || !isOnline}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    )
  }
  
  // Empty state
  if (allEvents.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No events found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search criteria or location.
          </p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={className}>
      {/* Network status indicator */}
      {!isOnline && (
        <Alert className="mb-6">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Showing cached events.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Events count */}
      <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Showing {allEvents.length} of {totalCount} events
        {!isOnline && ' (cached)'}
      </div>
      
      {/* Events grid */}
      <div 
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {allEvents.map((event, index) => (
            <motion.div
              key={`${event.id}-${event.source || 'unknown'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                delay: Math.min(index * 0.05, 0.5) // Stagger animation, max 0.5s delay
              }}
              layout
            >
              <EventCard
                event={event}
                isFavorite={favoriteEvents.has(event.id)}
                onToggleFavorite={() => handleFavoriteToggle(event.id)}
                onClick={() => handleEventClick(event)}
                index={index}
                className="h-full"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Load more trigger and button */}
      <div className="mt-8 flex flex-col items-center space-y-4">
        {/* Intersection observer target */}
        <div ref={intersectionRef} className="h-1" />
        
        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading more events...</span>
          </div>
        )}
        
        {/* Manual load more button */}
        {hasNextPage && !isFetchingNextPage && (
          <Button 
            onClick={handleLoadMore}
            variant="outline"
            className="min-w-[200px]"
            disabled={!isOnline}
          >
            {isOnline ? (
              <>
                Load More Events
                <span className="ml-2 text-xs text-gray-500">
                  ({totalCount - allEvents.length} remaining)
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Offline
              </>
            )}
          </Button>
        )}
        
        {/* End of results */}
        {!hasNextPage && allEvents.length > 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400 py-4">
            <p>You've reached the end of the events list!</p>
            <Button 
              onClick={handleRetry} 
              variant="ghost" 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh for new events
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
