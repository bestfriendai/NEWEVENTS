"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface FavoritesContextType {
  favorites: string[]
  addFavorite: (eventId: string) => void
  removeFavorite: (eventId: string) => void
  isFavorite: (eventId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])

  const addFavorite = useCallback((eventId: string) => {
    setFavorites((prev) => [...prev.filter((id) => id !== eventId), eventId])
  }, [])

  const removeFavorite = useCallback((eventId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== eventId))
  }, [])

  const isFavorite = useCallback(
    (eventId: string) => {
      return favorites.includes(eventId)
    },
    [favorites],
  )

  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
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
