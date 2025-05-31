import { type NextRequest, NextResponse } from "next/server"
import { searchEvents } from "@/lib/api/events-api"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters with enhanced defaults
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : undefined
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : undefined
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius")!) : 50 // Increased default radius
    const keyword = searchParams.get("keyword") || searchParams.get("q") || undefined
    const location = searchParams.get("location") || undefined
    const category = searchParams.get("category") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "200"), 500) // Increased default to 200 and max to 500
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    logger.info("Enhanced Events API request", {
      component: "EnhancedEventsAPI",
      action: "GET",
      metadata: { lat, lng, radius, keyword, location, category, limit, offset },
    })

    // Enhanced multiple search strategies for better coverage
    const searchStrategies = []
    const strategiesPerSource = Math.max(2, Math.floor(limit / 50)) // More strategies for larger limits

    // Primary search with user parameters
    searchStrategies.push({
      keyword,
      location,
      coordinates: lat && lng ? { lat, lng } : undefined,
      radius,
      startDate,
      endDate,
      size: Math.floor(limit / strategiesPerSource),
      page: 0,
      priority: 1
    })

    // Location-based searches with different radii
    if (lat && lng) {
      // Close radius search
      searchStrategies.push({
        keyword: keyword || "events entertainment music",
        coordinates: { lat, lng },
        radius: Math.min(radius, 25), // Close events
        startDate,
        endDate,
        size: Math.floor(limit / strategiesPerSource),
        page: 0,
        priority: 2
      })

      // Extended radius search
      searchStrategies.push({
        keyword: keyword || "concert festival entertainment",
        coordinates: { lat, lng },
        radius: radius * 1.5, // Expand radius for more events
        startDate,
        endDate,
        size: Math.floor(limit / strategiesPerSource),
        page: 0,
        priority: 3
      })
    }

    // Category-based searches
    if (category) {
      searchStrategies.push({
        keyword: category,
        location,
        coordinates: lat && lng ? { lat, lng } : undefined,
        radius,
        categories: [category],
        size: Math.floor(limit / strategiesPerSource),
        page: 0,
        priority: 2
      })
    } else {
      // Popular categories searches
      const popularCategories = [
        "concert music festival",
        "comedy theater entertainment",
        "sports games",
        "food festival market",
        "art exhibition gallery"
      ]

      popularCategories.slice(0, 2).forEach((categoryKeyword, index) => {
        searchStrategies.push({
          keyword: categoryKeyword,
          location,
          coordinates: lat && lng ? { lat, lng } : undefined,
          radius,
          size: Math.floor(limit / (strategiesPerSource * 2)),
          page: 0,
          priority: 3 + index
        })
      })
    }

    // Time-based searches for better coverage
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    // This week events
    searchStrategies.push({
      keyword: keyword || "events entertainment",
      location,
      coordinates: lat && lng ? { lat, lng } : undefined,
      radius,
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      size: Math.floor(limit / strategiesPerSource),
      page: 0,
      priority: 4
    })

    // Next month events
    searchStrategies.push({
      keyword: keyword || "events entertainment",
      location,
      coordinates: lat && lng ? { lat, lng } : undefined,
      radius,
      startDate: nextWeek.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      size: Math.floor(limit / strategiesPerSource),
      page: 0,
      priority: 5
    })

    // Execute search strategies with priority handling
    const searchPromises = searchStrategies.map(async (strategy, index) => {
      try {
        const result = await searchEvents(strategy)
        return {
          events: result.events,
          priority: strategy.priority || index,
          strategy: strategy.keyword || 'default'
        }
      } catch (error) {
        logger.warn("Search strategy failed", { strategy, error })
        return {
          events: [],
          priority: strategy.priority || index,
          strategy: strategy.keyword || 'default'
        }
      }
    })

    const results = await Promise.allSettled(searchPromises)

    // Collect and prioritize events
    const prioritizedResults: Array<{ events: any[], priority: number, strategy: string }> = []

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        prioritizedResults.push(result.value)
      }
    })

    // Sort by priority and combine events
    prioritizedResults.sort((a, b) => a.priority - b.priority)

    const allEvents = []
    const eventSources = new Set<string>()

    for (const result of prioritizedResults) {
      if (result.events.length > 0) {
        allEvents.push(...result.events)
        eventSources.add(result.strategy)
        logger.info(`Strategy "${result.strategy}" returned ${result.events.length} events`)
      }
    }

    // Enhanced deduplication with better matching
    const uniqueEvents = deduplicateEventsEnhanced(allEvents)

    // Sort events by relevance and date
    const sortedEvents = sortEventsByRelevance(uniqueEvents, {
      userLat: lat,
      userLng: lng,
      userKeyword: keyword,
      userCategory: category
    })

    // Apply pagination to final results
    const paginatedEvents = sortedEvents.slice(offset, offset + limit)

    logger.info("Enhanced Events API completed", {
      component: "EnhancedEventsAPI",
      action: "GET_SUCCESS",
      metadata: {
        strategiesUsed: searchStrategies.length,
        totalFound: uniqueEvents.length,
        returned: paginatedEvents.length,
        sourcesUsed: Array.from(eventSources),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Events fetched successfully",
      data: {
        events: paginatedEvents,
        totalCount: uniqueEvents.length,
        hasMore: offset + limit < uniqueEvents.length,
        pagination: {
          limit,
          offset,
          total: uniqueEvents.length,
        },
        strategies: searchStrategies.length,
        sources: Array.from(eventSources),
        metadata: {
          searchStrategies: searchStrategies.length,
          uniqueEventsFound: uniqueEvents.length,
          duplicatesRemoved: allEvents.length - uniqueEvents.length,
        }
      },
    })
  } catch (error) {
    logger.error("Enhanced Events API error", {
      component: "EnhancedEventsAPI",
      action: "GET_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          events: [],
          totalCount: 0,
          hasMore: false,
        },
      },
      { status: 500 },
    )
  }
}

// Enhanced deduplication function
function deduplicateEventsEnhanced(events: any[]): any[] {
  const seen = new Map<string, any>()
  const duplicateKeys = new Set<string>()

  for (const event of events) {
    // Create multiple keys for better duplicate detection
    const keys = [
      // Exact match
      `${event.title?.toLowerCase()}-${event.date}-${event.location?.toLowerCase()}`,
      // Title and date only (for venue variations)
      `${event.title?.toLowerCase()}-${event.date}`,
      // Title similarity (remove common words)
      `${event.title?.toLowerCase().replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '').trim()}-${event.date}`,
    ]

    let isDuplicate = false
    let existingKey = ''

    // Check if any key already exists
    for (const key of keys) {
      if (seen.has(key)) {
        isDuplicate = true
        existingKey = key
        duplicateKeys.add(key)
        break
      }
    }

    if (!isDuplicate) {
      // Add all keys for this event
      keys.forEach(key => seen.set(key, event))
    } else {
      // Keep the event with better image or more complete data
      const existing = seen.get(existingKey)
      if (shouldReplaceEvent(existing, event)) {
        keys.forEach(key => seen.set(key, event))
      }
    }
  }

  // Return unique events
  const uniqueEvents = Array.from(new Set(seen.values()))

  logger.info("Event deduplication completed", {
    component: "EnhancedEventsAPI",
    action: "deduplication",
    metadata: {
      originalCount: events.length,
      uniqueCount: uniqueEvents.length,
      duplicatesRemoved: events.length - uniqueEvents.length,
      duplicateKeys: duplicateKeys.size
    }
  })

  return uniqueEvents
}

// Helper function to determine which event to keep when duplicates are found
function shouldReplaceEvent(existing: any, candidate: any): boolean {
  // Prefer events with real images over placeholder images
  const existingHasRealImage = existing.image &&
    !existing.image.includes('/community-event.png') &&
    !existing.image.includes('/images/categories/')

  const candidateHasRealImage = candidate.image &&
    !candidate.image.includes('/community-event.png') &&
    !candidate.image.includes('/images/categories/')

  if (candidateHasRealImage && !existingHasRealImage) return true
  if (existingHasRealImage && !candidateHasRealImage) return false

  // Prefer events with more complete descriptions
  const existingDescLength = existing.description?.length || 0
  const candidateDescLength = candidate.description?.length || 0

  if (candidateDescLength > existingDescLength * 1.5) return true
  if (existingDescLength > candidateDescLength * 1.5) return false

  // Prefer events with coordinates
  if (candidate.coordinates && !existing.coordinates) return true
  if (existing.coordinates && !candidate.coordinates) return false

  // Prefer events with ticket links
  const existingTicketLinks = existing.ticketLinks?.length || 0
  const candidateTicketLinks = candidate.ticketLinks?.length || 0

  if (candidateTicketLinks > existingTicketLinks) return true

  return false
}

// Sort events by relevance
function sortEventsByRelevance(events: any[], context: {
  userLat?: number
  userLng?: number
  userKeyword?: string
  userCategory?: string
}): any[] {
  return events.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // Distance scoring (closer is better)
    if (context.userLat && context.userLng) {
      const distanceA = calculateDistance(
        context.userLat, context.userLng,
        a.coordinates?.lat || context.userLat,
        a.coordinates?.lng || context.userLng
      )
      const distanceB = calculateDistance(
        context.userLat, context.userLng,
        b.coordinates?.lat || context.userLat,
        b.coordinates?.lng || context.userLng
      )

      // Closer events get higher scores
      scoreA += Math.max(0, 50 - distanceA)
      scoreB += Math.max(0, 50 - distanceB)
    }

    // Keyword relevance scoring
    if (context.userKeyword) {
      const keywordLower = context.userKeyword.toLowerCase()
      const titleA = a.title?.toLowerCase() || ''
      const titleB = b.title?.toLowerCase() || ''
      const descA = a.description?.toLowerCase() || ''
      const descB = b.description?.toLowerCase() || ''

      if (titleA.includes(keywordLower)) scoreA += 30
      if (titleB.includes(keywordLower)) scoreB += 30
      if (descA.includes(keywordLower)) scoreA += 10
      if (descB.includes(keywordLower)) scoreB += 10
    }

    // Category relevance scoring
    if (context.userCategory) {
      const categoryLower = context.userCategory.toLowerCase()
      const catA = a.category?.toLowerCase() || ''
      const catB = b.category?.toLowerCase() || ''

      if (catA.includes(categoryLower)) scoreA += 25
      if (catB.includes(categoryLower)) scoreB += 25
    }

    // Image quality scoring
    const hasRealImageA = a.image &&
      !a.image.includes('/community-event.png') &&
      !a.image.includes('/images/categories/')
    const hasRealImageB = b.image &&
      !b.image.includes('/community-event.png') &&
      !b.image.includes('/images/categories/')

    if (hasRealImageA) scoreA += 15
    if (hasRealImageB) scoreB += 15

    // Date proximity scoring (sooner events get slight preference)
    const dateA = new Date(a.date || Date.now())
    const dateB = new Date(b.date || Date.now())
    const now = new Date()

    const daysFromNowA = Math.abs((dateA.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromNowB = Math.abs((dateB.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Events within the next 30 days get bonus points
    if (daysFromNowA <= 30) scoreA += Math.max(0, 10 - daysFromNowA / 3)
    if (daysFromNowB <= 30) scoreB += Math.max(0, 10 - daysFromNowB / 3)

    return scoreB - scoreA // Higher scores first
  })
}

// Simple distance calculation function
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
