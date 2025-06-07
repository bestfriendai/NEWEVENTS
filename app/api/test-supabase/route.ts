import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/api/supabase-api"

export async function GET() {
  try {
    // Test Supabase configuration
    const { env } = await import("@/lib/env")

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        message: "Supabase configuration missing",
        data: {
          hasUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Test basic connectivity by making a simple request to the Supabase REST API
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Supabase API error: ${response.status} ${response.statusText}`,
        data: {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data: {
        connected: true,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
        environment: {
          hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
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
