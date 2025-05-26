import { z } from "zod"

// Client-side environment schema (only public variables)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_API_KEY: z.string().min(1, "Mapbox API key is required").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Server-side environment schema (all variables)
const serverEnvSchema = z.object({
  // Public variables (available on client)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_API_KEY: z.string().min(1, "Mapbox API key is required").optional(),

  // Server-only variables
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().optional(),
  TICKETMASTER_API_KEY: z.string().optional(),
  TICKETMASTER_SECRET: z.string().optional(),
  TOMTOM_API_KEY: z.string().optional(),
  EVENTBRITE_API_KEY: z.string().optional(),
  EVENTBRITE_CLIENT_SECRET: z.string().optional(),
  EVENTBRITE_PRIVATE_TOKEN: z.string().optional(),
  EVENTBRITE_PUBLIC_TOKEN: z.string().optional(),
  PREDICTHQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Updated configuration with your provided API keys
const DEFAULT_CONFIG = {
  // Public variables (safe for client)
  NEXT_PUBLIC_SUPABASE_URL: "https://ejsllpjzxnbndrrfpjkz.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xscGp6eG5ibmRycmZwamt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTYxNDYsImV4cCI6MjA2MzQ5MjE0Nn0.uFthMUbM4dkOqlxGWC2tVoTjo_5b9VmvhnYdXWnlLXU",
  NEXT_PUBLIC_MAPBOX_API_KEY:
    "pk.eyJ1IjoidHJhcHBhdCIsImEiOiJjbTMzODBqYTYxbHcwMmpwdXpxeWljNXJ3In0.xKUEW2C1kjFBu7kr7Uxfow",

  // Server-only variables with your provided keys
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xscGp6eG5ibmRycmZwamt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjE0NiwiZXhwIjoyMDYzNDkyMTQ2fQ.xY9lTBSgy6A7YPor5I3n26MN4w-8x86eb-XqQIP1dDs",
  SUPABASE_JWT_SECRET: "TPyRzZHjqE7Hnrwy7cLadLWBwukoHMIxbWj8RxlH3cJbCdvcNpQaJwr5hJq1VMdQ3fleq8Is9Y30puos8/J4Lw==",
  RAPIDAPI_KEY: "92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9",
  RAPIDAPI_HOST: "real-time-events-search.p.rapidapi.com",
  TOMTOM_API_KEY: "L6x6moNiYg0RSomE2RmDEqS8KW1pFBKz",
  TICKETMASTER_API_KEY: "DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9",
  TICKETMASTER_SECRET: "H1dYvpxiiaTgJow5",
  EVENTBRITE_API_KEY: "YJH4KGIHRNHOKODPZD",
  EVENTBRITE_CLIENT_SECRET: "QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ",
  EVENTBRITE_PRIVATE_TOKEN: "EUB5KUFLJH2SKVCHVD3E",
  EVENTBRITE_PUBLIC_TOKEN: "C4WQAR3XB7XX2AYOUEQ4",
  OPENROUTER_API_KEY: "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",
  LOG_LEVEL: "info" as const,
  NODE_ENV: "development" as const,
}

// Check if we're on the client side
const isClient = typeof window !== "undefined"

// Cache for validated environment variables
let _clientEnvCache: z.infer<typeof clientEnvSchema> | undefined = undefined
let _serverEnvCache: z.infer<typeof serverEnvSchema> | undefined = undefined

// Function to get client-side environment variables
function getClientEnv(): z.infer<typeof clientEnvSchema> {
  if (_clientEnvCache === undefined) {
    try {
      _clientEnvCache = clientEnvSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_CONFIG.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || DEFAULT_CONFIG.NEXT_PUBLIC_MAPBOX_API_KEY,
        NODE_ENV: process.env.NODE_ENV || DEFAULT_CONFIG.NODE_ENV,
      })
    } catch (error) {
      console.warn("Using default client configuration")
      _clientEnvCache = {
        NEXT_PUBLIC_SUPABASE_URL: DEFAULT_CONFIG.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: DEFAULT_CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_MAPBOX_API_KEY: DEFAULT_CONFIG.NEXT_PUBLIC_MAPBOX_API_KEY,
        NODE_ENV: DEFAULT_CONFIG.NODE_ENV,
      }
    }
  }
  return _clientEnvCache!
}

// Function to get server-side environment variables
function getServerEnv(): z.infer<typeof serverEnvSchema> {
  if (isClient) {
    throw new Error("Server environment variables cannot be accessed on the client")
  }

  if (_serverEnvCache === undefined) {
    try {
      _serverEnvCache = serverEnvSchema.parse(process.env)
    } catch (error) {
      console.warn("Using default server configuration with provided API keys")
      _serverEnvCache = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_CONFIG.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || DEFAULT_CONFIG.NEXT_PUBLIC_MAPBOX_API_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || DEFAULT_CONFIG.SUPABASE_JWT_SECRET,
        RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || DEFAULT_CONFIG.RAPIDAPI_KEY,
        RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || DEFAULT_CONFIG.RAPIDAPI_HOST,
        TOMTOM_API_KEY: process.env.TOMTOM_API_KEY || DEFAULT_CONFIG.TOMTOM_API_KEY,
        TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY || DEFAULT_CONFIG.TICKETMASTER_API_KEY,
        TICKETMASTER_SECRET: process.env.TICKETMASTER_SECRET || DEFAULT_CONFIG.TICKETMASTER_SECRET,
        EVENTBRITE_API_KEY: process.env.EVENTBRITE_API_KEY || DEFAULT_CONFIG.EVENTBRITE_API_KEY,
        EVENTBRITE_CLIENT_SECRET: process.env.EVENTBRITE_CLIENT_SECRET || DEFAULT_CONFIG.EVENTBRITE_CLIENT_SECRET,
        EVENTBRITE_PRIVATE_TOKEN: process.env.EVENTBRITE_PRIVATE_TOKEN || DEFAULT_CONFIG.EVENTBRITE_PRIVATE_TOKEN,
        EVENTBRITE_PUBLIC_TOKEN: process.env.EVENTBRITE_PUBLIC_TOKEN || DEFAULT_CONFIG.EVENTBRITE_PUBLIC_TOKEN,
        PREDICTHQ_API_KEY: process.env.PREDICTHQ_API_KEY,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || DEFAULT_CONFIG.OPENROUTER_API_KEY,
        LOG_LEVEL: (process.env.LOG_LEVEL as any) || DEFAULT_CONFIG.LOG_LEVEL,
        NODE_ENV: (process.env.NODE_ENV as any) || DEFAULT_CONFIG.NODE_ENV,
      }
    }
  }
  return _serverEnvCache!
}

// Export appropriate environment based on context
export const env = isClient ? getClientEnv() : getServerEnv()

// Client-safe API configuration
export const CLIENT_CONFIG = {
  supabase: {
    url: getClientEnv().NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: getClientEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
  mapbox: {
    apiKey: getClientEnv().NEXT_PUBLIC_MAPBOX_API_KEY || "",
  },
} as const

// Server-only API configuration with your provided keys
export const getServerConfig = () => {
  if (isClient) {
    throw new Error("Server configuration cannot be accessed on the client")
  }

  const serverEnv = getServerEnv()
  return {
    ticketmaster: {
      baseUrl: "https://app.ticketmaster.com/discovery/v2",
      apiKey: serverEnv.TICKETMASTER_API_KEY || DEFAULT_CONFIG.TICKETMASTER_API_KEY,
      secret: serverEnv.TICKETMASTER_SECRET || DEFAULT_CONFIG.TICKETMASTER_SECRET,
    },
    eventbrite: {
      baseUrl: "https://www.eventbriteapi.com/v3",
      apiKey: serverEnv.EVENTBRITE_API_KEY || DEFAULT_CONFIG.EVENTBRITE_API_KEY,
      clientSecret: serverEnv.EVENTBRITE_CLIENT_SECRET || DEFAULT_CONFIG.EVENTBRITE_CLIENT_SECRET,
      privateToken: serverEnv.EVENTBRITE_PRIVATE_TOKEN || DEFAULT_CONFIG.EVENTBRITE_PRIVATE_TOKEN,
      publicToken: serverEnv.EVENTBRITE_PUBLIC_TOKEN || DEFAULT_CONFIG.EVENTBRITE_PUBLIC_TOKEN,
    },
    rapidapi: {
      baseUrl: "https://real-time-events-search.p.rapidapi.com",
      apiKey: serverEnv.RAPIDAPI_KEY || DEFAULT_CONFIG.RAPIDAPI_KEY,
      host: serverEnv.RAPIDAPI_HOST || DEFAULT_CONFIG.RAPIDAPI_HOST,
    },
    tomtom: {
      baseUrl: "https://api.tomtom.com",
      apiKey: serverEnv.TOMTOM_API_KEY || DEFAULT_CONFIG.TOMTOM_API_KEY,
    },
    openrouter: {
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: serverEnv.OPENROUTER_API_KEY || DEFAULT_CONFIG.OPENROUTER_API_KEY,
    },
  } as const
}

// Helper functions
const isValidApiKey = (key: string | undefined): boolean => {
  return !!(key && key.length > 10)
}

// Client-safe availability checks
export const hasMapboxApiKey = isValidApiKey(CLIENT_CONFIG.mapbox.apiKey)
export const hasSupabaseConfig = !!(CLIENT_CONFIG.supabase.url && CLIENT_CONFIG.supabase.anonKey)

// Development logging (client-safe)
if (env.NODE_ENV === "development" && isClient) {
  console.log("🗺️ API Configuration Status:")
  console.log("- Mapbox:", hasMapboxApiKey ? "✅ Configured" : "❌ Missing")
  console.log("- Supabase:", hasSupabaseConfig ? "✅ Configured" : "❌ Missing")

  if (hasMapboxApiKey) {
    console.log("🎉 Interactive map will be available!")
  } else {
    console.log("📱 Fallback grid view will be used")
  }
}

// Export API configuration for easy access
export const API_CONFIG = {
  mapbox: {
    apiKey: DEFAULT_CONFIG.NEXT_PUBLIC_MAPBOX_API_KEY,
  },
  tomtom: {
    apiKey: DEFAULT_CONFIG.TOMTOM_API_KEY,
  },
  rapidapi: {
    key: DEFAULT_CONFIG.RAPIDAPI_KEY,
    host: DEFAULT_CONFIG.RAPIDAPI_HOST,
  },
  ticketmaster: {
    apiKey: DEFAULT_CONFIG.TICKETMASTER_API_KEY,
    secret: DEFAULT_CONFIG.TICKETMASTER_SECRET,
  },
  eventbrite: {
    apiKey: DEFAULT_CONFIG.EVENTBRITE_API_KEY,
    privateToken: DEFAULT_CONFIG.EVENTBRITE_PRIVATE_TOKEN,
  },
}

// Server-only API key availability checks (for server components)
export const getServerApiKeyStatus = () => {
  if (isClient) {
    return {
      hasTicketmasterApiKey: false,
      hasEventbriteApiKey: false,
      hasPredictHQApiKey: false,
    }
  }

  const serverConfig = getServerConfig()
  return {
    hasTicketmasterApiKey: isValidApiKey(serverConfig.ticketmaster.apiKey),
    hasEventbriteApiKey: isValidApiKey(serverConfig.eventbrite.apiKey),
    hasPredictHQApiKey: isValidApiKey(process.env.PREDICTHQ_API_KEY),
  }
}

// Named exports for API key availability
export const hasTicketmasterApiKey = isValidApiKey(DEFAULT_CONFIG.TICKETMASTER_API_KEY)
export const hasEventbriteApiKey = isValidApiKey(DEFAULT_CONFIG.EVENTBRITE_API_KEY)
export const hasPredictHQApiKey = isValidApiKey(process.env.PREDICTHQ_API_KEY || "")
