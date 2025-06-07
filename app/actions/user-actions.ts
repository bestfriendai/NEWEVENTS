"use server"

import { z } from "zod"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger";

// Import your REAL repositories
import { 
    UserRepository as RealUserRepository,
    UserEntity as ImportedUserEntity, 
    UserPreferencesEntity 
} from '@/lib/backend/repositories/user-repository';
import { 
    FavoritesRepository as RealFavoritesRepository
} from '@/lib/backend/repositories/favorites-repository';

// Use the imported UserEntity as the primary UserEntity type for this file
export type UserEntity = ImportedUserEntity;

// Mock analytics service (kept as per plan)
class MockAnalyticsService {
  async trackEvent(data: any) {
    logger.debug("Analytics event tracked", data)
    return { success: true }
  }

  async getUserAnalytics(userId: string) {
    // This is a mock implementation
    return {
      totalEvents: 25,
      favoriteEvents: 8,
      categoriesViewed: ["Concerts", "Sports", "Theater"],
      averagePrice: 75,
      preferredTime: "evening",
      topVenues: ["Madison Square Garden", "Central Park", "Brooklyn Bowl"],
      userId, // Added to make it slightly more "real"
    }
  }
}

// Mock cache service (kept as per plan)
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
    this.cache.set(fullKey, { data, timestamp: Date.now(), ttl })
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

// Initialize REAL services (and kept mocks)
const userRepository = new RealUserRepository();
const favoritesRepository = new RealFavoritesRepository();
const analyticsService = new MockAnalyticsService(); // Kept as per plan
const cacheService = new MockCacheService(); // Kept as per plan

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
});

const FavoriteActionSchema = z.object({
  eventId: z.number().positive(),
  action: z.enum(["add", "remove"]),
});

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
    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const cacheKey = `user:profile:${user.id}`;
    const cachedUser = await cacheService.get<UserEntity>(cacheKey, { ttl: 300, namespace: "users" });

    if (cachedUser) {
      return { success: true, data: cachedUser };
    }

    const result = await userRepository.findById(user.id);

    if (result.error && result.error !== "Not found") { // Assuming "Not found" might be a string from repo
      const createData: Omit<UserEntity, "id" | "created_at" | "updated_at"> = {
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split("@")[0] || undefined,
        avatar_url: user.user_metadata?.avatar_url || undefined,
        is_active: true,
        location_lat: undefined,
        location_lng: undefined,
        location_name: undefined,
        preferences: undefined, // Default preferences can be set by DB or another call
        last_login: new Date().toISOString(),
      };
      const newUserResult = await userRepository.create(createData);

      if (newUserResult.error) {
        return { success: false, error: newUserResult.error };
      }
      if (newUserResult.data) {
        await cacheService.set(cacheKey, newUserResult.data, { ttl: 300, namespace: "users" });
        return { success: true, data: newUserResult.data };
      } else {
         return { success: false, error: "Failed to create or retrieve user after creation." };
      }
    } else if (result.data) {
      await cacheService.set(cacheKey, result.data, { ttl: 300, namespace: "users" });
      await userRepository.updateLastLogin(user.id);
      return { success: true, data: result.data };
    }
    
    return { success: false, error: result.error || "User not found and creation attempt failed." };

  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error getting current user", {
      component: "user-actions",
      action: "get_current_user_error",
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError 
    });
    return { success: false, error: "Failed to get user profile" };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  updates: z.infer<typeof UserUpdateSchema>,
): Promise<UserActionResult<UserEntity>> {
  try {
    const validationResult = UserUpdateSchema.safeParse(updates);
    if (!validationResult.success) {
      return { success: false, error: "Invalid update data: " + validationResult.error.format()._errors.join(', ') };
    }

    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    logger.info("Updating user profile", {
      component: "user-actions",
      action: "update_user_profile",
      userId: user.id,
      updates: validationResult.data,
    });

    const userUpdates: Partial<Omit<UserEntity, "id" | "created_at" | "updated_at">> = {};
    if (validationResult.data.name) userUpdates.name = validationResult.data.name;
    if (validationResult.data.location) {
      userUpdates.location_lat = validationResult.data.location.lat;
      userUpdates.location_lng = validationResult.data.location.lng;
      userUpdates.location_name = validationResult.data.location.name;
    }

    if (Object.keys(userUpdates).length > 0) {
      const userUpdateResult = await userRepository.update(user.id, userUpdates);
      if (userUpdateResult.error) {
        return { success: false, error: userUpdateResult.error };
      }
    }

    if (validationResult.data.preferences) {
      const prefsToUpdate: Partial<Omit<UserPreferencesEntity, "id" | "user_id" | "created_at" | "updated_at">> = {};
      if (validationResult.data.preferences.favoriteCategories) {
        prefsToUpdate.favorite_categories = validationResult.data.preferences.favoriteCategories;
      }
      if (validationResult.data.preferences.pricePreference) {
        prefsToUpdate.price_preference = validationResult.data.preferences.pricePreference;
      }
      if (validationResult.data.preferences.timePreference) {
        prefsToUpdate.time_preference = validationResult.data.preferences.timePreference;
      }
      if (validationResult.data.preferences.radiusPreference) {
        prefsToUpdate.radius_preference = validationResult.data.preferences.radiusPreference;
      }
      if (validationResult.data.preferences.notificationSettings) {
        prefsToUpdate.notification_settings = validationResult.data.preferences.notificationSettings;
      }
      
      if (Object.keys(prefsToUpdate).length > 0) {
        const prefUpdateResult = await userRepository.updateUserPreferences(user.id, prefsToUpdate);
        if (prefUpdateResult.error) {
            return { success: false, error: prefUpdateResult.error };
        }
      }
    }

    await cacheService.delete(`user:profile:${user.id}`, { namespace: "users" });
    const { data: updatedUser, error: findError } = await userRepository.findById(user.id);

    if (findError) {
      return { success: false, error: findError };
    }

    return { success: true, data: updatedUser! };
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error updating user profile", {
      component: "user-actions",
      action: "update_user_profile_error",
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserActionResult<UserPreferencesEntity>> {
  try {
    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { 
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const cacheKey = `user:preferences:${user.id}`;
    const cachedPreferences = await cacheService.get<UserPreferencesEntity>(cacheKey, { ttl: 600, namespace: "users" });

    if (cachedPreferences) {
      return { success: true, data: cachedPreferences };
    }

    const result = await userRepository.getUserPreferences(user.id);

    if (result.error) {
      return { success: false, error: result.error };
    }
    
    if (result.data) {
        await cacheService.set(cacheKey, result.data, { ttl: 600, namespace: "users" });
        return { success: true, data: result.data };
    }
    return { success: false, error: "Preferences not found." };

  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error getting user preferences", {
      component: "user-actions",
      action: "get_user_preferences_error",
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to get preferences" };
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
    const validationResult = FavoriteActionSchema.safeParse({ eventId, action });
    if (!validationResult.success) {
      return { success: false, error: "Invalid favorite action: " + validationResult.error.format()._errors.join(', ') };
    }

    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    logger.info("Toggling event favorite", {
      component: "user-actions",
      action: "toggle_event_favorite",
      userId: user.id,
      eventId,
      favoriteAction: action,
    });

    let result;
    if (action === "add") {
      result = await favoritesRepository.addFavorite(user.id, eventId);
      await analyticsService.trackEvent({ event_id: eventId, user_id: user.id, action: "favorite", metadata: { action: "add" } });
    } else {
      result = await favoritesRepository.removeFavorite(user.id, eventId);
      await analyticsService.trackEvent({ event_id: eventId, user_id: user.id, action: "favorite", metadata: { action: "remove" } });
    }

    if (result.error) {
      return { success: false, error: result.error };
    }

    await cacheService.delete(`user:favorites:${user.id}`, { namespace: "users" });
    await cacheService.delete(`user:favorite_ids:${user.id}`, { namespace: "users" });

    // If action was 'add', result.data is FavoriteEntity. We need to return a boolean.
    // If action was 'remove', result.data is already boolean.
    return { success: true, data: typeof result.data === 'boolean' ? result.data : true };
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error toggling event favorite", {
      component: "user-actions",
      action: "toggle_event_favorite_error",
      eventId,
      favoriteAction: action,
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to toggle favorite" };
  }
}

/**
 * Get user's favorite events
 */
export async function getUserFavorites(limit = 50): Promise<UserActionResult<any[]>> {
  try {
    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }
    
    const cacheKey = `user:favorites:${user.id}:${limit}`;
    const cachedFavorites = await cacheService.get<any[]>(cacheKey, { ttl: 300, namespace: "users" });
    if (cachedFavorites) {
      return { success: true, data: cachedFavorites };
    }

    const result = await favoritesRepository.getUserFavorites(user.id, limit);
    if (result.error) {
      return { success: false, error: result.error };
    }
    
    if(result.data){
        await cacheService.set(cacheKey, result.data, { ttl: 300, namespace: "users" });
    }
    return { success: true, data: result.data || [] };
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error getting user favorites", {
      component: "user-actions",
      action: "get_user_favorites_error",
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to get favorites" };
  }
}

/**
 * Check if an event is favorited by the current user
 */
export async function isEventFavorited(eventId: number): Promise<UserActionResult<boolean>> {
  try {
    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const result = await favoritesRepository.isFavorited(user.id, eventId);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data! };
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error checking if event is favorited", {
      component: "user-actions",
      action: "is_event_favorited_error",
      eventId,
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to check favorite status" };
  }
}

/**
 * Get user analytics data (mocked)
 */
export async function getUserAnalytics(): Promise<UserActionResult<any>> {
  try {
    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const data = await analyticsService.getUserAnalytics(user.id);
    return { success: true, data };
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error getting user analytics", {
      component: "user-actions",
      action: "get_user_analytics_error",
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to get analytics" };
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(): Promise<UserActionResult<boolean>> {
  try {
    const supabase: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    logger.warn("Mock deleteUserAccount called for user", { userId: user.id });

    await cacheService.delete(`user:profile:${user.id}`, { namespace: "users" });
    await cacheService.delete(`user:favorites:${user.id}`, { namespace: "users" });
    await cacheService.delete(`user:favorite_ids:${user.id}`, { namespace: "users" });

    // In a real scenario, you would also delete from 'users', 'user_preferences', 'favorites' tables
    // and call supabase.auth.admin.deleteUser(user.id) if using admin rights.

    return { success: true, data: true };
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    logger.error("Error deleting user account", {
      component: "user-actions",
      action: "delete_user_account_error",
      message: actualError.message,
      stack: actualError.stack,
      errorObject: actualError
    });
    return { success: false, error: "Failed to delete account" };
  }
}
