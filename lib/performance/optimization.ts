import type React from "react"
import { logger } from "@/lib/utils/logger"

// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private observers: PerformanceObserver[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // Core Web Vitals monitoring
    if ("PerformanceObserver" in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric("LCP", lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
      this.observers.push(lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.recordMetric("FID", entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({ entryTypes: ["first-input"] })
      this.observers.push(fidObserver)

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric("CLS", clsValue)
      })
      clsObserver.observe({ entryTypes: ["layout-shift"] })
      this.observers.push(clsObserver)
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)

    // Log performance issues
    if (name === "LCP" && value > 2500) {
      logger.warn("Poor LCP detected", { value, threshold: 2500 })
    }
    if (name === "FID" && value > 100) {
      logger.warn("Poor FID detected", { value, threshold: 100 })
    }
    if (name === "CLS" && value > 0.1) {
      logger.warn("Poor CLS detected", { value, threshold: 0.1 })
    }
  }

  getMetrics() {
    const summary: Record<string, { avg: number; max: number; count: number }> = {}

    this.metrics.forEach((values, name) => {
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        count: values.length,
      }
    })

    return summary
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

// Image optimization utilities
export class ImageOptimizer {
  static async preloadCriticalImages(urls: string[]) {
    const promises = urls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
    })

    try {
      await Promise.all(promises)
      logger.info("Critical images preloaded", { count: urls.length })
    } catch (error) {
      logger.warn("Some critical images failed to preload", { error })
    }
  }

  static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(", ")
  }

  static getOptimalImageSize(containerWidth: number, devicePixelRatio = 1): number {
    const targetWidth = containerWidth * devicePixelRatio
    const sizes = [320, 640, 768, 1024, 1280, 1536, 1920]
    return sizes.find((size) => size >= targetWidth) || sizes[sizes.length - 1]
  }
}

// Bundle optimization
export class BundleOptimizer {
  static async loadComponentLazily<T>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType,
  ): Promise<T> {
    try {
      const module = await importFn()
      return module.default
    } catch (error) {
      logger.error("Failed to load component lazily", { error })
      if (fallback) {
        return fallback as T
      }
      throw error
    }
  }

  static preloadRoute(route: string) {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      requestIdleCallback(() => {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = route
        document.head.appendChild(link)
      })
    }
  }
}

// Memory management
export class MemoryManager {
  private static cleanupTasks: (() => void)[] = []

  static addCleanupTask(task: () => void) {
    this.cleanupTasks.push(task)
  }

  static cleanup() {
    this.cleanupTasks.forEach((task) => {
      try {
        task()
      } catch (error) {
        logger.warn("Cleanup task failed", { error })
      }
    })
    this.cleanupTasks = []
  }

  static monitorMemoryUsage() {
    if (typeof window !== "undefined" && "performance" in window && "memory" in performance) {
      const memory = (performance as any).memory
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      }

      if (usage.used / usage.limit > 0.8) {
        logger.warn("High memory usage detected", usage)
      }

      return usage
    }
    return null
  }
}

// Initialize performance monitoring
export const performanceMonitor = PerformanceMonitor.getInstance()
