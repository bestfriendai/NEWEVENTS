"use server"

import { z } from "zod"
import { logger } from "@/lib/utils/logger"

// Mock user repository for development
class MockUserRepository {
  async findById(id: string) {
    return {
      data: {
        id,
        email: "user@example.com",
        name: "Test User",
        avatar_url: "/avatar-1.png",
        is_active: true,
        location_lat: 40.7128,
        location_lng: -74.006,
        location_name: "New York, NY",
        preferences: {
          favoriteCategories: ["Concerts", "Sports"],
          pricePreference: "medium" as const,
          timePreference: "evening" as const,
          radiusPreference: 25,
          notificationSettings: {
            email: true,
            push: true,
            sms: false,
          },
        },
      },
      error: null,
    }
  }

  async create(userData: any) {
    return {
      data: userData,
      error: null,
    }
  }

  async update(id: string, updates: any) {
    return {
      data: { id, ...updates },
      error: null,
    }
  }

  async updateLastLogin(id: string) {
    return { error: null }
  }

  async getUserPreferences(id: string) {
    return {
      data: {
        favoriteCategories: ["Concerts", "Sports"],
        pricePreference: "medium" as const,
        timePreference: "evening" as const,
        radiusPreference: 25,
        notificationSettings: {
          email: true,
          push: true,
          sms: false,
        },
      },
      error: null,
    }
  }

  async updateUserPreferences(id: string, preferences: any) {
    return { error: null }
  }
}

// Mock favorites repository
class MockFavoritesRepository {
  private favorites: Array<{ userId: string; eventId: number; event: any }> = []

  async addFavorite(userId: string, eventId: number) {
    const existing = this.favorites.find((f) => f.userId === userId && f.eventId === eventId)
    if (!existing) {
      this.favorites.push({
        userId,
        eventId,
        event: {
          id: eventId,
          title: `Event ${eventId}`,
          description: "Sample event description",
          category: "Concerts",
          date: "2024-02-15",
          time: "7:00 PM",
          location: "Sample Venue",
          address: "123 Main St, City, State",
          price: "$50",
          image: "/event-1.png",
          organizer: {
            name: "Event Organizer",
            avatar: "/avatar-1.png",
          },
          attendees: 150,
          isFavorite: true,
          coordinates: { lat: 40.7128, lng: -74.006 },
          ticketLinks: [],
        },
      })
    }
    return { data: true, error: null }
  }

  async removeFavorite(userId: string, eventId: number) {
    this.favorites = this.favorites.filter((f) => !(f.userId === userId && f.eventId === eventId))
    return { data: true, error: null }
  }

  async getUserFavorites(userId: string, limit = 50) {
    const userFavorites = this.favorites.filter((f) => f.userId === userId).slice(0, limit)
    return {
      data: userFavorites.map((f) => f.event),
      error: null,
    }
  }

  async isFavorited(userId: string, eventId: number) {
    const exists = this.favorites.some((f) => f.userId === userId && f.eventId === eventId)
    return { data: exists, error: null }
  }
}

// Mock analytics service
class MockAnalyticsService {
  async trackEvent(data: any) {
    logger.debug("Analytics event tracked", data)
    return { success: true }
  }

  async getUserAnalytics(userId: string) {
    return {
      totalEvents: 25,
      favoriteEvents: 8,
      categoriesViewed: ["Concerts", "Sports", "Theater"],
      averagePrice: 75,
      preferredTime: "evening",
      topVenues: ["Madison Square Garden", "Central Park", "Brooklyn Bowl"],
    }
  }
}

// Mock cache service
class MockCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async get<T>(key: string, options?: { ttl?: number; namespace?: string }): Promise<T | null> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key
    const cached = this.cache.get(fullKey)

    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(fullKey)
      return null
    }

    return cached.data as T
  }

  async set(key: string, data: any, options?: { ttl?: number; namespace?: string }): Promise<void> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key
    const ttl = (options?.ttl || 300) * 1000 // Convert to milliseconds

    this.cache.set(fullKey, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  async delete(key: string, options?: { namespace?: string }): Promise<void> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key
    this.cache.delete(fullKey)
  }

  async clearNamespace(namespace: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.cache.delete(key)
      }
    }
  }
}

// Mock Supabase client
function createMockSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "mock-user-id",
            email: "user@example.com",
            user_metadata: {
              name: "Test User",
              avatar_url: "/avatar-1.png",
            },
          },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
  }
}

// Initialize mock services
const userRepository = new MockUserRepository()
const favoritesRepository = new MockFavoritesRepository()
const analyticsService = new MockAnalyticsService()
const cacheService = new MockCacheService()

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

export interface UserEntity {
  id: string
  email: string
  name: string
  avatar_url?: string
  is_active: boolean
  location_lat?: number
  location_lng?: number
  location_name?: string
  preferences?: any
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserActionResult<UserEntity>> {
  try {
    const supabase = createMockSupabaseClient()
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
    logger.error("Error getting current user", {
      component: "user-actions",
      action: "get_current_user_error",
      error: error instanceof Error ? error.message : String(error),
    })

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

    const supabase = createMockSupabaseClient()
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
    logger.error("Error updating user profile", {
      component: "user-actions",
      action: "update_profile_error",
      error: error instanceof Error ? error.message : String(error),
    })

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
    const supabase = createMockSupabaseClient()
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
    logger.error("Error getting user preferences", {
      component: "user-actions",
      action: "get_preferences_error",
      error: error instanceof Error ? error.message : String(error),
    })

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

    const supabase = createMockSupabaseClient()
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
    logger.error("Error toggling event favorite", {
      component: "user-actions",
      action: "toggle_favorite_error",
      metadata: { eventId, action },
      error: error instanceof Error ? error.message : String(error),
    })

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
    const supabase = createMockSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.info("User not authenticated for favorites", {
        component: "user-actions",
        action: "get_favorites_not_authenticated",
      })
      return {
        success: true,
        data: [], // Return empty array instead of error for unauthenticated users
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
      logger.warn("Error getting favorites from repository", {
        component: "user-actions",
        action: "get_favorites_repository_error",
        metadata: { error: result.error },
      })
      return {
        success: true,
        data: [], // Return empty array instead of error
      }
    }

    const favoritesData = result.data || []

    // Cache the favorites
    await cacheService.set(cacheKey, favoritesData, {
      ttl: 300,
      namespace: "users",
    })

    logger.info("User favorites loaded", {
      component: "user-actions",
      action: "get_favorites_success",
      metadata: { count: favoritesData.length, userId: user.id },
    })

    return {
      success: true,
      data: favoritesData,
    }
  } catch (error) {
    logger.error("Error getting user favorites", {
      component: "user-actions",
      action: "get_favorites_error",
      error: error instanceof Error ? error.message : String(error),
    })

    // Return empty array instead of error to prevent UI crashes
    return {
      success: true,
      data: [],
    }
  }
}

/**
 * Check if event is favorited by user
 */
export async function isEventFavorited(eventId: number): Promise<UserActionResult<boolean>> {
  try {
    const supabase = createMockSupabaseClient()
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
        success: true,
        data: false, // Default to not favorited on error
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
    logger.error("Error checking if event is favorited", {
      component: "user-actions",
      action: "is_favorited_error",
      metadata: { eventId },
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      success: true,
      data: false, // Default to not favorited on error
    }
  }
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(): Promise<UserActionResult> {
  try {
    const supabase = createMockSupabaseClient()
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
    logger.error("Error getting user analytics", {
      component: "user-actions",
      action: "get_analytics_error",
      error: error instanceof Error ? error.message : String(error),
    })

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
    const supabase = createMockSupabaseClient()
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
    logger.error("Error deleting user account", {
      component: "user-actions",
      action: "delete_account_error",
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      success: false,
      error: "Failed to delete account",
    }
  }
}
