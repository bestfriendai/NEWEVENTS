"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { logger } from "@/lib/utils/logger"

export interface UserFavorite {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventImage?: string
  addedAt: string
}

export function useUserFavorites() {
  const { userId, isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState<UserFavorite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = `dateai_favorites_${userId}`
      const storedFavorites = localStorage.getItem(storageKey)

      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites)
        setFavorites(Array.isArray(parsedFavorites) ? parsedFavorites : [])
      }
    } catch (error) {
      logger.error(
        "Error loading favorites from localStorage",
        {
          component: "use-user-favorites",
          action: "load_favorites_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: UserFavorite[]) => {
    if (!userId) return

    try {
      const storageKey = `dateai_favorites_${userId}`
      localStorage.setItem(storageKey, JSON.stringify(newFavorites))
      setFavorites(newFavorites)
    } catch (error) {
      logger.error(
        "Error saving favorites to localStorage",
        {
          component: "use-user-favorites",
          action: "save_favorites_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }

  const addFavorite = (event: {
    id: string
    title: string
    date: string
    location: string
    image?: string
  }) => {
    if (!userId) return

    const newFavorite: UserFavorite = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      eventImage: event.image,
      addedAt: new Date().toISOString(),
    }

    const updatedFavorites = [...favorites, newFavorite]
    saveFavorites(updatedFavorites)
  }

  const removeFavorite = (eventId: string) => {
    const updatedFavorites = favorites.filter((fav) => fav.eventId !== eventId)
    saveFavorites(updatedFavorites)
  }

  const isFavorite = (eventId: string) => {
    return favorites.some((fav) => fav.eventId === eventId)
  }

  const clearAllFavorites = () => {
    saveFavorites([])
  }

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearAllFavorites,
    isAuthenticated,
  }
}
