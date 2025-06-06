import { createClient, SupabaseClient, AuthError, PostgrestError } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { cookies } from "next/headers"
import { logger } from "@/lib/utils/logger"

// Function to create a Supabase client for server-side operations
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  })
}

// Create Supabase client for client-side operations (default export)
const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// User interface
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

// --- Private Error Handling Helper Functions ---

/**
 * Handles errors from Supabase client operations.
 * @param error The error object from Supabase (AuthError or PostgrestError).
 * @param operationContext A string describing the operation context for logging.
 * @returns An error object { error: string } if an error occurred, otherwise null.
 */
function _handleSupabaseClientError(
  error: AuthError | PostgrestError | null,
  operationContext: string,
): { error: string } | null {
  if (error) {
    const errorMessage = error.message
    logger.error(`Supabase client error during ${operationContext}`, {
      component: 'SupabaseAPI',
      action: 'handleClientError',
      metadata: { operationContext, errorMessage }
    }, error)
    return { error: errorMessage }
  }
  return null
}

/**
 * Handles errors caught in generic catch blocks.
 * @param caughtError The error caught.
 * @param operationDescription A string describing the operation for logging and default error message.
 * @returns An error object { error: string }.
 */
function _handleGenericCatchError(
  caughtError: unknown,
  operationDescription: string,
): { error: string } {
  const baseMessage = `An error occurred during ${operationDescription}`
  let detailedMessage: string

  if (caughtError instanceof Error && caughtError.message) {
    detailedMessage = caughtError.message
  } else if (typeof caughtError === 'string' && caughtError) {
    detailedMessage = caughtError
  } else {
    detailedMessage = baseMessage // Fallback if no specific message can be extracted
  }

  if (caughtError instanceof Error) {
    console.error(`${baseMessage}. Details: ${detailedMessage}`, caughtError)
  } else {
    console.error(`${baseMessage}. Details: ${detailedMessage}`)
  }

  return { error: detailedMessage }
}

// --- Auth Functions ---

// Function to sign up a new user
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    const clientError = _handleSupabaseClientError(error, "user sign up")
    if (clientError) {
      return { user: null, ...clientError }
    }

    if (!data.user) {
      console.error("User object not found after sign up attempt.")
      return { user: null, error: "User not created" }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
      },
      error: null,
    }
  } catch (error: unknown) {
    const catchResponse = _handleGenericCatchError(error, "user sign up")
    return { user: null, ...catchResponse }
  }
}

// Function to sign in a user
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    const clientError = _handleSupabaseClientError(error, "user sign in")
    if (clientError) {
      return { user: null, ...clientError }
    }

    if (!data.user) {
      console.error("User object not found after sign in attempt.")
      return { user: null, error: "User not found" }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
      },
      error: null,
    }
  } catch (error: unknown) {
    const catchResponse = _handleGenericCatchError(error, "user sign in")
    return { user: null, ...catchResponse }
  }
}

// Function to sign out a user
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    const clientError = _handleSupabaseClientError(error, "user sign out")
    if (clientError) {
      return clientError
    }

    return { error: null }
  } catch (error: unknown) {
    return _handleGenericCatchError(error, "user sign out")
  }
}

// Function to get the current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      return null
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
      avatar_url: data.user.user_metadata?.avatar_url,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Function to update user profile
export async function updateUserProfile(
  profile: { name?: string; avatar_url?: string },
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: profile,
    })

    const clientError = _handleSupabaseClientError(error, "updating user profile")
    if (clientError) {
      return { user: null, ...clientError }
    }

    if (!data.user) {
      console.error("User object not found after profile update attempt.")
      return { user: null, error: "User not found post-update" }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
      },
      error: null,
    }
  } catch (error: unknown) {
    const catchResponse = _handleGenericCatchError(error, "updating user profile")
    return { user: null, ...catchResponse }
  }
}

// --- Favorite Event Functions ---

// Function to save a favorite event
export async function saveFavoriteEvent(eventId: number): Promise<{ error: string | null }> {
  try {
    const supabaseServer = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

    const authError = _handleSupabaseClientError(userError, "getting user for saving favorite")
    if (authError) {
      return authError
    }
    if (!user) {
      console.error("User not authenticated for saving favorite.")
      return { error: "User not authenticated" }
    }

    const { error: insertError } = await supabaseServer.from("favorites").insert([{ user_id: user.id, event_id: eventId }])

    const clientInsertError = _handleSupabaseClientError(insertError, "saving favorite event to database")
    if (clientInsertError) {
      return clientInsertError
    }

    return { error: null }
  } catch (error: unknown) {
    return _handleGenericCatchError(error, "saving favorite event")
  }
}

// Function to remove a favorite event
export async function removeFavoriteEvent(eventId: number): Promise<{ error: string | null }> {
  try {
    const supabaseServer = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

    const authError = _handleSupabaseClientError(userError, "getting user for removing favorite")
    if (authError) {
      return authError
    }
    if (!user) {
      console.error("User not authenticated for removing favorite.")
      return { error: "User not authenticated" }
    }

    const { error: deleteError } = await supabaseServer.from("favorites").delete().match({ user_id: user.id, event_id: eventId })

    const clientDeleteError = _handleSupabaseClientError(deleteError, "removing favorite event from database")
    if (clientDeleteError) {
      return clientDeleteError
    }

    return { error: null }
  } catch (error: unknown) {
    return _handleGenericCatchError(error, "removing favorite event")
  }
}

// Function to get favorite events
export async function getFavoriteEvents(): Promise<{ eventIds: number[]; error: string | null }> {
  try {
    const supabaseServer = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

    const authError = _handleSupabaseClientError(userError, "getting user for fetching favorites")
    if (authError) {
      return { eventIds: [], ...authError }
    }
    if (!user) {
      console.error("User not authenticated for fetching favorites.")
      return { eventIds: [], error: "User not authenticated" }
    }

    const { data, error: selectError } = await supabaseServer.from("favorites").select("event_id").eq("user_id", user.id)

    const clientSelectError = _handleSupabaseClientError(selectError, "fetching favorite events from database")
    if (clientSelectError) {
      return { eventIds: [], ...clientSelectError }
    }

    return { eventIds: data?.map((item) => item.event_id) || [], error: null }
  } catch (error: unknown) {
    const catchResponse = _handleGenericCatchError(error, "fetching favorite events")
    return { eventIds: [], ...catchResponse }
  }
}

export default supabase
