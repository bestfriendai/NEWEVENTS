"use client"

/**
 * TanStack Query Provider with optimized configuration
 * Provides global query client with performance optimizations
 */

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface QueryProviderProps {
  children: ReactNode
}

// Create query client with optimized defaults
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Cache time - how long data stays in cache after becoming unused
        cacheTime: 10 * 60 * 1000, // 10 minutes
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Don't refetch on window focus by default (can be overridden per query)
        refetchOnWindowFocus: false,
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Background refetch interval (disabled by default)
        refetchInterval: false,
        
        // Keep previous data while fetching new data
        keepPreviousData: true,
        
        // Network mode - online, always, or offlineFirst
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        
        // Retry delay for mutations
        retryDelay: 1000,
        
        // Network mode for mutations
        networkMode: 'online',
      },
    },
    
    // Global error handler
    queryCache: new QueryCache({
      onError: (error, query) => {
        logger.error('Query error:', {
          error: error instanceof Error ? error.message : String(error),
          queryKey: query.queryKey,
          queryHash: query.queryHash,
        })
      },
    }),
    
    // Global mutation error handler
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        logger.error('Mutation error:', {
          error: error instanceof Error ? error.message : String(error),
          mutationKey: mutation.options.mutationKey,
          variables,
        })
      },
      
      onSuccess: (data, variables, context, mutation) => {
        logger.info('Mutation success:', {
          mutationKey: mutation.options.mutationKey,
          variables,
        })
      },
    }),
  })
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create query client only once per provider instance
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
              transformOrigin: 'bottom right',
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}

// Hook to get query client instance
export { useQueryClient } from '@tanstack/react-query'

// Utility functions for cache management
export const queryUtils = {
  // Prefetch events for a specific location
  prefetchEventsForLocation: async (
    queryClient: QueryClient,
    lat: number,
    lng: number,
    radius = 25
  ) => {
    await queryClient.prefetchQuery({
      queryKey: ['events', 'list', { lat, lng, radius }],
      queryFn: () => fetch(`/api/events/enhanced?lat=${lat}&lng=${lng}&radius=${radius}&limit=24`)
        .then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
  },
  
  // Prefetch popular events
  prefetchPopularEvents: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: ['events', 'popular'],
      queryFn: () => fetch('/api/supabase/functions/event-analytics?type=popular')
        .then(res => res.json()),
      staleTime: 10 * 60 * 1000,
    })
  },
  
  // Invalidate all events queries
  invalidateAllEvents: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  },
  
  // Clear all events cache
  clearEventsCache: (queryClient: QueryClient) => {
    queryClient.removeQueries({ queryKey: ['events'] })
  },
  
  // Set event data in cache (useful for optimistic updates)
  setEventInCache: (
    queryClient: QueryClient,
    eventId: number,
    eventData: any
  ) => {
    queryClient.setQueryData(['events', 'detail', eventId], eventData)
  },
  
  // Get cached event data
  getCachedEvent: (queryClient: QueryClient, eventId: number) => {
    return queryClient.getQueryData(['events', 'detail', eventId])
  },
  
  // Optimistically update favorite status
  optimisticFavoriteUpdate: (
    queryClient: QueryClient,
    eventId: number,
    isFavorite: boolean
  ) => {
    // Update all relevant queries that might contain this event
    queryClient.setQueriesData(
      { queryKey: ['events'] },
      (oldData: any) => {
        if (!oldData) return oldData
        
        // Handle different data structures
        if (oldData.events) {
          return {
            ...oldData,
            events: oldData.events.map((event: any) =>
              event.id === eventId ? { ...event, isFavorite } : event
            )
          }
        }
        
        if (oldData.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              events: page.events.map((event: any) =>
                event.id === eventId ? { ...event, isFavorite } : event
              )
            }))
          }
        }
        
        return oldData
      }
    )
  },
}

// Performance monitoring hook
export function useQueryPerformance() {
  const queryClient = useQueryClient()
  
  const getQueryStats = () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      errorQueries: queries.filter(q => q.state.error !== null).length,
    }
  }
  
  const getCacheSize = () => {
    // Estimate cache size (rough calculation)
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    let estimatedSize = 0
    queries.forEach(query => {
      if (query.state.data) {
        try {
          estimatedSize += JSON.stringify(query.state.data).length
        } catch {
          // Ignore circular references
        }
      }
    })
    
    return {
      estimatedSizeBytes: estimatedSize,
      estimatedSizeKB: Math.round(estimatedSize / 1024),
      estimatedSizeMB: Math.round(estimatedSize / (1024 * 1024)),
    }
  }
  
  return {
    getQueryStats,
    getCacheSize,
    clearCache: () => queryClient.clear(),
    invalidateAll: () => queryClient.invalidateQueries(),
  }
}
