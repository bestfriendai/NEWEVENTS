import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/api/supabase-api"
import { logger, logError } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logError(
        "Error getting session",
        error,
        {
          component: "auth-api",
          action: "get_session_error",
        }
      )

      return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
    }

    return NextResponse.json({ session: data.session })
  } catch (error) {
    logError(
      "Unexpected error in session route",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "auth-api",
        action: "session_route_error",
      }
    )

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
