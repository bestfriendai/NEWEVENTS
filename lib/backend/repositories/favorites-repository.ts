/**
 * Favorites Repository
 * Handles all database operations for user favorites
 */

import { BaseRepository, type RepositoryResult, type RepositoryListResult } from "../core/base-repository"

export interface FavoriteEntity {
  id: number
  user_id: string
  event_id: number
  created_at?: string
}

export interface FavoriteWithEvent extends FavoriteEntity {
  event?: {
    id: number
    title: string
    category?: string
    start_date?: string
    location_name?: string
    image_url?: string
  }
}

export class FavoritesRepository extends BaseRepository<FavoriteEntity> {
  constructor() {
    super("favorites")
  }

  /**
   * Add event to favorites
   */
  async addFavorite(userId: string, eventId: number): Promise<RepositoryResult<FavoriteEntity>> {
    try {
      // Check if already favorited
      const existing = await this.findExisting(userId, eventId)
      if (existing.data) {
        return { data: existing.data, error: null }
      }

      return this.create({
        user_id: userId,
        event_id: eventId,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Remove event from favorites
   */
  async removeFavorite(userId: string, eventId: number): Promise<RepositoryResult<boolean>> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase.from(this.tableName).delete().eq("user_id", userId).eq("event_id", eventId)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Check if event is favorited by user
   */
  async isFavorited(userId: string, eventId: number): Promise<RepositoryResult<boolean>> {
    try {
      const supabase = await this.getSupabase()
      const { count, error } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("event_id", eventId)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: (count || 0) > 0, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get user's favorite events with event details
   */
  async getUserFavorites(userId: string, limit = 50): Promise<RepositoryListResult<FavoriteWithEvent>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          event:events (
            id,
            title,
            category,
            start_date,
            location_name,
            image_url
          )
        `,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        return { data: [], error: error.message, count: 0, hasMore: false }
      }

      return {
        data: (data as FavoriteWithEvent[]) || [],
        error: null,
        count: count || 0,
        hasMore: (count || 0) > limit,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: [], error: errorMessage, count: 0, hasMore: false }
    }
  }

  /**
   * Get user's favorite event IDs
   */
  async getUserFavoriteIds(userId: string): Promise<RepositoryResult<number[]>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.from(this.tableName).select("event_id").eq("user_id", userId)

      if (error) {
        return { data: null, error: error.message }
      }

      const eventIds = (data || []).map((item) => item.event_id)
      return { data: eventIds, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get favorite count for event
   */
  async getEventFavoriteCount(eventId: number): Promise<RepositoryResult<number>> {
    return this.count({ event_id: eventId })
  }

  /**
   * Get most favorited events
   */
  async getMostFavoritedEvents(
    limit = 20,
  ): Promise<RepositoryListResult<{ event_id: number; favorite_count: number }>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.rpc("get_most_favorited_events", { limit_count: limit })

      if (error) {
        return { data: [], error: error.message, count: 0, hasMore: false }
      }

      return {
        data: data || [],
        error: null,
        count: data?.length || 0,
        hasMore: false,
      }
    } catch (error) {
      // Fallback if RPC doesn't exist
      const { data, error: fallbackError } = await this.supabase.from(this.tableName).select("event_id").limit(1000)

      if (fallbackError) {
        return { data: [], error: fallbackError.message, count: 0, hasMore: false }
      }

      // Count favorites manually
      const eventCounts: { [key: number]: number } = {}
      data?.forEach((fav) => {
        eventCounts[fav.event_id] = (eventCounts[fav.event_id] || 0) + 1
      })

      const sortedEvents = Object.entries(eventCounts)
        .map(([eventId, count]) => ({ event_id: Number.parseInt(eventId), favorite_count: count }))
        .sort((a, b) => b.favorite_count - a.favorite_count)
        .slice(0, limit)

      return {
        data: sortedEvents,
        error: null,
        count: sortedEvents.length,
        hasMore: false,
      }
    }
  }

  /**
   * Find existing favorite
   */
  private async findExisting(userId: string, eventId: number): Promise<RepositoryResult<FavoriteEntity>> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return { data: null, error: null } // Not found
        }
        return { data: null, error: error.message }
      }

      return { data: data as FavoriteEntity, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { data: null, error: errorMessage }
    }
  }
}
