"use server"

import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { UserRepository, type UserEntity } from "@/lib/backend/repositories/user-repository"
import { FavoritesRepository } from "@/lib/backend/repositories/favorites-repository"
import { analyticsService } from "@/lib/backend/services/analytics-service"
import { cacheService } from "@/lib/backend/services/cache-service"
import { createServerSupabaseClient } from "@/lib/api/supabase-api"

// Initialize repositories
const userRepository = new UserRepository()
const favoritesRepository = new FavoritesRepository()

// Validation schemas
const UserUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      name: z.string().min(1).max(255),
    })
    .optional(),
  preferences: z
    .object({
      favoriteCategories: z.array(z.string()).max(20).optional(),
      pricePreference: z.enum(["free", "low", "medium", "high", "any"]).optional(),
      timePreference: z.enum(["morning", "afternoon", "evening", "night", "any"]).optional(),
      radiusPreference: z.number().min(1).max(100).optional(),
      notificationSettings: z
        .object({
          email: z.boolean().optional(),
          push: z.boolean().optional(),
          sms: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
})

const FavoriteActionSchema = z.object({
  eventId: z.number().positive(),
  action: z.enum(["add", "remove"]),
})

export interface UserActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserActionResult<UserEntity>> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Try cache first
    const cacheKey = `user:profile:${user.id}`
    const cachedUser = await cacheService.get<UserEntity>(cacheKey, {
      ttl: 300, // 5 minutes
      namespace: "users",
    })

    if (cachedUser) {
      return {
        success: true,
        data: cachedUser,
      }
    }

    // Get from database
    const result = await userRepository.findById(user.id)

    if (result.error) {
      // User doesn't exist in our database, create them
      const newUser = await userRepository.create({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url,
        is_active: true,
      })

      if (newUser.error) {
        return {
          success: false,
          error: newUser.error,
        }
      }

      // Cache the new user
      await cacheService.set(cacheKey, newUser.data!, {
        ttl: 300,
        namespace: "users",
      })

      return {
        success: true,
        data: newUser.data!,
      }
    }

    // Cache the existing user
    await cacheService.set(cacheKey, result.data!, {
      ttl: 300,
      namespace: "users",
    })

    // Update last login
    await userRepository.updateLastLogin(user.id)

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    logger.error(
      "Error getting current user",
      {
        component: "user-actions",
        action: "get_current_user_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to get user profile",
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  updates: z.infer<typeof UserUpdateSchema>,
): Promise<UserActionResult<UserEntity>> {
  try {
    // Validate input
    const validationResult = UserUpdateSchema.safeParse(updates)
    if (!validationResult.success) {
      return {
        success: false,
        error: "Invalid update data",
      }
    }

    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    logger.info("Updating user profile", {
      component: "user-actions",
      action: "update_profile",
      metadata: { userId: user.id, updates: Object.keys(validationResult.data) },
    })

    // Prepare update data
    const updateData: Partial<UserEntity> = {}

    if (validationResult.data.name) {
      updateData.name = validationResult.data.name
    }

    if (validationResult.data.location) {
      updateData.location_lat = validationResult.data.location.lat
      updateData.location_lng = validationResult.data.location.lng
      updateData.location_name = validationResult.data.location.name
    }

    if (validationResult.data.preferences) {
      updateData.preferences = validationResult.data.preferences
    }

    // Update in database
    const result = await userRepository.update(user.id, updateData)

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Update user preferences if provided
    if (validationResult.data.preferences) {
      await userRepository.updateUserPreferences(user.id, validationResult.data.preferences)
    }

    // Clear cache
    await cacheService.delete(`user:profile:${user.id}`, { namespace: "users" })

    logger.info("User profile updated successfully", {
      component: "user-actions",
      action: "update_profile_success",
      metadata: { userId: user.id },
    })

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    logger.error(
      "Error updating user profile",
      {
        component: "user-actions",
        action: "update_profile_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to update profile",
    }
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserActionResult> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Try cache first
    const cacheKey = `user:preferences:${user.id}`
    const cachedPreferences = await cacheService.get(cacheKey, {
      ttl: 600, // 10 minutes
      namespace: "users",
    })

    if (cachedPreferences) {
      return {
        success: true,
        data: cachedPreferences,
      }
    }

    // Get from database
    const result = await userRepository.getUserPreferences(user.id)

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Cache the preferences
    await cacheService.set(cacheKey, result.data!, {
      ttl: 600,
      namespace: "users",
    })

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    logger.error(
      "Error getting user preferences",
      {
        component: "user-actions",
        action: "get_preferences_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to get preferences",
    }
  }
}

/**
 * Toggle event favorite status
 */
export async function toggleEventFavorite(
  eventId: number,
  action: "add" | "remove",
): Promise<UserActionResult<boolean>> {
  try {
    // Validate input
    const validationResult = FavoriteActionSchema.safeParse({ eventId, action })
    if (!validationResult.success) {
      return {
        success: false,
        error: "Invalid favorite action",
      }
    }

    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    logger.info("Toggling event favorite", {
      component: "user-actions",
      action: "toggle_favorite",
      metadata: { userId: user.id, eventId, favoriteAction: action },
    })

    let result

    if (action === "add") {
      result = await favoritesRepository.addFavorite(user.id, eventId)

      // Track analytics
      await analyticsService.trackEvent({
        event_id: eventId,
        user_id: user.id,
        action: "favorite",
        metadata: { action: "add" },
      })
    } else {
      result = await favoritesRepository.removeFavorite(user.id, eventId)

      // Track analytics
      await analyticsService.trackEvent({
        event_id: eventId,
        user_id: user.id,
        action: "favorite",
        metadata: { action: "remove" },
      })
    }

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Clear user favorites cache
    await cacheService.delete(`user:favorites:${user.id}`, { namespace: "users" })

    logger.info("Event favorite toggled successfully", {
      component: "user-actions",
      action: "toggle_favorite_success",
      metadata: { userId: user.id, eventId, favoriteAction: action },
    })

    return {
      success: true,
      data: true,
    }
  } catch (error) {
    logger.error(
      "Error toggling event favorite",
      {
        component: "user-actions",
        action: "toggle_favorite_error",
        metadata: { eventId, action },
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to update favorite",
    }
  }
}

/**
 * Get user's favorite events
 */
export async function getUserFavorites(limit = 50): Promise<UserActionResult> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Try cache first
    const cacheKey = `user:favorites:${user.id}:${limit}`
    const cachedFavorites = await cacheService.get(cacheKey, {
      ttl: 300, // 5 minutes
      namespace: "users",
    })

    if (cachedFavorites) {
      return {
        success: true,
        data: cachedFavorites,
      }
    }

    // Get from database
    const result = await favoritesRepository.getUserFavorites(user.id, limit)

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Cache the favorites
    await cacheService.set(cacheKey, result.data, {
      ttl: 300,
      namespace: "users",
    })

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    logger.error(
      "Error getting user favorites",
      {
        component: "user-actions",
        action: "get_favorites_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to get favorites",
    }
  }
}

/**
 * Check if event is favorited by user
 */
export async function isEventFavorited(eventId: number): Promise<UserActionResult<boolean>> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: true,
        data: false, // Not authenticated = not favorited
      }
    }

    // Try cache first
    const cacheKey = `user:favorite_check:${user.id}:${eventId}`
    const cachedResult = await cacheService.get<boolean>(cacheKey, {
      ttl: 300, // 5 minutes
      namespace: "users",
    })

    if (cachedResult !== null) {
      return {
        success: true,
        data: cachedResult,
      }
    }

    // Check database
    const result = await favoritesRepository.isFavorited(user.id, eventId)

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Cache the result
    await cacheService.set(cacheKey, result.data!, {
      ttl: 300,
      namespace: "users",
    })

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    logger.error(
      "Error checking if event is favorited",
      {
        component: "user-actions",
        action: "is_favorited_error",
        metadata: { eventId },
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to check favorite status",
    }
  }
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(): Promise<UserActionResult> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Try cache first
    const cacheKey = `user:analytics:${user.id}`
    const cachedAnalytics = await cacheService.get(cacheKey, {
      ttl: 1800, // 30 minutes
      namespace: "users",
    })

    if (cachedAnalytics) {
      return {
        success: true,
        data: cachedAnalytics,
      }
    }

    // Get from analytics service
    const analytics = await analyticsService.getUserAnalytics(user.id)

    // Cache the analytics
    await cacheService.set(cacheKey, analytics, {
      ttl: 1800,
      namespace: "users",
    })

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    logger.error(
      "Error getting user analytics",
      {
        component: "user-actions",
        action: "get_analytics_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to get analytics",
    }
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(): Promise<UserActionResult<boolean>> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    logger.warn("User account deletion requested", {
      component: "user-actions",
      action: "delete_account",
      metadata: { userId: user.id },
    })

    // Soft delete - mark as inactive
    const result = await userRepository.update(user.id, {
      is_active: false,
      email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
    })

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Clear all user caches
    await cacheService.clearNamespace(`users:${user.id}`)

    // Sign out user
    await supabase.auth.signOut()

    logger.info("User account deleted successfully", {
      component: "user-actions",
      action: "delete_account_success",
      metadata: { userId: user.id },
    })

    return {
      success: true,
      data: true,
    }
  } catch (error) {
    logger.error(
      "Error deleting user account",
      {
        component: "user-actions",
        action: "delete_account_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return {
      success: false,
      error: "Failed to delete account",
    }
  }
}
