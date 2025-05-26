"use client"

/**
 * User Favorites Hook
 * Manages user's favorite events with optimistic updates and caching
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { logger } from "@/lib/utils/logger"
import { toggleEventFavorite, getUserFavorites } from "@/app/actions/user-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"

export interface UseFavoritesResult {
  favorites: EventDetailProps[]
  favoriteIds: Set<number>
  isLoading: boolean
  isError: boolean
  error: string | null

  // Actions
  toggleFavorite: (eventId: number, optimisticEvent?: EventDetailProps) => Promise<boolean>
  isFavorite: (eventId: number) => boolean
  refreshFavorites: () => Promise<void>
  clearFavorites: () => void
}

export function useUserFavorites(): UseFavoritesResult {
  // State
  const [favorites, setFavorites] = useState<EventDetailProps[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for optimistic updates
  const optimisticUpdatesRef = useRef<Map<number, { action: "add" | "remove"; event?: EventDetailProps }>>(new Map())

  /**
   * Load user's favorites
   */
  const loadFavorites = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      logger.debug("Loading user favorites", {
        component: "useUserFavorites",
        action: "load_favorites",
      })

      const result = await getUserFavorites(100) // Load up to 100 favorites

      if (!result.success) {
        throw new Error(result.error || "Failed to load favorites")
      }

      const favoritesData = result.data || []
      const favoriteEvents = favoritesData.map((fav: any) => fav.event).filter(Boolean)
      const favoriteEventIds = new Set(favoriteEvents.map((event: EventDetailProps) => Number(event.id)))

      setFavorites(favoriteEvents)
      setFavoriteIds(favoriteEventIds)

      logger.info("User favorites loaded", {
        component: "useUserFavorites",
        action: "load_favorites_success",
        metadata: { count: favoriteEvents.length },
      })
    } catch (error) {
      logger.error(
        "Error loading user favorites",
        {
          component: "useUserFavorites",
          action: "load_favorites_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      setIsError(true)
      setError(error instanceof Error ? error.message : "Failed to load favorites")
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Toggle favorite status with optimistic updates
   */
  const toggleFavorite = useCallback(
    async (eventId: number, optimisticEvent?: EventDetailProps): Promise<boolean> => {
      try {
        const numericEventId = Number(eventId)
        const currentlyFavorited = favoriteIds.has(numericEventId)
        const action = currentlyFavorited ? "remove" : "add"

        logger.debug("Toggling favorite", {
          component: "useUserFavorites",
          action: "toggle_favorite",
          metadata: { eventId: numericEventId, action },
        })

        // Store optimistic update
        optimisticUpdatesRef.current.set(numericEventId, { action, event: optimisticEvent })

        // Optimistic update
        if (action === "add") {
          setFavoriteIds((prev) => new Set([...prev, numericEventId]))
          if (optimisticEvent) {
            setFavorites((prev) => [optimisticEvent, ...prev])
          }
        } else {
          setFavoriteIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(numericEventId)
            return newSet
          })
          setFavorites((prev) => prev.filter((event) => Number(event.id) !== numericEventId))
        }

        // Make API call
        const result = await toggleEventFavorite(numericEventId, action)

        if (!result.success) {
          // Revert optimistic update
          if (action === "add") {
            setFavoriteIds((prev) => {
              const newSet = new Set(prev)
              newSet.delete(numericEventId)
              return newSet
            })
            if (optimisticEvent) {
              setFavorites((prev) => prev.filter((event) => Number(event.id) !== numericEventId))
            }
          } else {
            setFavoriteIds((prev) => new Set([...prev, numericEventId]))
            if (optimisticEvent) {
              setFavorites((prev) => [optimisticEvent, ...prev])
            }
          }

          throw new Error(result.error || "Failed to update favorite")
        }

        // Clear optimistic update
        optimisticUpdatesRef.current.delete(numericEventId)

        logger.info("Favorite toggled successfully", {
          component: "useUserFavorites",
          action: "toggle_favorite_success",
          metadata: { eventId: numericEventId, action },
        })

        return true
      } catch (error) {
        logger.error(
          "Error toggling favorite",
          {
            component: "useUserFavorites",
            action: "toggle_favorite_error",
            metadata: { eventId },
          },
          error instanceof Error ? error : new Error(String(error)),
        )

        // Clear optimistic update
        optimisticUpdatesRef.current.delete(Number(eventId))

        return false
      }
    },
    [favoriteIds],
  )

  /**
   * Check if event is favorited
   */
  const isFavorite = useCallback(
    (eventId: number): boolean => {
      const numericEventId = Number(eventId)

      // Check for pending optimistic updates
      const optimisticUpdate = optimisticUpdatesRef.current.get(numericEventId)
      if (optimisticUpdate) {
        return optimisticUpdate.action === "add"
      }

      return favoriteIds.has(numericEventId)
    },
    [favoriteIds],
  )

  /**
   * Refresh favorites from server
   */
  const refreshFavorites = useCallback(async (): Promise<void> => {
    await loadFavorites()
  }, [loadFavorites])

  /**
   * Clear favorites (local state only)
   */
  const clearFavorites = useCallback((): void => {
    setFavorites([])
    setFavoriteIds(new Set())
    setIsError(false)
    setError(null)
    optimisticUpdatesRef.current.clear()
  }, [])

  // Load favorites on mount
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return {
    favorites,
    favoriteIds,
    isLoading,
    isError,
    error,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    clearFavorites,
  }
}
