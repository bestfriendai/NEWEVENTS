/**
 * User Repository
 * Handles all database operations for users and user preferences
 */

import { BaseRepository, type RepositoryResult, type RepositoryListResult } from "../core/base-repository"

export interface UserEntity {
  id: string
  email: string
  name?: string
  avatar_url?: string
  location_lat?: number
  location_lng?: number
  location_name?: string
  preferences?: any
  created_at?: string
  updated_at?: string
  last_login?: string
  is_active?: boolean
}

export interface UserPreferencesEntity {
  id: number
  user_id: string
  favorite_categories?: string[]
  price_preference?: string
  time_preference?: string
  radius_preference?: number
  notification_settings?: any
  created_at?: string
  updated_at?: string
}

export class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super("users")
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<RepositoryResult<UserEntity>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.from(this.tableName).select("*").eq("email", email).single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as UserEntity, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update user location
   */
  async updateLocation(
    userId: string,
    location: { lat: number; lng: number; name?: string },
  ): Promise<RepositoryResult<UserEntity>> {
    return this.update(userId, {
      location_lat: location.lat,
      location_lng: location.lng,
      location_name: location.name,
    })
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId: string): Promise<RepositoryResult<UserEntity>> {
    return this.update(userId, {
      last_login: new Date().toISOString(),
    })
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<RepositoryResult<UserPreferencesEntity>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

      if (error) {
        // If no preferences exist, return default preferences
        if (error.code === "PGRST116") {
          return {
            data: {
              id: 0,
              user_id: userId,
              favorite_categories: [],
              price_preference: "any",
              time_preference: "any",
              radius_preference: 25,
              notification_settings: {},
            } as UserPreferencesEntity,
            error: null,
          }
        }
        return { data: null, error: error.message }
      }

      return { data: data as UserPreferencesEntity, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserPreferencesEntity, "id" | "user_id" | "created_at" | "updated_at">>,
  ): Promise<RepositoryResult<UserPreferencesEntity>> {
    try {
      const supabase = await this.getSupabase()
      // Try to update existing preferences
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          ...preferences,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as UserPreferencesEntity, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(): Promise<RepositoryResult<number>> {
    return this.count({ is_active: true })
  }

  /**
   * Get users by location radius
   */
  async getUsersByLocation(lat: number, lng: number, radiusKm = 50): Promise<RepositoryListResult<UserEntity>> {
    try {
      const supabase = await this.getSupabase()
      // Simple distance calculation - in production use PostGIS
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact" })
        .not("location_lat", "is", null)
        .not("location_lng", "is", null)
        .gte("location_lat", lat - radiusKm / 111)
        .lte("location_lat", lat + radiusKm / 111)
        .gte("location_lng", lng - radiusKm / (111 * Math.cos((lat * Math.PI) / 180)))
        .lte("location_lng", lng + radiusKm / (111 * Math.cos((lat * Math.PI) / 180)))
        .eq("is_active", true)

      if (error) {
        return { data: [], error: error.message, count: 0, hasMore: false }
      }

      return {
        data: (data as UserEntity[]) || [],
        error: null,
        count: count || 0,
        hasMore: false,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: [], error: errorMessage, count: 0, hasMore: false }
    }
  }
}
