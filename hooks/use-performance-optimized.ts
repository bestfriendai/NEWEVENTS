"use client"

import { useEffect, useRef, useCallback } from "react"
import { memoryManager, useMemoryCleanup } from "@/lib/performance/memory-manager"
import { logger } from "@/lib/utils/logger"
import type React from "react"

interface PerformanceOptions {
  component: string
  enableMemoryMonitoring?: boolean
  enablePerformanceTracking?: boolean
  cleanupOnUnmount?: boolean
}

export function usePerformanceOptimized(options: PerformanceOptions) {
  const { component, enableMemoryMonitoring = true, enablePerformanceTracking = true, cleanupOnUnmount = true } = options
  
  const { registerCleanup, cleanup } = useMemoryCleanup(component)
  const renderCountRef = useRef(0)
  const mountTimeRef = useRef<number>(0)
  const performanceMetricsRef = useRef<{
    renderTimes: number[]
    memoryUsage: number[]
  }>({
    renderTimes: [],
    memoryUsage: []
  })

  // Track component mount time
  useEffect(() => {
    mountTimeRef.current = performance.now()
    renderCountRef.current = 0
    
    logger.debug('Component mounted', {
      component,
      action: 'mount',
      timestamp: mountTimeRef.current
    })

    return () => {
      if (cleanupOnUnmount) {
        cleanup()
      }
      
      const unmountTime = performance.now()
      const lifetimeMs = unmountTime - mountTimeRef.current
      
      logger.debug('Component unmounted', {
        component,
        action: 'unmount',
        metadata: {
          lifetimeMs,
          renderCount: renderCountRef.current,
          avgRenderTime: performanceMetricsRef.current.renderTimes.length > 0 
            ? performanceMetricsRef.current.renderTimes.reduce((a, b) => a + b, 0) / performanceMetricsRef.current.renderTimes.length 
            : 0
        }
      })
    }
  }, [component, cleanup, cleanupOnUnmount])

  // Track render performance
  useEffect(() => {
    if (enablePerformanceTracking) {
      const renderStartTime = performance.now()
      renderCountRef.current++
      
      // Use requestIdleCallback to measure render completion
      const idleCallback = (deadline: IdleDeadline) => {
        const renderEndTime = performance.now()
        const renderTime = renderEndTime - renderStartTime
        
        performanceMetricsRef.current.renderTimes.push(renderTime)
        
        // Keep only last 10 render times
        if (performanceMetricsRef.current.renderTimes.length > 10) {
          performanceMetricsRef.current.renderTimes.shift()
        }
        
        // Log slow renders
        if (renderTime > 16) { // More than one frame at 60fps
          logger.warn('Slow render detected', {
            component,
            action: 'slowRender',
            metadata: {
              renderTime,
              renderCount: renderCountRef.current,
              timeRemaining: deadline.timeRemaining()
            }
          })
        }
      }
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(idleCallback)
      } else {
        setTimeout(() => idleCallback({ timeRemaining: () => 0, didTimeout: false }), 0)
      }
    }
  })

  // Memory monitoring
  useEffect(() => {
    if (enableMemoryMonitoring) {
      const interval = memoryManager.registerInterval(() => {
        const memoryStats = memoryManager.getMemoryStats()
        if (memoryStats) {
          performanceMetricsRef.current.memoryUsage.push(memoryStats.usedJSHeapSize)
          
          // Keep only last 10 memory readings
          if (performanceMetricsRef.current.memoryUsage.length > 10) {
            performanceMetricsRef.current.memoryUsage.shift()
          }
        }
      }, 10000, component) // Check every 10 seconds
      
      return () => {
        clearInterval(interval)
      }
    }
  }, [enableMemoryMonitoring, component])

  // Optimized event handler creator
  const createOptimizedHandler = useCallback(<T extends (...args: any[]) => any>(
    handler: T,
    deps: React.DependencyList = []
  ): T => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(handler, deps) as T
  }, []);

  // Optimized ref creator with cleanup
  const createOptimizedRef = useCallback(<T>(initialValue: T | null = null) => {
    const ref = useRef<T>(initialValue);
    
    registerCleanup(`ref_${Date.now()}`, () => {
      if (ref.current && typeof ref.current === 'object') {
        // Clear object references
        Object.keys(ref.current).forEach(key => {
          delete (ref.current as any)[key]
        })
      }
      ref.current = null as T
    }, 'low')
    
    return ref
  }, [registerCleanup])

  // Optimized memoization with cleanup tracking
  const createOptimizedMemo = useCallback(<T>(
    factory: () => T,
    deps: React.DependencyList
  ): T => {
    return useMemo(() => {
      const startTime = performance.now()
      const result = factory()
      const endTime = performance.now()
      
      if (endTime - startTime > 5) { // Log expensive computations
        logger.warn('Expensive memo computation', {
          component,
          action: 'expensiveMemo',
          metadata: { computationTime: endTime - startTime }
        })
      }
      
      return result
    }, deps)
  }, [component])

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const metrics = performanceMetricsRef.current
    const memoryStats = memoryManager.getMemoryStats()
    
    return {
      component,
      renderCount: renderCountRef.current,
      averageRenderTime: metrics.renderTimes.length > 0 
        ? metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length 
        : 0,
      maxRenderTime: metrics.renderTimes.length > 0 ? Math.max(...metrics.renderTimes) : 0,
      memoryUsage: memoryStats,
      lifetimeMs: performance.now() - mountTimeRef.current
    }
  }, [component])

  return {
    registerCleanup,
    cleanup,
    createOptimizedHandler,
    createOptimizedRef,
    createOptimizedMemo,
    getPerformanceMetrics,
    renderCount: renderCountRef.current
  }
}

// Hook for optimized async operations
export function useOptimizedAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList,
  component: string
) {
  const { registerCleanup } = useMemoryCleanup(component)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const execute = useCallback(async (): Promise<T> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = memoryManager.registerAbortController(component)
    
    try {
      const result = await asyncFn()
      return result
    } catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('Async operation aborted', { component })
        throw error
      }
      
      logger.error('Async operation failed', {
        component,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }, deps)
  
  // Cleanup on unmount
  useEffect(() => {
    registerCleanup('asyncOperation', () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }
    }, 'high')
  }, [registerCleanup])
  
  return execute
}
