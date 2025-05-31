import { logger } from "@/lib/utils/logger"

interface ImageValidationResult {
  url: string
  isValid: boolean
  source: "original" | "fallback" | "category"
}

class ImageService {
  /**
   * Validate and enhance image URL
   */
  async validateAndEnhanceImage(
    imageUrl: string,
    category: string,
    eventTitle: string,
  ): Promise<ImageValidationResult> {
    try {
      // If no image URL provided, use category fallback
      if (!imageUrl || imageUrl === "/community-event.png") {
        return {
          url: this.getCategoryFallbackImage(category),
          isValid: false,
          source: "category",
        }
      }

      // Validate the provided image URL
      if (this.isValidImageUrl(imageUrl)) {
        // Try to verify the image is accessible
        const isAccessible = await this.verifyImageAccessibility(imageUrl)

        if (isAccessible) {
          return {
            url: imageUrl,
            isValid: true,
            source: "original",
          }
        }
      }

      // If validation fails, use category fallback
      logger.debug("Image validation failed, using category fallback", {
        component: "image-service",
        originalUrl: imageUrl,
        category,
        eventTitle,
      })

      return {
        url: this.getCategoryFallbackImage(category),
        isValid: false,
        source: "fallback",
      }
    } catch (error) {
      logger.warn("Image service error, using fallback", {
        component: "image-service",
        error: error instanceof Error ? error.message : String(error),
        originalUrl: imageUrl,
        category,
      })

      return {
        url: this.getCategoryFallbackImage(category),
        isValid: false,
        source: "fallback",
      }
    }
  }

  /**
   * Validate image URL format
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false

    try {
      const urlObj = new URL(url)
      if (!["http:", "https:"].includes(urlObj.protocol)) return false

      // Check for image extensions or known image services
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".avif"]
      const imageServices = [
        "images.unsplash.com",
        "img.evbuc.com",
        "s1.ticketm.net",
        "media.ticketmaster.com",
        "tmol-prd.s3.amazonaws.com",
        "livenationinternational.com",
        "cdn.evbuc.com",
        "eventbrite.com",
        "rapidapi.com",
        "pexels.com",
        "pixabay.com",
        "cloudinary.com",
        "amazonaws.com",
        "googleusercontent.com",
        "fbcdn.net",
        "cdninstagram.com",
        "encrypted-tbn0.gstatic.com", // Google Images
        "encrypted-tbn1.gstatic.com",
        "encrypted-tbn2.gstatic.com",
        "encrypted-tbn3.gstatic.com",
        "lh3.googleusercontent.com",
        "lh4.googleusercontent.com",
        "lh5.googleusercontent.com",
        "lh6.googleusercontent.com",
        "i.imgur.com",
        // Additional image services for better coverage
        "picsum.photos",
        "via.placeholder.com",
        "placehold.it",
        "dummyimage.com",
        "source.unsplash.com",
        "images.pexels.com",
        "cdn.pixabay.com",
        "res.cloudinary.com",
        "d2v9y0dukr6mq2.cloudfront.net", // AWS CloudFront
        "images-na.ssl-images-amazon.com",
        "m.media-amazon.com",
        "imgur.com",
        "cdn.pixabay.com",
        "images.pexels.com",
      ]

      const hasImageExtension = imageExtensions.some((ext) => url.toLowerCase().includes(ext))
      const isFromImageService = imageServices.some((service) => url.toLowerCase().includes(service.toLowerCase()))

      return hasImageExtension || isFromImageService
    } catch {
      return false
    }
  }

  /**
   * Verify image accessibility (simplified check)
   */
  private async verifyImageAccessibility(url: string): Promise<boolean> {
    try {
      // In a real implementation, you might want to do a HEAD request
      // For now, we'll just assume valid URLs are accessible
      return this.isValidImageUrl(url)
    } catch {
      return false
    }
  }

  /**
   * Get category-specific fallback image
   */
  private getCategoryFallbackImage(category: string): string {
    const categoryLower = category.toLowerCase()

    const categoryImages: Record<string, string[]> = {
      music: ["/event-1.png", "/event-2.png", "/event-3.png"],
      concert: ["/event-1.png", "/event-2.png", "/event-3.png"],
      concerts: ["/event-1.png", "/event-2.png", "/event-3.png"],
      "club events": ["/event-4.png", "/event-5.png", "/event-6.png"],
      club: ["/event-4.png", "/event-5.png", "/event-6.png"],
      nightlife: ["/event-4.png", "/event-5.png", "/event-6.png"],
      "day parties": ["/event-7.png", "/event-8.png", "/event-9.png"],
      party: ["/event-7.png", "/event-8.png", "/event-9.png"],
      parties: ["/event-10.png", "/event-11.png", "/event-12.png"],
      festival: ["/event-1.png", "/event-2.png", "/event-3.png"],
      sports: ["/event-4.png", "/event-5.png"],
      theater: ["/event-6.png", "/event-7.png"],
      comedy: ["/event-8.png", "/event-9.png"],
      art: ["/event-10.png", "/event-11.png"],
      food: ["/event-12.png", "/event-1.png"],
      business: ["/event-2.png", "/event-3.png"],
      conference: ["/event-4.png", "/event-5.png"],
      workshop: ["/event-6.png", "/event-7.png"],
      community: ["/community-event.png"],
    }

    // Find matching category
    for (const [key, images] of Object.entries(categoryImages)) {
      if (categoryLower.includes(key)) {
        const randomIndex = Math.floor(Math.random() * images.length)
        return images[randomIndex]
      }
    }

    // Enhanced fallback with dynamic placeholder generation
    return this.generateDynamicPlaceholder(category)
  }

  /**
   * Generate dynamic placeholder image URL
   */
  private generateDynamicPlaceholder(category: string): string {
    const colors = {
      music: "6366f1", // Purple
      concert: "8b5cf6", // Violet
      sports: "10b981", // Green
      theater: "f59e0b", // Amber
      comedy: "ef4444", // Red
      art: "ec4899", // Pink
      food: "f97316", // Orange
      business: "3b82f6", // Blue
      conference: "6b7280", // Gray
      default: "8b5cf6", // Default purple
    }

    const categoryLower = category.toLowerCase()
    let color = colors.default

    // Find matching color
    for (const [key, value] of Object.entries(colors)) {
      if (categoryLower.includes(key)) {
        color = value
        break
      }
    }

    // Generate placeholder with category text
    const encodedCategory = encodeURIComponent(category.toUpperCase())
    return `https://via.placeholder.com/400x300/${color}/ffffff?text=${encodedCategory}`
  }
}

// Export singleton instance
export const imageService = new ImageService()
export default imageService
