/**
 * Comprehensive Memory Management System
 * Handles cleanup, monitoring, and optimization
 */

import { logger } from "@/lib/utils/logger"

interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  usagePercentage: number
}

interface CleanupTask {
  id: string
  cleanup: () => void
  priority: "low" | "medium" | "high"
  component?: string
}

class MemoryManager {
  private static instance: MemoryManager
  private cleanupTasks = new Map<string, CleanupTask>()
  private observers = new Set<PerformanceObserver>()
  private intervals = new Set<NodeJS.Timeout>()
  private timeouts = new Set<NodeJS.Timeout>()
  private eventListeners = new Map<string, { element: EventTarget; event: string; handler: EventListener }>()
  private abortControllers = new Set<AbortController>()
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.startMonitoring()
      this.setupUnloadHandler()
    }
  }

  /**
   * Register a cleanup task
   */
  registerCleanup(id: string, cleanup: () => void, priority: "low" | "medium" | "high" = "medium", component?: string) {
    this.cleanupTasks.set(id, { id, cleanup, priority, component })

    logger.debug("Cleanup task registered", {
      component: "MemoryManager",
      action: "registerCleanup",
      metadata: { id, priority, component },
    })
  }

  /**
   * Unregister a cleanup task
   */
  unregisterCleanup(id: string) {
    const removed = this.cleanupTasks.delete(id)
    if (removed) {
      logger.debug("Cleanup task unregistered", {
        component: "MemoryManager",
        action: "unregisterCleanup",
        metadata: { id },
      })
    }
  }

  /**
   * Execute cleanup for specific component
   */
  cleanupComponent(component: string) {
    const tasks = Array.from(this.cleanupTasks.values()).filter((task) => task.component === component)

    tasks.forEach((task) => {
      try {
        task.cleanup()
        this.cleanupTasks.delete(task.id)
      } catch (error) {
        logger.error("Cleanup task failed", {
          component: "MemoryManager",
          action: "cleanupComponent",
          metadata: { taskId: task.id, component },
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })

    logger.info("Component cleanup completed", {
      component: "MemoryManager",
      action: "cleanupComponent",
      metadata: { component, tasksExecuted: tasks.length },
    })
  }

  /**
   * Execute all cleanup tasks
   */
  cleanupAll() {
    const tasks = Array.from(this.cleanupTasks.values()).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    let successCount = 0
    let errorCount = 0

    tasks.forEach((task) => {
      try {
        task.cleanup()
        successCount++
      } catch (error) {
        errorCount++
        logger.error("Cleanup task failed", {
          component: "MemoryManager",
          action: "cleanupAll",
          metadata: { taskId: task.id },
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })

    this.cleanupTasks.clear()

    logger.info("Global cleanup completed", {
      component: "MemoryManager",
      action: "cleanupAll",
      metadata: { successCount, errorCount, totalTasks: tasks.length },
    })
  }

  /**
   * Register managed interval
   */
  registerInterval(callback: () => void, delay: number, component?: string): NodeJS.Timeout {
    const interval = setInterval(callback, delay)
    this.intervals.add(interval)

    const cleanupId = `interval_${Date.now()}_${Math.random()}`
    this.registerCleanup(
      cleanupId,
      () => {
        clearInterval(interval)
        this.intervals.delete(interval)
      },
      "high",
      component,
    )

    return interval
  }

  /**
   * Register managed timeout
   */
  registerTimeout(callback: () => void, delay: number, component?: string): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      callback()
      this.timeouts.delete(timeout)
    }, delay)
    this.timeouts.add(timeout)

    const cleanupId = `timeout_${Date.now()}_${Math.random()}`
    this.registerCleanup(
      cleanupId,
      () => {
        clearTimeout(timeout)
        this.timeouts.delete(timeout)
      },
      "high",
      component,
    )

    return timeout
  }

  /**
   * Register managed event listener
   */
  registerEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
    component?: string,
  ) {
    element.addEventListener(event, handler, options)

    const listenerId = `listener_${Date.now()}_${Math.random()}`
    this.eventListeners.set(listenerId, { element, event, handler })

    this.registerCleanup(
      listenerId,
      () => {
        element.removeEventListener(event, handler)
        this.eventListeners.delete(listenerId)
      },
      "high",
      component,
    )

    return listenerId
  }

  /**
   * Register managed AbortController
   */
  registerAbortController(component?: string): AbortController {
    const controller = new AbortController()
    this.abortControllers.add(controller)

    const cleanupId = `abort_${Date.now()}_${Math.random()}`
    this.registerCleanup(
      cleanupId,
      () => {
        if (!controller.signal.aborted) {
          controller.abort()
        }
        this.abortControllers.delete(controller)
      },
      "high",
      component,
    )

    return controller
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    if (typeof window === "undefined" || !("performance" in window) || !("memory" in performance)) {
      return null
    }

    const memory = (performance as any).memory
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
    }
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection() {
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        ;(window as any).gc()
        logger.info("Forced garbage collection", {
          component: "MemoryManager",
          action: "forceGarbageCollection",
        })
      } catch (error) {
        logger.warn("Failed to force garbage collection", {
          component: "MemoryManager",
          action: "forceGarbageCollection",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats()
      if (stats) {
        // Log warning if memory usage is high
        if (stats.usagePercentage > 80) {
          logger.warn("High memory usage detected", {
            component: "MemoryManager",
            action: "memoryMonitoring",
            metadata: {
              usagePercentage: stats.usagePercentage.toFixed(2),
              usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2),
              limitMB: (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
            },
          })

          // Trigger cleanup for low priority tasks
          this.cleanupLowPriorityTasks()
        }

        // Critical memory usage - force cleanup
        if (stats.usagePercentage > 90) {
          logger.error("Critical memory usage - forcing cleanup", {
            component: "MemoryManager",
            action: "criticalMemoryUsage",
            metadata: stats,
          })

          this.emergencyCleanup()
        }
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Cleanup low priority tasks
   */
  private cleanupLowPriorityTasks() {
    const lowPriorityTasks = Array.from(this.cleanupTasks.values()).filter((task) => task.priority === "low")

    lowPriorityTasks.forEach((task) => {
      try {
        task.cleanup()
        this.cleanupTasks.delete(task.id)
      } catch (error) {
        logger.error("Low priority cleanup failed", {
          component: "MemoryManager",
          action: "cleanupLowPriorityTasks",
          metadata: { taskId: task.id },
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })
  }

  /**
   * Emergency cleanup for critical memory situations
   */
  private emergencyCleanup() {
    // Abort all ongoing requests
    this.abortControllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })

    // Clear all intervals and timeouts
    this.intervals.forEach((interval) => clearInterval(interval))
    this.timeouts.forEach((timeout) => clearTimeout(timeout))

    // Force garbage collection
    this.forceGarbageCollection()

    logger.info("Emergency cleanup completed", {
      component: "MemoryManager",
      action: "emergencyCleanup",
    })
  }

  /**
   * Setup page unload handler
   */
  private setupUnloadHandler() {
    const handleUnload = () => {
      this.cleanupAll()
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
      }
    }

    window.addEventListener("beforeunload", handleUnload)
    window.addEventListener("unload", handleUnload)
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      cleanupTasks: this.cleanupTasks.size,
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      eventListeners: this.eventListeners.size,
      abortControllers: this.abortControllers.size,
      memoryStats: this.getMemoryStats(),
    }
  }
}

export const memoryManager = MemoryManager.getInstance()

// React hook for component cleanup
export function useMemoryCleanup(component: string) {
  const registerCleanup = (id: string, cleanup: () => void, priority?: "low" | "medium" | "high") => {
    memoryManager.registerCleanup(id, cleanup, priority, component)
  }

  const cleanup = () => {
    memoryManager.cleanupComponent(component)
  }

  return { registerCleanup, cleanup }
}
