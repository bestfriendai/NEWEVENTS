import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictRateLimit } from "@/lib/middleware/rate-limit"
import { rateLimiter } from "@/lib/services/rate-limiter"
import { logger } from "@/lib/utils/logger"

// Example: Basic rate limiting
export async function GET(request: NextRequest) {
  // Method 1: Using withRateLimit wrapper
  return withRateLimit(request, async () => {
    // Your API logic here
    const events = await fetchEvents()
    return NextResponse.json({ events })
  }, {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000 // 15 minutes
  })
}

// Example: Using pre-configured middleware
export async function POST(request: NextRequest) {
  // Method 2: Using pre-configured middleware
  const rateLimitResponse = await strictRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Your API logic here
  const data = await request.json()
  const result = await createEvent(data)
  return NextResponse.json({ result })
}

// Example: With API-specific rate limiting
export async function PUT(request: NextRequest) {
  // Method 3: Combined IP and API rate limiting
  return withRateLimit(request, async () => {
    // Use the rate limiter service for external API calls
    const result = await rateLimiter.executeApiCall(
      'ticketmaster',
      async () => {
        // Call external API
        return await fetchFromTicketmaster()
      },
      {
        retries: 3,
        timeout: 10000,
        priority: 'normal'
      }
    )

    return NextResponse.json({ result })
  })
}

// Helper functions (these would be your actual implementations)
async function fetchEvents() {
  // Implementation
  return []
}

async function createEvent(data: any) {
  // Implementation
  return { id: '123', ...data }
}

async function fetchFromTicketmaster() {
  // Implementation
  return { events: [] }
}