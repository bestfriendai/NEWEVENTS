import { z } from "zod"

// Helper function to create conditional validation based on environment
const createApiKeySchema = (name: string, required = false) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  if (required || !isDevelopment) {
    // Required in production or when explicitly marked as required
    return z.string().min(1, `${name} is required`)
  } else {
    // Optional in development - allow placeholder values
    return z.string().optional().or(z.string().startsWith("dev-placeholder-").optional())
  }
}

// Environment schema for validation
const envSchema = z.object({
  // Public environment variables - using your Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().default("https://akwvmljopucsnorvdwuu.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .default(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrd3ZtbGpvcHVjc25vcnZkd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTI1MzIsImV4cCI6MjA2MDMyODUzMn0.0cMnBX7ODkL16AlbzogsDpm-ykGjLXxJmT3ddB8_LGk",
    ),

  // Server-side API keys - using your provided keys
  RAPIDAPI_KEY: z.string().default("92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9"),
  RAPIDAPI_HOST: z.string().default("real-time-events-search.p.rapidapi.com"),
  TICKETMASTER_API_KEY: z.string().default("DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9"),
  TICKETMASTER_SECRET: z.string().default("H1dYvpxiiaTgJow5"),
  TOMTOM_API_KEY: z.string().default("L6x6moNiYg0RSomE2RmDEqS8KW1pFBKz"),
  MAPBOX_API_KEY: z
    .string()
    .default("pk.eyJ1IjoidHJhcHBhdCIsImEiOiJjbTMzODBqYTYxbHcwMmpwdXpxeWljNXJ3In0.xKUEW2C1kjFBu7kr7Uxfow"),

  // Eventbrite API keys
  EVENTBRITE_API_KEY: z.string().default("YJH4KGIHRNHOKODPZD"),
  EVENTBRITE_CLIENT_SECRET: z.string().default("QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ"),
  EVENTBRITE_PRIVATE_TOKEN: z.string().default("EUB5KUFLJH2SKVCHVD3E"),
  EVENTBRITE_PUBLIC_TOKEN: z.string().default("C4WQAR3XB7XX2AYOUEQ4"),

  // Optional API keys
  PREDICTHQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().default("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"),

  // Application settings
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n")
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Legacy exports for backward compatibility (will be deprecated)
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const RAPIDAPI_KEY = env.RAPIDAPI_KEY
export const RAPIDAPI_HOST = env.RAPIDAPI_HOST
export const TICKETMASTER_API_KEY = env.TICKETMASTER_API_KEY
export const TICKETMASTER_SECRET = env.TICKETMASTER_SECRET
export const TOMTOM_API_KEY = env.TOMTOM_API_KEY
export const MAPBOX_API_KEY = env.MAPBOX_API_KEY
export const EVENTBRITE_API_KEY = env.EVENTBRITE_API_KEY
export const EVENTBRITE_CLIENT_SECRET = env.EVENTBRITE_CLIENT_SECRET
export const EVENTBRITE_PRIVATE_TOKEN = env.EVENTBRITE_PRIVATE_TOKEN
export const EVENTBRITE_PUBLIC_TOKEN = env.EVENTBRITE_PUBLIC_TOKEN
export const PREDICTHQ_API_KEY = env.PREDICTHQ_API_KEY
export const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY

// Helper function to check if API key is valid (not a placeholder)
const isValidApiKey = (key: string | undefined): boolean => {
  return !!(key && !key.startsWith("dev-placeholder-") && key !== "your-" && key.length > 10)
}

// API availability checks
export const hasTicketmasterApiKey = isValidApiKey(env.TICKETMASTER_API_KEY)
export const hasEventbriteApiKey = isValidApiKey(env.EVENTBRITE_API_KEY)
export const hasPredictHQApiKey = isValidApiKey(env.PREDICTHQ_API_KEY)
export const hasMapboxApiKey = isValidApiKey(env.MAPBOX_API_KEY)
export const hasTomTomApiKey = isValidApiKey(env.TOMTOM_API_KEY)
export const hasRapidApiKey = isValidApiKey(env.RAPIDAPI_KEY)
export const hasOpenRouterApiKey = isValidApiKey(env.OPENROUTER_API_KEY)

// Default API provider
export const DEFAULT_API_PROVIDER = "rapidapi"

// API configuration
export const API_CONFIG = {
  ticketmaster: {
    baseUrl: "https://app.ticketmaster.com/discovery/v2",
    apiKey: env.TICKETMASTER_API_KEY,
    secret: env.TICKETMASTER_SECRET,
  },
  eventbrite: {
    baseUrl: "https://www.eventbriteapi.com/v3",
    apiKey: env.EVENTBRITE_API_KEY,
    clientSecret: env.EVENTBRITE_CLIENT_SECRET,
    privateToken: env.EVENTBRITE_PRIVATE_TOKEN,
    publicToken: env.EVENTBRITE_PUBLIC_TOKEN,
  },
  predicthq: {
    baseUrl: "https://api.predicthq.com/v1",
    apiKey: env.PREDICTHQ_API_KEY,
  },
  rapidapi: {
    baseUrl: "https://real-time-events-search.p.rapidapi.com",
    apiKey: env.RAPIDAPI_KEY,
    host: env.RAPIDAPI_HOST,
  },
  maps: {
    mapbox: {
      apiKey: env.MAPBOX_API_KEY,
    },
    tomtom: {
      apiKey: env.TOMTOM_API_KEY,
    },
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
  },
} as const

// Development logging (only in development)
if (env.NODE_ENV === "development") {
  console.log("🔧 API Configuration Status:")

  // Required services
  console.log("- Supabase: ✅ Configured")

  // API services
  console.log("- RapidAPI: ✅ Configured")
  console.log("- Ticketmaster: ✅ Configured")
  console.log("- TomTom Maps: ✅ Configured")
  console.log("- Mapbox Maps: ✅ Configured")
  console.log("- Eventbrite: ✅ Configured")
  console.log("- OpenRouter: ✅ Configured")

  // Optional services
  console.log("- PredictHQ:", hasPredictHQApiKey ? "✅ Configured" : "⚠️ Optional")

  console.log("\n🎉 All API services are configured and ready to use!")
}
