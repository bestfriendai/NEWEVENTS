"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ensureUserSession, getSupabaseClient } from "./anonymous-auth"
import { logger } from "@/lib/utils/logger"

interface AuthContextType {
  userId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isSupabaseAuth: boolean
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  isLoading: true,
  isAuthenticated: false,
  isSupabaseAuth: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await ensureUserSession()
        setUserId(session.userId)
        setIsSupabaseAuth(session.isSupabase)

        logger.debug("Auth initialized", {
          component: "auth-provider",
          action: "auth_initialized",
          isSupabase: session.isSupabase,
        })
      } catch (error) {
        logger.error(
          "Error initializing auth",
          {
            component: "auth-provider",
            action: "init_auth_error",
          },
          error instanceof Error ? error : new Error(String(error)),
        )
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener only if Supabase is available
    const supabase = getSupabaseClient()
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setUserId(session.user.id)
          setIsSupabaseAuth(true)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const value = {
    userId,
    isLoading,
    isAuthenticated: !!userId,
    isSupabaseAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
