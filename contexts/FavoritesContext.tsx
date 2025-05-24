"use client"

import { createContext, useState, useContext, ReactNode, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export interface FavoriteEvent {
  id: number
  userId: string
  eventId: number
  createdAt: string
}

interface FavoritesContextType {
  favoriteEventIds: Set<number>
  isLoading: boolean
  error: string | null
  toggleFavorite: (eventId: number) => Promise<void>
  isFavorite: (eventId: number) => boolean
  loadFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteEventIds, setFavoriteEventIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load favorites from backend on mount
  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement Supabase integration
      // For now, load from localStorage as fallback
      const stored = localStorage.getItem('favoriteEvents')
      if (stored) {
        const favoriteIds = JSON.parse(stored) as number[]
        setFavoriteEventIds(new Set(favoriteIds))
        
        logger.info("Loaded favorites from localStorage", {
          component: "FavoritesContext",
          action: "load_favorites_localStorage",
          metadata: { count: favoriteIds.length }
        })
      }

      // TODO: Replace with actual Supabase call
      // const { data, error } = await supabase
      //   .from('favorites')
      //   .select('eventId')
      //   .eq('userId', user.id)
      // 
      // if (error) throw error
      // setFavoriteEventIds(new Set(data.map(f => f.eventId)))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load favorites"
      setError(errorMessage)
      
      logger.error("Failed to load favorites", {
        component: "FavoritesContext",
        action: "load_favorites_error"
      }, err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async (eventId: number): Promise<void> => {
    const wasAlreadyFavorite = favoriteEventIds.has(eventId)
    
    // Optimistic update
    const newFavorites = new Set(favoriteEventIds)
    if (wasAlreadyFavorite) {
      newFavorites.delete(eventId)
    } else {
      newFavorites.add(eventId)
    }
    setFavoriteEventIds(newFavorites)

    try {
      // Update localStorage immediately
      localStorage.setItem('favoriteEvents', JSON.stringify(Array.from(newFavorites)))

      // TODO: Implement Supabase backend call
      // if (wasAlreadyFavorite) {
      //   const { error } = await supabase
      //     .from('favorites')
      //     .delete()
      //     .eq('userId', user.id)
      //     .eq('eventId', eventId)
      //   
      //   if (error) throw error
      // } else {
      //   const { error } = await supabase
      //     .from('favorites')
      //     .insert({ userId: user.id, eventId })
      //   
      //   if (error) throw error
      // }

      logger.info("Favorite toggled successfully", {
        component: "FavoritesContext",
        action: "toggle_favorite_success",
        metadata: { eventId, wasAlreadyFavorite, newState: !wasAlreadyFavorite }
      })

    } catch (err) {
      // Revert optimistic update on error
      setFavoriteEventIds(favoriteEventIds)
      
      const errorMessage = err instanceof Error ? err.message : "Failed to update favorite"
      setError(errorMessage)
      
      logger.error("Failed to toggle favorite", {
        component: "FavoritesContext",
        action: "toggle_favorite_error",
        metadata: { eventId, wasAlreadyFavorite }
      }, err instanceof Error ? err : new Error(errorMessage))

      // Show user-friendly error notification
      // TODO: Integrate with toast system
      console.error("Failed to update favorite:", errorMessage)
    }
  }

  const isFavorite = (eventId: number): boolean => {
    return favoriteEventIds.has(eventId)
  }

  const value: FavoritesContextType = {
    favoriteEventIds,
    isLoading,
    error,
    toggleFavorite,
    isFavorite,
    loadFavorites
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavoritesContext must be used within a FavoritesProvider")
  }
  return context
}

// Hook for easy favorite management in components
export const useFavoriteToggle = (eventId: number) => {
  const { toggleFavorite, isFavorite, isLoading } = useFavoritesContext()
  
  return {
    isFavorite: isFavorite(eventId),
    toggleFavorite: () => toggleFavorite(eventId),
    isLoading
  }
}
