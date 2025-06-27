import { type NextRequest, NextResponse } from "next/server"
import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"
import { memoryCache } from "@/lib/utils/cache"
import { z } from "zod"

export const runtime = "nodejs"

// Helper for boolean string coercion
const booleanCoercion = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true
    if (val.toLowerCase() === "false") return false
  }
  return val
}, z.boolean())

// Zod schema for ISO date string validation using the existing isValidDateString function
const isoDateStringUsingExternalValidatorSchema = z.string().refine(isValidDateString, {
  message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)",
})

const enhancedEventSearchSchema = z
  .object({
    query: z.string().max(200, "Search term too long (max 200 characters)").default(""),
    location: z.string().default(""),
    category: z.string().default("all"),
    categories: z.array(z.string()).default([]),
    page: z.coerce.number().int().nonnegative("Page must be non-negative").default(0),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be between 1 and 100")
      .max(100, "Limit must be between 1 and 100")
      .default(20),
    offset: z.coerce.number().int().nonnegative("Offset must be non-negative").optional(),
    lat: z.coerce
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional(),
    lng: z.coerce
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional(),
    radius: z.coerce
      .number()
      .int()
      .min(1, "Radius must be between 1 and 500 km")
      .max(500, "Radius must be between 1 and 500 km")
      .default(25),
    priceMin: z.coerce.number().nonnegative("Minimum price must be non-negative").optional(),
    priceMax: z.coerce.number().nonnegative("Maximum price must be non-negative").optional(),
    sortBy: z.enum(["date", "distance", "popularity", "price", "relevance"]).default("date"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    tags: z.array(z.string()).default([]),
    source: z.enum(["all", "rapidapi", "ticketmaster", "eventbrite"]).default("all"),
    hasImages: booleanCoercion.default(false),
    hasDescription: booleanCoercion.default(false),
    forceRefresh: booleanCoercion.default(false),
    startDate: isoDateStringUsingExternalValidatorSchema.optional(),
    endDate: isoDateStringUsingExternalValidatorSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.priceMin !== undefined && data.priceMax !== undefined && data.priceMin > data.priceMax) {
        return false
      }
      return true
    },
    {
      message: "Minimum price cannot be greater than maximum price",
      path: ["priceMin"],
    },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        return false
      }
      return true
    },
    {
      message: "Start date cannot be after end date",
      path: ["startDate"],
    },
  )

// New validation function using Zod
function zodValidateEnhancedEventSearchParams(params: any) {
  const result = enhancedEventSearchSchema.safeParse(params)
  if (result.success) {
    return {
      success: true,
      errors: [],
      params: result.data,
    }
  } else {
    const errors = result.error.issues.map((issue) => {
      // You can customize error messages further if needed, e.g., by including the path
      // return `${issue.path.join('.')} - ${issue.message}`;
      return issue.message
    })
    return {
      success: false,
      errors: errors,
      // Return the original params, or the (partially) parsed data if you prefer
      // For now, returning original params on failure to align with previous behavior of having params available
      params: params,
    }
  }
}

// Helper function to validate date strings
function isValidDateString(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && dateString.includes("T") // Basic ISO format check
  } catch {
    return false
  }
}

// Legacy validation function for backward compatibility
function validateSearchParams(searchParams: URLSearchParams) {
  const errors: string[] = []

  const searchTerm = searchParams.get("searchTerm") || searchParams.get("keyword") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "0", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : undefined
  const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : undefined
  const radius = Number.parseInt(searchParams.get("radius") || "25", 10)

  // Validate search term length
  if (searchTerm.length > 200) {
    errors.push("Search term too long (max 200 characters)")
  }

  // Validate pagination
  if (page < 0) {
    errors.push("Page must be non-negative")
  }
  if (limit < 1 || limit > 100) {
    errors.push("Limit must be between 1 and 100")
  }

  // Validate coordinates
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    errors.push("Latitude must be between -90 and 90")
  }
  if (lng !== undefined && (lng < -180 || lng > 180)) {
    errors.push("Longitude must be between -180 and 180")
  }

  // Validate radius
  if (radius < 1 || radius > 500) {
    errors.push("Radius must be between 1 and 500 km")
  }

  return {
    isValid: errors.length === 0,
    errors,
    params: {
      searchTerm,
      category,
      page,
      limit,
      lat,
      lng,
      radius,
    },
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // Parse enhanced parameters
    const enhancedParams = {
      query: searchParams.get("query") || searchParams.get("searchTerm") || searchParams.get("keyword") || "",
      location: searchParams.get("location") || "",
      category: searchParams.get("category") || "all",
      categories: searchParams.get("categories") ? searchParams.get("categories")!.split(",") : [],
      page: searchParams.get("page") || "0",
      limit: searchParams.get("limit") || "20",
      offset: searchParams.get("offset"),
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius") || "25",
      priceMin: searchParams.get("priceMin"),
      priceMax: searchParams.get("priceMax"),
      sortBy: searchParams.get("sortBy") || "date",
      sortOrder: searchParams.get("sortOrder") || "asc",
      tags: searchParams.get("tags") ? searchParams.get("tags")!.split(",") : [],
      source: searchParams.get("source") || "all",
      hasImages: searchParams.get("hasImages") || "false",
      hasDescription: searchParams.get("hasDescription") || "false",
      forceRefresh: searchParams.get("forceRefresh") || "false",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    }

    // Determine which validation to use (this logic might need to be revisited based on how useEnhancedValidation is set)
    // For now, assuming 'useEnhancedValidation' is a boolean flag defined elsewhere or intended to be.
    // If it's always true for this path, this conditional can be simplified.
    const useEnhancedValidation = true // Placeholder: Determine actual logic for this flag if it varies

    const validation = useEnhancedValidation
      ? zodValidateEnhancedEventSearchParams(enhancedParams) // Use the object with all parsed params
      : validateSearchParams(searchParams) // Legacy validator uses raw URLSearchParams

    if (!('success' in validation ? validation.success : validation.isValid)) {
      logger.warn("Invalid search parameters", {
        component: "EventsAPI",
        action: "GET",
        errors: validation.errors,
      })
      return NextResponse.json(
        {
          success: false,
          message: "Invalid parameters",
          errors: validation.errors,
        },
        { status: 400 },
      )
    }

    const validatedParams = validation.params

    logger.info("Enhanced Events API request", {
      component: "EventsAPI",
      action: "GET",
      metadata: validatedParams,
    })

    // Create cache key (skip if force refresh)
    const cacheKey = `enhanced_events_${JSON.stringify(validatedParams)}`

    if (!validatedParams.forceRefresh) {
      const cachedResult = memoryCache.get(cacheKey)
      if (cachedResult) {
        logger.info("Returning cached events", {
          component: "EventsAPI",
          action: "cache_hit",
          cacheKey,
        })
        return NextResponse.json({
          ...(cachedResult as object),
          cached: true,
          responseTime: Date.now() - startTime,
        })
      }
    }

    // Convert to unified service parameters
    // Handle location parameter - if location is provided without coordinates, use it as query
    let enhancedQuery = validatedParams.query
    if (validatedParams.location && !validatedParams.lat && !validatedParams.lng) {
      // If we have a location string but no coordinates, include it in the query
      enhancedQuery = validatedParams.query 
        ? `${validatedParams.query} ${validatedParams.location}`.trim() 
        : validatedParams.location
    }

    const unifiedParams = {
      query: enhancedQuery || undefined,
      lat: validatedParams.lat,
      lng: validatedParams.lng,
      radius: validatedParams.radius,
      category: validatedParams.category !== "all" ? validatedParams.category : undefined,
      categories: validatedParams.categories.length > 0 ? validatedParams.categories : undefined,
      startDate: validatedParams.startDate,
      endDate: validatedParams.endDate,
      priceMin: validatedParams.priceMin,
      priceMax: validatedParams.priceMax,
      sortBy: validatedParams.sortBy,
      sortOrder: validatedParams.sortOrder,
      limit: validatedParams.limit,
      offset: validatedParams.offset || validatedParams.page * validatedParams.limit,
      tags: validatedParams.tags.length > 0 ? validatedParams.tags : undefined,
      source: validatedParams.source !== "all" ? validatedParams.source : undefined,
      hasImages: validatedParams.hasImages || undefined,
      hasDescription: validatedParams.hasDescription || undefined,
      forceRefresh: validatedParams.forceRefresh,
    }

    // Search events using unified service
    const result = await unifiedEventsService.searchEvents(unifiedParams)

    const response = {
      success: true,
      events: result.events,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      sources: result.sources,
      error: result.error,
      responseTime: Date.now() - startTime,
      cached: false,
      searchParams: validatedParams, // Include search params for debugging
    }

    // Cache successful results for 5 minutes (unless force refresh)
    if (!result.error && result.events.length > 0 && !validatedParams.forceRefresh) {
      memoryCache.set(cacheKey, response, 300)
    }

    logger.info("Enhanced Events API response", {
      component: "EventsAPI",
      action: "success",
      metadata: {
        eventsCount: result.events.length,
        sources: result.sources,
        responseTime: response.responseTime,
        searchParams: validatedParams,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    logger.error("Enhanced Events API error", {
      component: "EventsAPI",
      action: "error",
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime,
    })

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: errorMessage,
        events: [],
        totalCount: 0,
        hasMore: false,
        sources: { rapidapi: 0, ticketmaster: 0, cached: 0 },
        responseTime,
      },
      { status: 500 },
    )
  }
}
