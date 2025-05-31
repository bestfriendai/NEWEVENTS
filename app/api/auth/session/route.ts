import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/api/supabase-api"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logger.error(
        "Error getting session",
        {
          component: "auth-api",
          action: "get_session_error",
        },
        error,
      )

      return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
    }

    return NextResponse.json({ session: data.session })
  } catch (error) {
    logger.error(
      "Unexpected error in session route",
      {
        component: "auth-api",
        action: "session_route_error",
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
