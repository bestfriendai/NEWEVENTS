import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { Ratelimit } from "@upstash/ratelimit"
import { searchEvents } from "@/lib/events"
import { logger } from "@/lib/logger"
import { memoryCache } from "@/lib/cache"

export const runtime = "edge"

// Basic rate limit setup
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "10 s"), // 5 requests per 10 seconds
  analytics: true,
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchTerm = searchParams.get("searchTerm") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

  const identifier = request.ip ?? "127.0.0.1" // Use IP address for rate limiting

  const { success, reset } = await ratelimit.limit(identifier)

  if (!success) {
    const now = Date.now()
    const retryAfter = Math.max(0, reset * 1000 - now) / 1000

    logger.warn(`Rate limit exceeded for IP: ${identifier}. Retry after: ${retryAfter} seconds`)

    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    })
  }

  try {
    // Check if we're hitting rate limits and return cached data if available
    const cacheKey = `events_${JSON.stringify(searchParams)}`
    const cachedResult = memoryCache.get(cacheKey)

    if (cachedResult) {
      logger.info("Returning cached events due to potential rate limiting")
      return NextResponse.json(cachedResult)
    }

    const { events, total } = await searchEvents({
      searchTerm,
      category,
      page,
      limit,
    })

    // Cache the result
    memoryCache.set(cacheKey, { events, total }, 5) // Cache for 5 seconds

    return NextResponse.json({ events, total })
  } catch (e: any) {
    logger.error(`Error in GET /api/events: ${e.message}`, { error: e })
    return NextResponse.json({ message: "Internal server error", error: e.message }, { status: 500 })
  }
}
