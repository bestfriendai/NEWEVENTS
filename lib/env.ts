import { z } from "zod"


// Environment schema for validation - NO HARDCODED KEYS
const envSchema = z.object({
  // Public environment variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anonymous key is required"),

  // Server-side API keys - all from environment variables
  RAPIDAPI_KEY: z.string().min(1, "RapidAPI key is required"),
  RAPIDAPI_HOST: z.string().min(1, "RapidAPI host is required"),
  TICKETMASTER_API_KEY: z.string().min(1, "Ticketmaster API key is required"),
  TICKETMASTER_SECRET: z.string().min(1, "Ticketmaster secret is required"),
  // IMPORTANT: TOMTOM_API_KEY is exposed client-side for map rendering.
  // To prevent billing abuse, ensure you have configured strict domain/referrer restrictions
  // in your TomTom developer account dashboard.
  TOMTOM_API_KEY: z.string().min(1, "TomTom API key is required"),
  // IMPORTANT: MAPBOX_API_KEY is exposed client-side for map rendering.
  // To prevent billing abuse, ensure you have configured strict domain/referrer restrictions
  // (e.g., URL restrictions) in your Mapbox account dashboard.
  MAPBOX_API_KEY: z.string().min(1, "Mapbox API key is required"),

  // Eventbrite API keys
  EVENTBRITE_API_KEY: z.string().min(1, "Eventbrite API key is required"),
  EVENTBRITE_CLIENT_SECRET: z.string().min(1, "Eventbrite client secret is required"),
  EVENTBRITE_PRIVATE_TOKEN: z.string().min(1, "Eventbrite private token is required"),

  // Optional API keys
  PREDICTHQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // Application settings
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Cache for validated environment variables.
// This variable will hold the parsed and validated environment configuration
// after the first successful validation, preventing redundant processing.
let _envCache: z.infer<typeof envSchema> | undefined = undefined;

// Function to parse, validate, and memoize environment variables.
// This ensures that the potentially expensive parsing and validation
// logic (using Zod) runs only once during the application's lifecycle.
// Subsequent calls will return the cached result.
function getValidatedEnv(): z.infer<typeof envSchema> {
  if (_envCache === undefined) { // Check if validation has already occurred
    try {
      _envCache = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
        // Log more visibly for critical startup errors, as these prevent correct app functioning.
        console.error("❌ FATAL: Environment validation failed. Application cannot start correctly.");
        console.error("Missing or invalid environment variables:\n" + missingVars);
        // Re-throw the error to halt execution or allow higher-level error handling.
        throw new Error(`Environment validation failed:\n${missingVars}`);
      }
      // Catch and log any other unexpected errors during the critical validation phase.
      console.error("❌ FATAL: An unexpected error occurred during environment validation:", error);
      throw error; // Re-throw unexpected errors.
    }
  }
  // Non-null assertion is safe here because if _envCache was not populated due to an error,
  // an exception would have been thrown, and this line would not be reached.
  return _envCache!;
}

// Export validated environment variables
export const env = getValidatedEnv()

// Legacy exports have been removed. Access variables via the `env` object.

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
  console.log("🔧 API Configuration Status (Post-Initial Zod Validation):");

  const logEntries: { name: string, message: string, isRequired: boolean, isValid: boolean | null }[] = [];

  // Helper for required keys (guaranteed non-empty by Zod .min(1) if this block is reached)
  const getStatusForRequired = (keyNameForDisplay: string, keyValue: string): { message: string, isValid: boolean } => {
    if (isValidApiKey(keyValue)) {
      return { message: `✅ Configured & Valid`, isValid: true };
    } else {
      return { message: `⚠️ Configured but Potentially Invalid (check format/value, e.g., placeholder or too short)`, isValid: false };
    }
  };

  // Helper for optional keys
  const getStatusForOptional = (keyNameForDisplay: string, keyValue: string | undefined): { message: string, isValid: boolean | null } => {
    if (!keyValue) { // Optional key is not provided or is an empty string
      return { message: `❔ Optional: Not Configured`, isValid: null };
    }
    if (isValidApiKey(keyValue)) {
      return { message: `❔ Optional: ✅ Configured & Valid`, isValid: true };
    } else {
      return { message: `❔ Optional: ⚠️ Configured but Potentially Invalid (check format/value, e.g., placeholder or too short)`, isValid: false };
    }
  };

  // Supabase: If Zod validation passed (url, min(1)), these are considered configured.
  // No specific 'isValidApiKey' style check is applied here in the original logic beyond Zod.
  logEntries.push({ name: "Supabase (URL & Anon Key)", message: "✅ Configured (validated by Zod schema)", isRequired: true, isValid: true });

  // Required API Keys
  let statusRapidAPI = getStatusForRequired("RapidAPI", env.RAPIDAPI_KEY);
  logEntries.push({ name: "RapidAPI", message: statusRapidAPI.message, isRequired: true, isValid: statusRapidAPI.isValid });

  let statusTicketmaster = getStatusForRequired("Ticketmaster", env.TICKETMASTER_API_KEY);
  logEntries.push({ name: "Ticketmaster", message: statusTicketmaster.message, isRequired: true, isValid: statusTicketmaster.isValid });
  
  let statusTomTom = getStatusForRequired("TomTom Maps", env.TOMTOM_API_KEY);
  logEntries.push({ name: "TomTom Maps", message: statusTomTom.message, isRequired: true, isValid: statusTomTom.isValid });

  let statusMapbox = getStatusForRequired("Mapbox Maps", env.MAPBOX_API_KEY);
  logEntries.push({ name: "Mapbox Maps", message: statusMapbox.message, isRequired: true, isValid: statusMapbox.isValid });

  let statusEventbrite = getStatusForRequired("Eventbrite", env.EVENTBRITE_API_KEY);
  logEntries.push({ name: "Eventbrite", message: statusEventbrite.message, isRequired: true, isValid: statusEventbrite.isValid });

  // Optional API Keys (as per Zod schema)
  let optStatusOpenRouter = getStatusForOptional("OpenRouter", env.OPENROUTER_API_KEY);
  logEntries.push({ name: "OpenRouter", message: optStatusOpenRouter.message, isRequired: false, isValid: optStatusOpenRouter.isValid });

  let optStatusPredictHQ = getStatusForOptional("PredictHQ", env.PREDICTHQ_API_KEY);
  logEntries.push({ name: "PredictHQ", message: optStatusPredictHQ.message, isRequired: false, isValid: optStatusPredictHQ.isValid });

  logEntries.forEach(entry => console.log(`- ${entry.name}: ${entry.message}`));

  const requiredServices = logEntries.filter(e => e.isRequired);
  const optionalServices = logEntries.filter(e => !e.isRequired);

  const allRequiredValid = requiredServices.every(e => e.isValid === true);
  
  const configuredOptionalServices = optionalServices.filter(e => e.isValid !== null); // Not "Not Configured"
  const allConfiguredOptionalAreValid = configuredOptionalServices.length > 0 && configuredOptionalServices.every(e => e.isValid === true);
  const someConfiguredOptionalAreInvalid = configuredOptionalServices.some(e => e.isValid === false);

  if (allRequiredValid) {
    if (configuredOptionalServices.length === 0) {
      console.log("\n🎉 All *required* API services are configured and valid. No optional services are configured.");
    } else if (allConfiguredOptionalAreValid) {
      console.log("\n🎉 All *required* API services and all *configured optional* API services are valid and ready to use!");
    } else if (someConfiguredOptionalAreInvalid) {
      console.log("\n🎉 All *required* API services are configured and valid. However, one or more *configured optional* services are potentially invalid. Review their configurations if needed.");
    } else { // All required are valid, and optional services are either not configured or all configured ones are valid.
      console.log("\n🎉 All *required* API services are configured and valid. Optional services are either not configured or also appear valid.");
    }
  } else {
    console.log("\n⚠️ CRITICAL: One or more *required* API services are not properly configured or are invalid (e.g., using placeholder values or failing specific checks after initial Zod validation). The application may not function correctly. Please review your .env file and ensure all required API keys are correctly set and valid.");
  }
}
