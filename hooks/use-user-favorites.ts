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
  isAuthenticated: boolean

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
        // Check if it's an authentication error
        if (result.error?.includes("not authenticated") || result.error?.includes("User not found")) {
          logger.info("User not authenticated for favorites", {
            component: "useUserFavorites",
            action: "load_favorites_not_authenticated",
          })
          setIsAuthenticated(false)
          setFavorites([])
          setFavoriteIds(new Set())
          return // Don't treat this as an error
        }

        throw new Error(result.error || "Failed to load favorites")
      }

      setIsAuthenticated(true)
      const favoritesData = result.data || []

      // Handle the case where favorites data might be in different formats
      let favoriteEvents: EventDetailProps[] = []

      if (Array.isArray(favoritesData)) {
        favoriteEvents = favoritesData
          .map((fav: any) => {
            // Handle different data structures
            if (fav.event) {
              return fav.event
            } else if (fav.id && fav.title) {
              return fav // Direct event object
            }
            return null
          })
          .filter(Boolean)
      }

      const favoriteEventIds = new Set(
        favoriteEvents
          .map((event: EventDetailProps) => {
            // Handle both string and number IDs
            const id =
              typeof event.id === "string" ? Number.parseInt(event.id.replace(/^\w+_/, ""), 10) : Number(event.id)
            return isNaN(id) ? 0 : id
          })
          .filter((id) => id > 0),
      )

      setFavorites(favoriteEvents)
      setFavoriteIds(favoriteEventIds)

      logger.info("User favorites loaded", {
        component: "useUserFavorites",
        action: "load_favorites_success",
        metadata: { count: favoriteEvents.length, isAuthenticated: true },
      })
    } catch (error) {
      logger.error(
        "Error loading user favorites",
        {
          component: "useUserFavorites",
          action: "load_favorites_error",
          metadata: {
            errorMessage: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : typeof error,
          },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      setIsError(true)
      setError(error instanceof Error ? error.message : "Failed to load favorites")
      setIsAuthenticated(false)
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
        // Check if user is authenticated first
        if (!isAuthenticated) {
          logger.warn("Attempted to toggle favorite without authentication", {
            component: "useUserFavorites",
            action: "toggle_favorite_not_authenticated",
            metadata: { eventId },
          })
          return false
        }

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
          setFavorites((prev) =>
            prev.filter((event) => {
              const id =
                typeof event.id === "string" ? Number.parseInt(event.id.replace(/^\w+_/, ""), 10) : Number(event.id)
              return id !== numericEventId
            }),
          )
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
              setFavorites((prev) =>
                prev.filter((event) => {
                  const id =
                    typeof event.id === "string" ? Number.parseInt(event.id.replace(/^\w+_/, ""), 10) : Number(event.id)
                  return id !== numericEventId
                }),
              )
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
    [favoriteIds, isAuthenticated],
  )

  /**
   * Check if event is favorited
   */
  const isFavorite = useCallback(
    (eventId: number): boolean => {
      if (!isAuthenticated) return false

      const numericEventId = Number(eventId)

      // Check for pending optimistic updates
      const optimisticUpdate = optimisticUpdatesRef.current.get(numericEventId)
      if (optimisticUpdate) {
        return optimisticUpdate.action === "add"
      }

      return favoriteIds.has(numericEventId)
    },
    [favoriteIds, isAuthenticated],
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
    setIsAuthenticated(false)
    optimisticUpdatesRef.current.clear()
  }, [])

  // Load favorites on mount, but don't fail if user is not authenticated
  useEffect(() => {
    loadFavorites().catch(() => {
      // Silently handle the error as it's already logged in loadFavorites
    })
  }, [loadFavorites])

  return {
    favorites,
    favoriteIds,
    isLoading,
    isError,
    error,
    isAuthenticated,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    clearFavorites,
  }
}
