/**
 * Advanced Image Optimization System
 * Handles lazy loading, caching, and performance optimization
 */

import { logger } from "@/lib/utils/logger"
import { memoryManager } from "./memory-manager"

interface ImageCacheEntry {
  url: string
  blob: Blob
  timestamp: number
  accessCount: number
  lastAccessed: number
}

interface ImageLoadOptions {
  priority?: "low" | "normal" | "high"
  quality?: number
  format?: "webp" | "avif" | "auto"
  sizes?: string
  placeholder?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

class ImageOptimizer {
  private static instance: ImageOptimizer
  private cache = new Map<string, ImageCacheEntry>()
  private loadingPromises = new Map<string, Promise<string>>()
  private intersectionObserver: IntersectionObserver | null = null
  private preloadQueue = new Set<string>()
  private maxCacheSize = 50 * 1024 * 1024 // 50MB
  private currentCacheSize = 0

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer()
    }
    return ImageOptimizer.instance
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.setupIntersectionObserver()
      this.setupCleanup()
    }
  }

  /**
   * Optimize image URL with format and quality
   */
  optimizeImageUrl(url: string, options: ImageLoadOptions = {}): string {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
      return url
    }

    const { quality = 85, format = "auto" } = options

    // For placeholder.svg URLs, add optimization parameters
    if (url.includes("placeholder.svg")) {
      const urlObj = new URL(url, window.location.origin)
      if (quality !== 85) urlObj.searchParams.set("q", quality.toString())
      return urlObj.toString()
    }

    // For external URLs, return as-is (would need CDN integration for optimization)
    return url
  }

  /**
   * Preload critical images
   */
  async preloadImages(urls: string[], priority: "low" | "normal" | "high" = "normal"): Promise<void> {
    const preloadPromises = urls.map((url) => this.loadImage(url, { priority }))

    try {
      await Promise.allSettled(preloadPromises)
      logger.info("Images preloaded", {
        component: "ImageOptimizer",
        action: "preloadImages",
        metadata: { count: urls.length, priority },
      })
    } catch (error) {
      logger.error("Image preloading failed", {
        component: "ImageOptimizer",
        action: "preloadImages",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Load image with caching and optimization
   */
  async loadImage(url: string, options: ImageLoadOptions = {}): Promise<string> {
    const optimizedUrl = this.optimizeImageUrl(url, options)

    // Check cache first
    const cached = this.cache.get(optimizedUrl)
    if (cached) {
      cached.accessCount++
      cached.lastAccessed = Date.now()
      return URL.createObjectURL(cached.blob)
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(optimizedUrl)
    if (existingPromise) {
      return existingPromise
    }

    // Create loading promise
    const loadingPromise = this.fetchAndCacheImage(optimizedUrl, options)
    this.loadingPromises.set(optimizedUrl, loadingPromise)

    try {
      const result = await loadingPromise
      return result
    } finally {
      this.loadingPromises.delete(optimizedUrl)
    }
  }

  /**
   * Fetch and cache image
   */
  private async fetchAndCacheImage(url: string, options: ImageLoadOptions): Promise<string> {
    try {
      const controller = memoryManager.registerAbortController("ImageOptimizer")

      const response = await fetch(url, {
        signal: controller.signal,
        priority: options.priority as RequestPriority,
      })

      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      // Cache the blob
      this.cacheImage(url, blob)

      options.onLoad?.()

      logger.debug("Image loaded and cached", {
        component: "ImageOptimizer",
        action: "fetchAndCacheImage",
        metadata: { url, size: blob.size },
      })

      return blobUrl
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      options.onError?.(errorObj)

      logger.error("Image loading failed", {
        component: "ImageOptimizer",
        action: "fetchAndCacheImage",
        metadata: { url },
        error: errorObj.message,
      })

      throw errorObj
    }
  }

  /**
   * Cache image blob
   */
  private cacheImage(url: string, blob: Blob) {
    // Check if we need to evict old entries
    if (this.currentCacheSize + blob.size > this.maxCacheSize) {
      this.evictOldEntries(blob.size)
    }

    const entry: ImageCacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    }

    this.cache.set(url, entry)
    this.currentCacheSize += blob.size
  }

  /**
   * Evict old cache entries
   */
  private evictOldEntries(requiredSpace: number) {
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
      // Sort by access count and last accessed time
      const scoreA = a.accessCount * 0.7 + (Date.now() - a.lastAccessed) * 0.3
      const scoreB = b.accessCount * 0.7 + (Date.now() - b.lastAccessed) * 0.3
      return scoreA - scoreB
    })

    let freedSpace = 0
    const toRemove: string[] = []

    for (const [url, entry] of entries) {
      toRemove.push(url)
      freedSpace += entry.blob.size

      if (freedSpace >= requiredSpace) {
        break
      }
    }

    toRemove.forEach((url) => {
      const entry = this.cache.get(url)
      if (entry) {
        this.currentCacheSize -= entry.blob.size
        this.cache.delete(url)
        URL.revokeObjectURL(URL.createObjectURL(entry.blob))
      }
    })

    logger.info("Cache entries evicted", {
      component: "ImageOptimizer",
      action: "evictOldEntries",
      metadata: { removedCount: toRemove.length, freedSpace },
    })
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src

            if (src) {
              this.loadImage(src, { priority: "normal" })
                .then((blobUrl) => {
                  img.src = blobUrl
                  img.removeAttribute("data-src")
                  this.intersectionObserver?.unobserve(img)
                })
                .catch((error) => {
                  logger.error("Lazy loading failed", {
                    component: "ImageOptimizer",
                    action: "lazyLoad",
                    error: error.message,
                  })
                })
            }
          }
        })
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    )
  }

  /**
   * Register image for lazy loading
   */
  observeImage(img: HTMLImageElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(img)
    }
  }

  /**
   * Setup cleanup
   */
  private setupCleanup() {
    memoryManager.registerCleanup(
      "imageOptimizer",
      () => {
        // Revoke all blob URLs
        this.cache.forEach((entry) => {
          URL.revokeObjectURL(URL.createObjectURL(entry.blob))
        })

        // Clear cache
        this.cache.clear()
        this.currentCacheSize = 0

        // Disconnect observer
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect()
        }

        // Clear loading promises
        this.loadingPromises.clear()
      },
      "high",
      "ImageOptimizer",
    )
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      entryCount: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilizationPercentage: (this.currentCacheSize / this.maxCacheSize) * 100,
      loadingPromises: this.loadingPromises.size,
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.forEach((entry) => {
      URL.revokeObjectURL(URL.createObjectURL(entry.blob))
    })
    this.cache.clear()
    this.currentCacheSize = 0

    logger.info("Image cache cleared", {
      component: "ImageOptimizer",
      action: "clearCache",
    })
  }
}

export const imageOptimizer = ImageOptimizer.getInstance()
