"use client"

/**
 * Analytics Hook
 * Provides analytics tracking functionality
 */

import { useCallback } from "react"
import { analyticsService } from "@/lib/backend/services/analytics-service"
import { logger } from "@/lib/utils/logger"

export interface UseAnalyticsResult {
  trackEvent: (
    eventId: number,
    action: "view" | "favorite" | "share" | "click_ticket",
    metadata?: Record<string, any>,
  ) => Promise<void>
  trackSearch: (searchParams: any) => Promise<void>
  trackPageView: (page: string, metadata?: Record<string, any>) => Promise<void>
}

export function useAnalytics(): UseAnalyticsResult {
  /**
   * Track event interaction
   */
  const trackEvent = useCallback(
    async (
      eventId: number,
      action: "view" | "favorite" | "share" | "click_ticket",
      metadata?: Record<string, any>,
    ): Promise<void> => {
      try {
        await analyticsService.trackEvent({
          event_id: eventId,
          action,
          metadata,
        })

        logger.debug("Analytics event tracked", {
          component: "useAnalytics",
          action: "track_event",
          metadata: { eventId, analyticsAction: action },
        })
      } catch (error) {
        logger.warn("Failed to track analytics event", {
          component: "useAnalytics",
          action: "track_event_error",
          metadata: { eventId, analyticsAction: action },
        })
      }
    },
    [],
  )

  /**
   * Track search action
   */
  const trackSearch = useCallback(async (searchParams: any): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        action: "search",
        metadata: {
          searchParams: {
            keyword: searchParams.keyword,
            location: searchParams.location,
            categories: searchParams.categories,
            hasFilters: !!(searchParams.startDate || searchParams.endDate || searchParams.radius),
          },
        },
      })

      logger.debug("Search analytics tracked", {
        component: "useAnalytics",
        action: "track_search",
      })
    } catch (error) {
      logger.warn("Failed to track search analytics", {
        component: "useAnalytics",
        action: "track_search_error",
      })
    }
  }, [])

  /**
   * Track page view
   */
  const trackPageView = useCallback(async (page: string, metadata?: Record<string, any>): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        action: "view",
        metadata: {
          page,
          ...metadata,
        },
      })

      logger.debug("Page view tracked", {
        component: "useAnalytics",
        action: "track_page_view",
        metadata: { page },
      })
    } catch (error) {
      logger.warn("Failed to track page view", {
        component: "useAnalytics",
        action: "track_page_view_error",
        metadata: { page },
      })
    }
  }, [])

  return {
    trackEvent,
    trackSearch,
    trackPageView,
  }
}
