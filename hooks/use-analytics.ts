"use client"

import { useCallback } from "react"

export interface AnalyticsEvent {
  event_id?: number
  user_id?: string
  action: "view" | "favorite" | "share" | "click_ticket" | "search"
  metadata?: Record<string, any>
}

export function useAnalytics() {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      // For now, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics Event:', event)
      }
      
      // In production, you would send this to your analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.warn('Failed to track analytics event:', error)
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
