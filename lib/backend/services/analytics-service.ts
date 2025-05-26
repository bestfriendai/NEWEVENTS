/**
 * Analytics Service
 * Tracks user interactions and event analytics
 */

import { createServerSupabaseClient } from "@/lib/api/supabase-api"
import { logger } from "@/lib/utils/logger"
import { headers } from "next/headers"

export interface AnalyticsEvent {
  event_id?: number
  user_id?: string
  action: "view" | "favorite" | "share" | "click_ticket" | "search"
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

export class AnalyticsService {
  private supabase = createServerSupabaseClient()

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<boolean> {
    try {
      // Get request headers for IP and user agent
      const headersList = headers()
      const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
      const userAgent = headersList.get("user-agent") || "unknown"

      const analyticsData = {
        ...event,
        ip_address: ip,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      }

      const { error } = await this.supabase.from("event_analytics").insert(analyticsData)

      if (error) {
        logger.error("Error tracking analytics event", {
          component: "AnalyticsService",
          action: "track_event_error",
          metadata: { event: event.action, error: error.message },
        })
        return false
      }

      logger.debug("Analytics event tracked", {
        component: "AnalyticsService",
        action: "track_event_success",
        metadata: {
          action: event.action,
          eventId: event.event_id,
          userId: event.user_id,
        },
      })

      return true
    } catch (error) {
      logger.error(
        "Unexpected error tracking analytics event",
        {
          component: "AnalyticsService",
          action: "track_event_unexpected_error",
          metadata: { event: event.action },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return false
    }
  }

  /**
   * Get event view count
   */
  async getEventViewCount(eventId: number): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("event_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("action", "view")

      if (error) {
        logger.error("Error getting event view count", {
          component: "AnalyticsService",
          action: "get_view_count_error",
          metadata: { eventId, error: error.message },
        })
        return 0
      }

      return count || 0
    } catch (error) {
      logger.error(
        "Unexpected error getting event view count",
        {
          component: "AnalyticsService",
          action: "get_view_count_unexpected_error",
          metadata: { eventId },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return 0
    }
  }

  /**
   * Get popular events based on analytics
   */
  async getPopularEvents(limit = 20): Promise<Array<{ event_id: number; view_count: number }>> {
    try {
      const { data, error } = await this.supabase.rpc("get_popular_events_by_views", { limit_count: limit })

      if (error) {
        // Fallback query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from("event_analytics")
          .select("event_id")
          .eq("action", "view")
          .not("event_id", "is", null)

        if (fallbackError) {
          logger.error("Error getting popular events (fallback)", {
            component: "AnalyticsService",
            action: "get_popular_events_fallback_error",
            metadata: { error: fallbackError.message },
          })
          return []
        }

        // Count views manually
        const eventCounts: { [key: number]: number } = {}
        fallbackData?.forEach((item) => {
          if (item.event_id) {
            eventCounts[item.event_id] = (eventCounts[item.event_id] || 0) + 1
          }
        })

        return Object.entries(eventCounts)
          .map(([eventId, count]) => ({ event_id: Number.parseInt(eventId), view_count: count }))
          .sort((a, b) => b.view_count - a.view_count)
          .slice(0, limit)
      }

      return data || []
    } catch (error) {
      logger.error(
        "Unexpected error getting popular events",
        {
          component: "AnalyticsService",
          action: "get_popular_events_unexpected_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return []
    }
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalytics(userId: string): Promise<{
    totalViews: number
    totalFavorites: number
    totalShares: number
    recentActivity: Array<{ action: string; created_at: string; metadata?: any }>
  }> {
    try {
      // Get counts for different actions
      const [viewsResult, favoritesResult, sharesResult, recentResult] = await Promise.all([
        this.supabase
          .from("event_analytics")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("action", "view"),

        this.supabase
          .from("event_analytics")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("action", "favorite"),

        this.supabase
          .from("event_analytics")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("action", "share"),

        this.supabase
          .from("event_analytics")
          .select("action, created_at, metadata")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      return {
        totalViews: viewsResult.count || 0,
        totalFavorites: favoritesResult.count || 0,
        totalShares: sharesResult.count || 0,
        recentActivity: recentResult.data || [],
      }
    } catch (error) {
      logger.error(
        "Error getting user analytics",
        {
          component: "AnalyticsService",
          action: "get_user_analytics_error",
          metadata: { userId },
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return {
        totalViews: 0,
        totalFavorites: 0,
        totalShares: 0,
        recentActivity: [],
      }
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardAnalytics(): Promise<{
    totalEvents: number
    totalViews: number
    totalUsers: number
    popularCategories: Array<{ category: string; count: number }>
    recentActivity: Array<{ action: string; count: number; date: string }>
  }> {
    try {
      const [eventsCount, viewsCount, usersCount] = await Promise.all([
        this.supabase.from("events").select("*", { count: "exact", head: true }).eq("is_active", true),

        this.supabase.from("event_analytics").select("*", { count: "exact", head: true }).eq("action", "view"),

        this.supabase.from("users").select("*", { count: "exact", head: true }).eq("is_active", true),
      ])

      // Get popular categories (simplified)
      const { data: categoryData } = await this.supabase
        .from("events")
        .select("category")
        .eq("is_active", true)
        .not("category", "is", null)

      const categoryCounts: { [key: string]: number } = {}
      categoryData?.forEach((item) => {
        if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
        }
      })

      const popularCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalEvents: eventsCount.count || 0,
        totalViews: viewsCount.count || 0,
        totalUsers: usersCount.count || 0,
        popularCategories,
        recentActivity: [], // Simplified for now
      }
    } catch (error) {
      logger.error(
        "Error getting dashboard analytics",
        {
          component: "AnalyticsService",
          action: "get_dashboard_analytics_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )

      return {
        totalEvents: 0,
        totalViews: 0,
        totalUsers: 0,
        popularCategories: [],
        recentActivity: [],
      }
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
