"use client"

import { useCallback } from "react"
import { logger } from "@/lib/utils/logger"

export interface AnalyticsEvent {
  event_id?: number
  user_id?: string
  action: "view" | "favorite" | "share" | "click_ticket" | "search"
  metadata?: Record<string, any>
}

export function useAnalytics() {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      // Log analytics event using structured logging
      logger.info('Analytics event tracked', {
        component: 'Analytics',
        action: 'trackEvent',
        metadata: {
          eventId: event.event_id,
          userId: event.user_id,
          action: event.action,
          ...event.metadata
        }
      })

      // In production, you would send this to your analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      logger.warn('Failed to track analytics event', {
        component: 'Analytics',
        action: 'trackEventError',
        metadata: { event, error: error instanceof Error ? error.message : String(error) }
      })
    }
  }, [])

  const trackEventView = useCallback((eventId: number) => {
    trackEvent({
      event_id: eventId,
      action: "view"
    })
  }, [trackEvent])

  const trackEventFavorite = useCallback((eventId: number, isFavorite: boolean) => {
    trackEvent({
      event_id: eventId,
      action: "favorite",
      metadata: { isFavorite }
    })
  }, [trackEvent])

  const trackEventShare = useCallback((eventId: number, platform?: string) => {
    trackEvent({
      event_id: eventId,
      action: "share",
      metadata: { platform }
    })
  }, [trackEvent])

  const trackTicketClick = useCallback((eventId: number, ticketSource: string) => {
    trackEvent({
      event_id: eventId,
      action: "click_ticket",
      metadata: { ticketSource }
    })
  }, [trackEvent])

  const trackSearch = useCallback((query: string, filters?: Record<string, any>) => {
    trackEvent({
      action: "search",
      metadata: { query, filters }
    })
  }, [trackEvent])

  return {
    trackEvent,
    trackEventView,
    trackEventFavorite,
    trackEventShare,
    trackTicketClick,
    trackSearch
  }
}
