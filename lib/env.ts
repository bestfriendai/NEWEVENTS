// Client-side environment variables (prefixed with NEXT_PUBLIC_)
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  // Removed NEXT_PUBLIC_EVENTBRITE_API_KEY from client environment
  NEXT_PUBLIC_PREDICTHQ_API_KEY: process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || "",
} as const

// Server-side environment variables (only accessible on server)
export const serverEnv = {
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "real-time-events-search.p.rapidapi.com",
  TOMTOM_API_KEY: process.env.TOMTOM_API_KEY || "",
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY || "",
  TICKETMASTER_SECRET: process.env.TICKETMASTER_SECRET || "",
  EVENTBRITE_API_KEY: process.env.EVENTBRITE_API_KEY || process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY || "", // Use NEXT_PUBLIC version as fallback on server only
  EVENTBRITE_CLIENT_SECRET: process.env.EVENTBRITE_CLIENT_SECRET || "",
  EVENTBRITE_PRIVATE_TOKEN: process.env.EVENTBRITE_PRIVATE_TOKEN || "",
  EVENTBRITE_PUBLIC_TOKEN: process.env.EVENTBRITE_PUBLIC_TOKEN || "",
  PREDICTHQ_API_KEY: process.env.PREDICTHQ_API_KEY || process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  MAPBOX_API_KEY: process.env.MAPBOX_API_KEY || "", // Server-side only
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const

// Combined environment for backward compatibility (use with caution)
export const env = {
  ...clientEnv,
  ...serverEnv,
} as const

// API Configuration for server-side usage
export const API_CONFIG = {
  ticketmaster: {
    baseUrl: "https://app.ticketmaster.com/discovery/v2",
    apiKey: serverEnv.TICKETMASTER_API_KEY,
  },
  eventbrite: {
    baseUrl: "https://www.eventbriteapi.com/v3",
    apiKey: serverEnv.EVENTBRITE_API_KEY, // Only use server-side key
    privateToken: serverEnv.EVENTBRITE_PRIVATE_TOKEN,
  },
  rapidapi: {
    baseUrl: "https://real-time-events-search.p.rapidapi.com",
    apiKey: serverEnv.RAPIDAPI_KEY,
    host: serverEnv.RAPIDAPI_HOST,
    key: serverEnv.RAPIDAPI_KEY, // Alias for compatibility
  },
  predicthq: {
    baseUrl: "https://api.predicthq.com/v1",
    apiKey: serverEnv.PREDICTHQ_API_KEY,
  },
  tomtom: {
    baseUrl: "https://api.tomtom.com",
    apiKey: serverEnv.TOMTOM_API_KEY,
  },
  mapbox: {
    apiKey: serverEnv.MAPBOX_API_KEY, // Server-side only
  },
  maps: {
    mapbox: {
      apiKey: serverEnv.MAPBOX_API_KEY, // Server-side only
    },
    tomtom: {
      apiKey: serverEnv.TOMTOM_API_KEY,
    },
  },
  supabase: {
    url: clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
} as const

// Server configuration function for API routes
export function getServerConfig() {
  return {
    ticketmaster: {
      baseUrl: API_CONFIG.ticketmaster.baseUrl,
      apiKey: API_CONFIG.ticketmaster.apiKey,
    },
    eventbrite: {
      baseUrl: API_CONFIG.eventbrite.baseUrl,
      apiKey: API_CONFIG.eventbrite.apiKey,
      privateToken: API_CONFIG.eventbrite.privateToken,
    },
    rapidapi: {
      baseUrl: API_CONFIG.rapidapi.baseUrl,
      apiKey: API_CONFIG.rapidapi.apiKey,
      host: API_CONFIG.rapidapi.host,
    },
    predicthq: {
      baseUrl: API_CONFIG.predicthq.baseUrl,
      apiKey: API_CONFIG.predicthq.apiKey,
    },
    tomtom: {
      baseUrl: API_CONFIG.tomtom.baseUrl,
      apiKey: API_CONFIG.tomtom.apiKey,
    },
    supabase: {
      url: API_CONFIG.supabase.url,
      anonKey: API_CONFIG.supabase.anonKey,
    },
  }
}

// Client configuration function for client-side usage
export function getClientConfig() {
  return {
    supabase: {
      url: clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    // Removed eventbrite from client config
    predicthq: {
      apiKey: clientEnv.NEXT_PUBLIC_PREDICTHQ_API_KEY,
    },
  }
}

// Validated environment configuration
export const CLIENT_CONFIG = getClientConfig()

// Validate required environment variables
export function validateEnv() {
  const requiredClientVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const
  const requiredServerVars = [] as const // Add required server vars here

  const missingClient = requiredClientVars.filter((key) => !clientEnv[key])
  const missingServer = requiredServerVars.filter((key) => !serverEnv[key])

  const missing = [...missingClient, ...missingServer]

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
  }

  return {
    isValid: missing.length === 0,
    missing,
    missingClient,
    missingServer,
  }
}

// Validated environment configuration
export function getValidatedEnv() {
  const validation = validateEnv()

  if (!validation.isValid) {
    const errorMessage = `Environment validation failed:\n${validation.missing.map((key) => `${key}: Required`).join("\n")}`

    // In development, just warn instead of throwing
    if (typeof window === "undefined" && serverEnv.NODE_ENV === "development") {
      console.warn(errorMessage)
      return API_CONFIG
    }

    // Don't throw on client side
    if (typeof window !== "undefined") {
      console.warn(errorMessage)
      return API_CONFIG
    }

    throw new Error(errorMessage)
  }

  return API_CONFIG
}

// Helper functions to check API key availability
export function hasTicketmasterApiKey(): boolean {
  return !!serverEnv.TICKETMASTER_API_KEY
}

export function hasEventbriteApiKey(): boolean {
  // Only check server-side keys
  return !!(serverEnv.EVENTBRITE_PRIVATE_TOKEN || serverEnv.EVENTBRITE_API_KEY)
}

export function hasPredictHQApiKey(): boolean {
  return !!(serverEnv.PREDICTHQ_API_KEY || clientEnv.NEXT_PUBLIC_PREDICTHQ_API_KEY)
}

export function hasRapidApiKey(): boolean {
  return !!serverEnv.RAPIDAPI_KEY
}

export function hasMapboxApiKey(): boolean {
  return !!serverEnv.MAPBOX_API_KEY
}

export function hasTomTomApiKey(): boolean {
  return !!serverEnv.TOMTOM_API_KEY
}

// Export the validated config as default
export default getValidatedEnv()
