// Environment variables validation
export const env = {
  NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  NEXT_PUBLIC_TICKETMASTER_API_KEY: process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY || "",
  NEXT_PUBLIC_EVENTBRITE_API_KEY: process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY || "",
  NEXT_PUBLIC_PREDICTHQ_API_KEY: process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || "",
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "",
  TOMTOM_API_KEY: process.env.TOMTOM_API_KEY || "",
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY || "",
  TICKETMASTER_SECRET: process.env.TICKETMASTER_SECRET || "",
  EVENTBRITE_API_KEY: process.env.EVENTBRITE_API_KEY || "",
  EVENTBRITE_CLIENT_SECRET: process.env.EVENTBRITE_CLIENT_SECRET || "",
  EVENTBRITE_PRIVATE_TOKEN: process.env.EVENTBRITE_PRIVATE_TOKEN || "",
  EVENTBRITE_PUBLIC_TOKEN: process.env.EVENTBRITE_PUBLIC_TOKEN || "",
  PREDICTHQ_API_KEY: process.env.PREDICTHQ_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
} as const

// Validate required environment variables
export function validateEnv() {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const

  const missing = requiredVars.filter((key) => !env[key])

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
  }

  return {
    isValid: missing.length === 0,
    missing,
  }
}
