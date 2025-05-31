"use client"

/**
 * Performance Monitoring Hook
 * Tracks page performance, API response times, and user interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/utils/logger'
import { advancedCache } from '@/lib/cache/advanced-cache'

interface PerformanceMetrics {
  // Page performance
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  
  // API performance
  apiResponseTimes: Record<string, number[]>
  apiErrorRates: Record<string, number>
  
  // Cache performance
  cacheHitRate: number
  cacheSize: number
  
  // User interactions
  clickCount: number
  scrollDepth: number
  timeOnPage: number
  
  // Network
  connectionType: string
  isOnline: boolean
  
  // Memory usage (if available)
  memoryUsage?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

interface PerformanceEvent {
  type: 'api_call' | 'user_interaction' | 'page_event' | 'error'
  name: string
  duration?: number
  metadata?: Record<string, any>
  timestamp: number
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({})
  const [events, setEvents] = useState<PerformanceEvent[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const startTime = useRef(Date.now())
  const clickCount = useRef(0)
  const maxScrollDepth = useRef(0)
  const apiCalls = useRef<Record<string, number[]>>({})
  const apiErrors = useRef<Record<string, number>>({})

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    startTime.current = Date.now()
    
    logger.info('Performance monitoring started')
  }, [])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    // Calculate final metrics
    const timeOnPage = Date.now() - startTime.current
    const cacheStats = advancedCache.getStats()
    
    const finalMetrics: Partial<PerformanceMetrics> = {
      ...metrics,
      timeOnPage,
      clickCount: clickCount.current,
      scrollDepth: maxScrollDepth.current,
      cacheHitRate: cacheStats.hitRate,
      cacheSize: cacheStats.size,
      apiResponseTimes: { ...apiCalls.current },
      apiErrorRates: { ...apiErrors.current }
    }
    
    setMetrics(finalMetrics)
    
    // Send metrics to analytics
    sendMetricsToAnalytics(finalMetrics)
    
    logger.info('Performance monitoring stopped', { metrics: finalMetrics })
  }, [metrics])

  // Track API call performance
  const trackApiCall = useCallback((
    endpoint: string,
    startTime: number,
    endTime: number,
    success: boolean
  ) => {
    const duration = endTime - startTime
    
    // Track response times
    if (!apiCalls.current[endpoint]) {
      apiCalls.current[endpoint] = []
    }
    apiCalls.current[endpoint].push(duration)
    
    // Track error rates
    if (!success) {
      apiErrors.current[endpoint] = (apiErrors.current[endpoint] || 0) + 1
    }
    
    // Add performance event
    const event: PerformanceEvent = {
      type: 'api_call',
      name: endpoint,
      duration,
      metadata: { success },
      timestamp: Date.now()
    }
    
    setEvents(prev => [...prev.slice(-99), event]) // Keep last 100 events
    
    logger.debug('API call tracked', { endpoint, duration, success })
  }, [])

  // Track user interactions
  const trackUserInteraction = useCallback((
    action: string,
    target?: string,
    metadata?: Record<string, any>
  ) => {
    if (!isMonitoring) return
    
    if (action === 'click') {
      clickCount.current++
    }
    
    const event: PerformanceEvent = {
      type: 'user_interaction',
      name: action,
      metadata: { target, ...metadata },
      timestamp: Date.now()
    }
    
    setEvents(prev => [...prev.slice(-99), event])
    
    logger.debug('User interaction tracked', { action, target, metadata })
  }, [isMonitoring])

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    if (!isMonitoring) return
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100)
    
    if (scrollPercentage > maxScrollDepth.current) {
      maxScrollDepth.current = Math.min(scrollPercentage, 100)
    }
  }, [isMonitoring])

  // Get Web Vitals
  const getWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return {}
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const metrics: Partial<PerformanceMetrics> = {}
    
    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
    }
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')
    if (fcp) {
      metrics.firstContentfulPaint = fcp.startTime
    }
    
    // Get LCP, CLS, FID from Performance Observer if available
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            metrics.largestContentfulPaint = lastEntry.startTime
            setMetrics(prev => ({ ...prev, largestContentfulPaint: lastEntry.startTime }))
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          metrics.cumulativeLayoutShift = clsValue
          setMetrics(prev => ({ ...prev, cumulativeLayoutShift: clsValue }))
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            metrics.firstInputDelay = entry.processingStart - entry.startTime
            setMetrics(prev => ({ ...prev, firstInputDelay: entry.processingStart - entry.startTime }))
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        
      } catch (error) {
        logger.warn('Performance Observer setup failed', { error })
      }
    }
    
    return metrics
  }, [])

  // Get memory usage
  const getMemoryUsage = useCallback(() => {
    if (typeof window === 'undefined') return undefined
    
    const memory = (performance as any).memory
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    
    return undefined
  }, [])

  // Get network information
  const getNetworkInfo = useCallback(() => {
    if (typeof window === 'undefined') return { connectionType: 'unknown', isOnline: true }
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    return {
      connectionType: connection?.effectiveType || 'unknown',
      isOnline: navigator.onLine
    }
  }, [])

  // Calculate performance score
  const getPerformanceScore = useCallback(() => {
    const { 
      pageLoadTime = 0, 
      firstContentfulPaint = 0, 
      largestContentfulPaint = 0,
      cumulativeLayoutShift = 0,
      firstInputDelay = 0,
      cacheHitRate = 0
    } = metrics
    
    let score = 100
    
    // Page load time scoring (target: < 2s)
    if (pageLoadTime > 2000) score -= 20
    else if (pageLoadTime > 1000) score -= 10
    
    // FCP scoring (target: < 1.8s)
    if (firstContentfulPaint > 1800) score -= 15
    else if (firstContentfulPaint > 1000) score -= 8
    
    // LCP scoring (target: < 2.5s)
    if (largestContentfulPaint > 2500) score -= 15
    else if (largestContentfulPaint > 1500) score -= 8
    
    // CLS scoring (target: < 0.1)
    if (cumulativeLayoutShift > 0.25) score -= 15
    else if (cumulativeLayoutShift > 0.1) score -= 8
    
    // FID scoring (target: < 100ms)
    if (firstInputDelay > 300) score -= 15
    else if (firstInputDelay > 100) score -= 8
    
    // Cache performance bonus
    if (cacheHitRate > 0.8) score += 10
    else if (cacheHitRate > 0.6) score += 5
    
    return Math.max(0, Math.min(100, score))
  }, [metrics])

  // Send metrics to analytics
  const sendMetricsToAnalytics = useCallback(async (metricsData: Partial<PerformanceMetrics>) => {
    try {
      await fetch('/api/supabase/functions/event-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance',
          eventId: 0, // Performance metrics, not specific event
          metadata: {
            ...metricsData,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            url: window.location.href
          }
        })
      })
    } catch (error) {
      logger.warn('Failed to send performance metrics', { error })
    }
  }, [])

  // Initialize monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Get initial metrics
    const webVitals = getWebVitals()
    const memoryUsage = getMemoryUsage()
    const networkInfo = getNetworkInfo()
    
    setMetrics({
      ...webVitals,
      memoryUsage,
      ...networkInfo
    })
    
    // Set up event listeners
    const handleClick = () => trackUserInteraction('click')
    const handleScroll = () => trackScrollDepth()
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }))
    
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Start monitoring automatically
    startMonitoring()
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring, trackUserInteraction, trackScrollDepth, getWebVitals, getMemoryUsage, getNetworkInfo])

  // Update metrics periodically
  useEffect(() => {
    if (!isMonitoring) return
    
    const interval = setInterval(() => {
      const memoryUsage = getMemoryUsage()
      const networkInfo = getNetworkInfo()
      const cacheStats = advancedCache.getStats()
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        ...networkInfo,
        cacheHitRate: cacheStats.hitRate,
        cacheSize: cacheStats.size,
        timeOnPage: Date.now() - startTime.current
      }))
    }, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [isMonitoring, getMemoryUsage, getNetworkInfo])

  return {
    metrics,
    events,
    isMonitoring,
    performanceScore: getPerformanceScore(),
    
    // Actions
    startMonitoring,
    stopMonitoring,
    trackApiCall,
    trackUserInteraction,
    
    // Utilities
    getWebVitals,
    getMemoryUsage,
    getNetworkInfo,
    getPerformanceScore,
    
    // Export data
    exportMetrics: () => ({ metrics, events, score: getPerformanceScore() })
  }
}
