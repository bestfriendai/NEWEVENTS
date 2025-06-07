import { type NextRequest, NextResponse } from "next/server";
import { unifiedEventsService, type UnifiedEventSearchParams } from "@/lib/api/unified-events-service";
import { logger } from "@/lib/utils/logger";

// You can keep your validation function if you like
// For simplicity, using a basic one from the plan, can be expanded
function validateSearchParams(searchParams: URLSearchParams) {
    const params = Object.fromEntries(searchParams.entries());
    const errors: string[] = [];

    // Basic validation examples (expand as needed)
    const lat = params.lat ? Number(params.lat) : undefined;
    const lng = params.lng ? Number(params.lng) : undefined;
    const radius = params.radius ? Number(params.radius) : undefined;
    const limit = params.limit ? Number(params.limit) : undefined;
    const page = params.page ? Number(params.page) : undefined;

    if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
        errors.push("Invalid latitude parameter.");
    }
    if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
        errors.push("Invalid longitude parameter.");
    }
    if (radius !== undefined && (isNaN(radius) || radius < 0)) {
        errors.push("Invalid radius parameter.");
    }
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 200)) {
        errors.push("Invalid limit parameter (1-200).");
    }
    if (page !== undefined && (isNaN(page) || page < 0)) {
        errors.push("Invalid page parameter.");
    }
    // Add more validation for other params like query, startDate, endDate, etc.

    const validatedParams: UnifiedEventSearchParams = {
        query: params.query,
        keyword: params.keyword || params.query, // Allow keyword as alias
        lat: lat,
        lng: lng,
        radius: radius,
        startDate: params.startDate,
        endDate: params.endDate,
        category: params.category,
        limit: limit,
        page: page,
        sortBy: params.sortBy as UnifiedEventSearchParams['sortBy'],
        sortOrder: params.sortOrder as UnifiedEventSearchParams['sortOrder'],
        // ... map other relevant params from URLSearchParams to UnifiedEventSearchParams
    };
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        params: validatedParams
    };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Validate Parameters
  const validation = validateSearchParams(searchParams);
  if (!validation.isValid) {
    return NextResponse.json({ success: false, error: "Invalid parameters", details: validation.errors }, { status: 400 });
  }

  // 2. Call the Unified Service
  try {
    // Make sure validation.params aligns with UnifiedEventSearchParams
    const result = await unifiedEventsService.searchEvents(validation.params);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("API route /api/events failed", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
