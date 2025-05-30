import { logger } from "@/lib/utils/logger"

interface ImageValidationResult {
  isValid: boolean
  url: string
  fallbackUsed: boolean
}

class ImageService {
  private readonly fallbackImages = [
    "/community-event.png",
    "/event-1.png",
    "/event-2.png",
    "/event-3.png",
    "/event-4.png",
    "/event-5.png",
    "/event-6.png",
    "/event-7.png",
    "/event-8.png",
    "/event-9.png",
    "/event-10.png",
    "/event-11.png",
    "/event-12.png",
  ]

  private readonly categoryImages: Record<string, string[]> = {
    "Concerts": ["/event-1.png", "/event-2.png", "/event-3.png"],
    "Club Events": ["/event-4.png", "/event-5.png", "/event-6.png"],
    "Day Parties": ["/event-7.png", "/event-8.png", "/event-9.png"],
    "Parties": ["/event-10.png", "/event-11.png", "/event-12.png"],
    "General Events": ["/community-event.png"],
  }

  /**
   * Validate and enhance event image URL
   */
  async validateAndEnhanceImage(
    imageUrl: string | undefined,
    category: string,
    eventTitle: string
  ): Promise<ImageValidationResult> {
    try {
      // If no image URL provided, use category-based fallback
      if (!imageUrl || imageUrl.trim() === "") {
        return this.getCategoryFallback(category, eventTitle)
      }

      // Check if it's already a local fallback image
      if (imageUrl.startsWith("/")) {
        return {
          isValid: true,
          url: imageUrl,
          fallbackUsed: false,
        }
      }

      // Validate external image URL
      const isValid = await this.validateExternalImage(imageUrl)
      
      if (isValid) {
        return {
          isValid: true,
          url: imageUrl,
          fallbackUsed: false,
        }
      }

      // If external image is invalid, use category fallback
      logger.warn("Invalid external image, using fallback", {
        component: "ImageService",
        originalUrl: imageUrl,
        eventTitle,
      })

      return this.getCategoryFallback(category, eventTitle)
    } catch (error) {
      logger.error("Error validating image", {
        component: "ImageService",
        error: error instanceof Error ? error.message : "Unknown error",
        imageUrl,
        eventTitle,
      })

      return this.getCategoryFallback(category, eventTitle)
    }
  }

  /**
   * Validate external image URL
   */
  private async validateExternalImage(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      const parsedUrl = new URL(url)
      
      // Check if it's HTTPS (required for security)
      if (parsedUrl.protocol !== "https:") {
        return false
      }

      // Check if it's from trusted domains
      const trustedDomains = [
        "ticketmaster.com",
        "livenation.com",
        "tmol-prd.com",
        "eventbrite.com",
        "eventbriteapi.com",
        "predicthq.com",
        "rapidapi.com",
        "real-time-events-search.p.rapidapi.com",
        "images.unsplash.com",
        "cdn.pixabay.com",
        "images.pexels.com",
      ]

      const isDomainTrusted = trustedDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      )

      if (!isDomainTrusted) {
        logger.warn("Image from untrusted domain", {
          component: "ImageService",
          domain: parsedUrl.hostname,
          url,
        })
        return false
      }

      // Check if URL ends with image extension
      const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
      const hasImageExtension = imageExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().includes(ext)
      )

      // For some APIs, images might not have extensions in URL, so we'll be lenient
      // but log for monitoring
      if (!hasImageExtension) {
        logger.info("Image URL without clear extension", {
          component: "ImageService",
          url,
        })
      }

      // Try to fetch the image to verify it exists (with timeout)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        const response = await fetch(url, {
          method: "HEAD", // Only get headers, not the full image
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          return false
        }

        // Check content type
        const contentType = response.headers.get("content-type")
        if (contentType && !contentType.startsWith("image/")) {
          return false
        }

        return true
      } catch (fetchError) {
        clearTimeout(timeoutId)
        logger.warn("Failed to fetch image for validation", {
          component: "ImageService",
          url,
          error: fetchError instanceof Error ? fetchError.message : "Unknown error",
        })
        return false
      }
    } catch (error) {
      logger.error("Error in validateExternalImage", {
        component: "ImageService",
        url,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return false
    }
  }

  /**
   * Get category-based fallback image
   */
  private getCategoryFallback(category: string, eventTitle: string): ImageValidationResult {
    const categoryFallbacks = this.categoryImages[category] || this.categoryImages["General Events"]
    
    // Use event title to deterministically select an image
    const titleHash = this.hashString(eventTitle)
    const imageIndex = titleHash % categoryFallbacks.length
    const selectedImage = categoryFallbacks[imageIndex]

    return {
      isValid: true,
      url: selectedImage,
      fallbackUsed: true,
    }
  }

  /**
   * Simple hash function for consistent image selection
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get a random fallback image
   */
  getRandomFallback(): string {
    const randomIndex = Math.floor(Math.random() * this.fallbackImages.length)
    return this.fallbackImages[randomIndex]
  }

  /**
   * Preprocess image URL from different sources
   */
  preprocessImageUrl(url: string | undefined, source: "rapidapi" | "ticketmaster"): string | undefined {
    if (!url) return undefined

    try {
      // RapidAPI specific preprocessing
      if (source === "rapidapi") {
        // Some RapidAPI images might need URL decoding or cleaning
        return decodeURIComponent(url).trim()
      }

      // Ticketmaster specific preprocessing
      if (source === "ticketmaster") {
        // Ticketmaster images are usually well-formatted
        return url.trim()
      }

      return url.trim()
    } catch (error) {
      logger.warn("Error preprocessing image URL", {
        component: "ImageService",
        url,
        source,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return url
    }
  }
}

// Export singleton instance
export const imageService = new ImageService()
export default imageService