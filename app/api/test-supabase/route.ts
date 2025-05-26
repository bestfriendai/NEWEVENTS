import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/api/supabase-api"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Test the connection by getting the current timestamp using a simple query
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      tablesFound: data?.length || 0,
      sampleTable: data?.[0]?.table_name || null,
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (error) {
    console.error("Server-side Supabase test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
