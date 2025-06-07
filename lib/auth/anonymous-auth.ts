import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

// Create a singleton Supabase client for client-side usage
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient && typeof window !== "undefined") {
    try {
      // Check if Supabase is properly configured
      if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        logger.warn("Supabase not configured, skipping client creation", {
          component: "anonymous-auth",
          action: "missing_config",
        })
        return null
      }

      supabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Prevent issues with URL-based auth
        },
      })
    } catch (error) {
      logger.error(
        "Failed to create Supabase client",
        {
          component: "anonymous-auth",
          action: "client_creation_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )
      return null
    }
  }
  return supabaseClient
}

/**
 * Generates a simple anonymous user ID for local storage
 */
function generateAnonymousUserId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `anon_${timestamp}_${randomPart}`
}

/**
 * Gets or creates an anonymous user ID stored in localStorage
 */
export function getAnonymousUserId(): string {
  if (typeof window === "undefined") return ""

  try {
    let userId = localStorage.getItem("dateai_anonymous_user_id")

    if (!userId) {
      userId = generateAnonymousUserId()
      localStorage.setItem("dateai_anonymous_user_id", userId)
      logger.debug("Created new anonymous user ID", {
        component: "anonymous-auth",
        action: "create_anonymous_id",
      })
    }

    return userId
  } catch (error) {
    logger.error(
      "Error managing anonymous user ID",
      {
        component: "anonymous-auth",
        action: "anonymous_id_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )
    // Fallback to session-based ID
    return generateAnonymousUserId()
  }
}

/**
 * Ensures the user has a session (either Supabase or anonymous)
 */
export async function ensureUserSession() {
  try {
    const supabase = getSupabaseClient()

    // If Supabase is available, try to use it
    if (supabase) {
      // Check if user already has a session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        logger.warn("Error getting Supabase session, falling back to anonymous", {
          component: "anonymous-auth",
          action: "session_error_fallback",
        })
        return { userId: getAnonymousUserId(), isSupabase: false }
      }

      if (session?.user) {
        logger.debug("User already has Supabase session", {
          component: "anonymous-auth",
          action: "existing_session",
        })
        return { userId: session.user.id, isSupabase: true }
      }

      // Try to create anonymous Supabase session
      try {
        const { data, error } = await supabase.auth.signInAnonymously()

        if (error) {
          logger.warn("Supabase anonymous auth failed, using local anonymous ID", {
            component: "anonymous-auth",
            action: "supabase_anonymous_failed",
          })
          return { userId: getAnonymousUserId(), isSupabase: false }
        }

        if (data.session?.user) {
          logger.debug("Created Supabase anonymous session", {
            component: "anonymous-auth",
            action: "supabase_anonymous_success",
          })
          return { userId: data.session.user.id, isSupabase: true }
        }
      } catch (authError) {
        logger.warn("Supabase auth error, falling back to local anonymous", {
          component: "anonymous-auth",
          action: "auth_error_fallback",
        })
      }
    }

    // Fallback to local anonymous ID
    const anonymousId = getAnonymousUserId()
    logger.debug("Using local anonymous user ID", {
      component: "anonymous-auth",
      action: "local_anonymous",
    })

    return { userId: anonymousId, isSupabase: false }
  } catch (error) {
    logger.error(
      "Unexpected error in ensureUserSession",
      {
        component: "anonymous-auth",
        action: "ensure_session_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    // Ultimate fallback
    return { userId: getAnonymousUserId(), isSupabase: false }
  }
}

/**
 * Gets the current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await ensureUserSession()
    return session.userId
  } catch (error) {
    logger.error(
      "Error getting current user ID",
      {
        component: "anonymous-auth",
        action: "get_user_id_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )
    return getAnonymousUserId()
  }
}
