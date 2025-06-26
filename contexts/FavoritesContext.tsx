"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { getSupabaseClient } from "@/lib/auth/anonymous-auth"
import { useAuth } from "@/lib/auth/auth-provider"
import { toast } from "sonner"

interface FavoritesContextType {
  favorites: string[]
  isLoading: boolean
  addFavorite: (eventId: string) => Promise<void>
  removeFavorite: (eventId: string) => Promise<void>
  isFavorite: (eventId: string) => boolean
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { userId, isAuthenticated } = useAuth()

  // Load favorites from database on mount and when user changes
  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setFavorites([])
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('event_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Error loading favorites:', error)
        toast.error('Failed to load favorites')
      } else {
        setFavorites(data?.map(f => f.event_id.toString()) || [])
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, isAuthenticated])

  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  const addFavorite = useCallback(async (eventId: string) => {
    if (!isAuthenticated || !userId) {
      toast.error('Please sign in to save favorites')
      return
    }

    // Optimistically update UI
    setFavorites(prev => [...prev.filter(id => id !== eventId), eventId])

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          event_id: parseInt(eventId)
        })

      if (error) {
        // Revert optimistic update
        setFavorites(prev => prev.filter(id => id !== eventId))
        
        if (error.code === '23505') {
          // Already favorited
          toast.info('Already in favorites')
        } else {
          throw error
        }
      } else {
        toast.success('Added to favorites')
      }
    } catch (error) {
      console.error('Error adding favorite:', error)
      toast.error('Failed to add to favorites')
      // Revert optimistic update
      setFavorites(prev => prev.filter(id => id !== eventId))
    }
  }, [userId, isAuthenticated])

  const removeFavorite = useCallback(async (eventId: string) => {
    if (!isAuthenticated || !userId) {
      return
    }

    // Optimistically update UI
    setFavorites(prev => prev.filter(id => id !== eventId))

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', parseInt(eventId))

      if (error) {
        // Revert optimistic update
        setFavorites(prev => [...prev, eventId])
        throw error
      } else {
        toast.success('Removed from favorites')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast.error('Failed to remove from favorites')
      // Revert optimistic update
      setFavorites(prev => [...prev, eventId])
    }
  }, [userId, isAuthenticated])

  const isFavorite = useCallback(
    (eventId: string) => {
      return favorites.includes(eventId)
    },
    [favorites],
  )

  const value = {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}

// Custom hook for toggling favorites
export function useFavoriteToggle() {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()

  const toggleFavorite = useCallback(
    async (eventId: string) => {
      if (isFavorite(eventId)) {
        await removeFavorite(eventId)
      } else {
        await addFavorite(eventId)
      }
    },
    [addFavorite, removeFavorite, isFavorite],
  )

  return { toggleFavorite, isFavorite }
}