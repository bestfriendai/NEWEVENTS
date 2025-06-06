/**
 * Enhanced Event Deduplication Service
 * Implements sophisticated similarity detection and quality-based selection
 */

import { logger } from '@/lib/utils/logger'
import { Event } from '@/types/event.types'

export interface DeduplicationResult {
  uniqueEvents: Event[]
  duplicatesRemoved: number
  duplicateGroups: Event[][]
}

export interface SimilarityScore {
  overall: number
  title: number
  venue: number
  date: number
  time: number
  location: number
}

class DeduplicationService {
  private readonly SIMILARITY_THRESHOLD = 0.85
  private readonly TITLE_WEIGHT = 0.4
  private readonly VENUE_WEIGHT = 0.25
  private readonly DATE_WEIGHT = 0.15
  private readonly TIME_WEIGHT = 0.1
  private readonly LOCATION_WEIGHT = 0.1

  /**
   * Remove duplicate events from an array
   */
  async deduplicateEvents(events: Event[]): Promise<DeduplicationResult> {
    logger.info('Starting event deduplication', {
      component: 'DeduplicationService',
      action: 'deduplicateEvents',
      metadata: { inputCount: events.length }
    })

    const startTime = Date.now()
    const duplicateGroups: Event[][] = []
    const processedEvents = new Set<number>()
    const uniqueEvents: Event[] = []

    // Group similar events
    for (let i = 0; i < events.length; i++) {
      if (processedEvents.has(i)) continue

      const currentEvent = events[i]
      const similarEvents: Event[] = [currentEvent]
      processedEvents.add(i)

      // Find similar events
      for (let j = i + 1; j < events.length; j++) {
        if (processedEvents.has(j)) continue

        const compareEvent = events[j]
        const similarity = this.calculateSimilarity(currentEvent, compareEvent)

        if (similarity.overall >= this.SIMILARITY_THRESHOLD) {
          similarEvents.push(compareEvent)
          processedEvents.add(j)
        }
      }

      // Select the best event from the group
      const bestEvent = this.selectBestEvent(similarEvents)
      uniqueEvents.push(bestEvent)

      // Track duplicate groups
      if (similarEvents.length > 1) {
        duplicateGroups.push(similarEvents)
      }
    }

    const duration = Date.now() - startTime
    const duplicatesRemoved = events.length - uniqueEvents.length

    logger.info('Event deduplication completed', {
      component: 'DeduplicationService',
      action: 'deduplicateEvents',
      metadata: {
        inputCount: events.length,
        outputCount: uniqueEvents.length,
        duplicatesRemoved,
        duplicateGroups: duplicateGroups.length,
        duration
      }
    })

    return {
      uniqueEvents,
      duplicatesRemoved,
      duplicateGroups
    }
  }

  /**
   * Calculate similarity score between two events
   */
  private calculateSimilarity(event1: Event, event2: Event): SimilarityScore {
    const titleSimilarity = this.calculateTextSimilarity(
      this.normalizeText(event1.title),
      this.normalizeText(event2.title)
    )

    const venueSimilarity = this.calculateTextSimilarity(
      this.normalizeText(event1.venue?.name || ''),
      this.normalizeText(event2.venue?.name || '')
    )

    const dateSimilarity = this.calculateDateSimilarity(
      event1.date,
      event2.date
    )

    const timeSimilarity = this.calculateTimeSimilarity(
      event1.time,
      event2.time
    )

    const locationSimilarity = this.calculateLocationSimilarity(
      event1.coordinates,
      event2.coordinates
    )

    const overall = (
      titleSimilarity * this.TITLE_WEIGHT +
      venueSimilarity * this.VENUE_WEIGHT +
      dateSimilarity * this.DATE_WEIGHT +
      timeSimilarity * this.TIME_WEIGHT +
      locationSimilarity * this.LOCATION_WEIGHT
    )

    return {
      overall,
      title: titleSimilarity,
      venue: venueSimilarity,
      date: dateSimilarity,
      time: timeSimilarity,
      location: locationSimilarity
    }
  }

  /**
   * Calculate text similarity using Levenshtein distance
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 && !text2) return 1
    if (!text1 || !text2) return 0

    const distance = this.levenshteinDistance(text1, text2)
    const maxLength = Math.max(text1.length, text2.length)
    
    return maxLength === 0 ? 1 : 1 - (distance / maxLength)
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Calculate date similarity
   */
  private calculateDateSimilarity(date1: string, date2: string): number {
    if (!date1 && !date2) return 1
    if (!date1 || !date2) return 0

    try {
      const d1 = new Date(date1)
      const d2 = new Date(date2)
      
      // Same date = 1.0, 1 day difference = 0.8, 2 days = 0.6, etc.
      const daysDiff = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) return 1
      if (daysDiff <= 1) return 0.8
      if (daysDiff <= 2) return 0.6
      if (daysDiff <= 7) return 0.4
      
      return 0
    } catch {
      return 0
    }
  }

  /**
   * Calculate time similarity
   */
  private calculateTimeSimilarity(time1: string, time2: string): number {
    if (!time1 && !time2) return 1
    if (!time1 || !time2) return 0

    try {
      const t1 = this.parseTime(time1)
      const t2 = this.parseTime(time2)
      
      if (!t1 || !t2) return 0

      // Calculate hour difference
      const hoursDiff = Math.abs(t1.hours - t2.hours)
      const minutesDiff = Math.abs(t1.minutes - t2.minutes)
      
      const totalMinutesDiff = hoursDiff * 60 + minutesDiff
      
      if (totalMinutesDiff === 0) return 1
      if (totalMinutesDiff <= 30) return 0.8
      if (totalMinutesDiff <= 60) return 0.6
      if (totalMinutesDiff <= 120) return 0.4
      
      return 0
    } catch {
      return 0
    }
  }

  /**
   * Calculate location similarity using coordinates
   */
  private calculateLocationSimilarity(
    coords1?: { lat: number; lng: number },
    coords2?: { lat: number; lng: number }
  ): number {
    if (!coords1 && !coords2) return 1
    if (!coords1 || !coords2) return 0

    // Calculate distance in kilometers using Haversine formula
    const distance = this.calculateDistance(
      coords1.lat, coords1.lng,
      coords2.lat, coords2.lng
    )

    // Same location (< 100m) = 1.0, < 1km = 0.8, < 5km = 0.6, etc.
    if (distance < 0.1) return 1
    if (distance < 1) return 0.8
    if (distance < 5) return 0.6
    if (distance < 10) return 0.4
    
    return 0
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Parse time string to hours and minutes
   */
  private parseTime(timeStr: string): { hours: number; minutes: number } | null {
    try {
      // Handle various time formats
      const timeRegex = /(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/
      const match = timeStr.match(timeRegex)
      
      if (!match) return null

      let hours = parseInt(match[1])
      const minutes = parseInt(match[2] || '0')
      const period = match[3]?.toUpperCase()

      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0

      return { hours, minutes }
    } catch {
      return null
    }
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Select the best event from a group of similar events
   */
  private selectBestEvent(events: Event[]): Event {
    if (events.length === 1) return events[0]

    // Score events based on quality indicators
    const scoredEvents = events.map(event => ({
      event,
      score: this.calculateEventQuality(event)
    }))

    // Sort by score (highest first)
    scoredEvents.sort((a, b) => b.score - a.score)

    logger.debug('Selected best event from duplicates', {
      component: 'DeduplicationService',
      action: 'selectBestEvent',
      metadata: {
        groupSize: events.length,
        selectedEvent: scoredEvents[0].event.title,
        selectedScore: scoredEvents[0].score
      }
    })

    return scoredEvents[0].event
  }

  /**
   * Calculate event quality score
   */
  private calculateEventQuality(event: Event): number {
    let score = 0

    // Image quality
    if (event.image && event.image !== '/community-event.png') score += 20
    if (event.images && event.images.length > 1) score += 10

    // Description quality
    if (event.description && event.description.length > 100) score += 15
    if (event.description && event.description.length > 300) score += 10

    // Venue information
    if (event.venue?.name) score += 15
    if (event.venue?.address) score += 10
    if (event.coordinates) score += 10

    // Ticket information
    if (event.ticketLinks && event.ticketLinks.length > 0) score += 15
    if (event.price && event.price !== 'Free') score += 5

    // Organizer information
    if (event.organizer?.name) score += 10
    if (event.organizer?.avatar) score += 5

    // Data source preference (some sources are more reliable)
    if (event.source === 'ticketmaster') score += 20
    else if (event.source === 'eventbrite') score += 15
    else if (event.source === 'rapidapi') score += 10

    return score
  }
}

export const deduplicationService = new DeduplicationService()
