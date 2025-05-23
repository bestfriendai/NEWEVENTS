import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env"

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// User interface
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

// Function to sign up a new user
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
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
    return { user: null, error: (error instanceof Error ? error.message : String(error)) || "An error occurred during sign up" }
  }
}

// Function to sign in a user
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
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
    return { user: null, error: (error instanceof Error ? error.message : String(error)) || "An error occurred during sign in" }
  }
}

// Function to sign out a user
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : String(error)) || "An error occurred during sign out" }
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
  userId: string,
  profile: { name?: string; avatar_url?: string },
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: profile,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
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
    return { user: null, error: (error instanceof Error ? error.message : String(error)) || "An error occurred while updating profile" }
  }
}

// Function to save a favorite event
export async function saveFavoriteEvent(userId: string, eventId: number): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from("favorites").insert([{ user_id: userId, event_id: eventId }])

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : String(error)) || "An error occurred while saving favorite" }
  }
}

// Function to remove a favorite event
export async function removeFavoriteEvent(userId: string, eventId: number): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from("favorites").delete().match({ user_id: userId, event_id: eventId })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : String(error)) || "An error occurred while removing favorite" }
  }
}

// Function to get favorite events
export async function getFavoriteEvents(userId: string): Promise<{ eventIds: number[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from("favorites").select("event_id").eq("user_id", userId)

    if (error) {
      return { eventIds: [], error: error.message }
    }

    return { eventIds: data.map((item) => item.event_id), error: null }
  } catch (error: unknown) {
    return { eventIds: [], error: (error instanceof Error ? error.message : String(error)) || "An error occurred while getting favorites" }
  }
}

export default supabase
