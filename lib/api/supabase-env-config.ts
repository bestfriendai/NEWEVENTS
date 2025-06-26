import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

// Cache for environment variables to avoid repeated API calls
const envCache = new Map<string, string>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cacheTimestamps = new Map<string, number>()

interface SupabaseEnvConfig {
  TICKETMASTER_API_KEY?: string
  RAPIDAPI_KEY?: string
  EVENTBRITE_API_KEY?: string
  EVENTBRITE_PRIVATE_TOKEN?: string
  PREDICTHQ_API_KEY?: string
  MAPBOX_API_KEY?: string
  TOMTOM_API_KEY?: string
  OPENROUTER_API_KEY?: string
}

class SupabaseEnvironmentService {
  private supabase: ReturnType<typeof createClient> | null = null

  constructor() {
    try {
      this.supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    } catch (error) {
      logger.error("Failed to initialize Supabase client for environment service", {
        component: "SupabaseEnvironmentService",
        action: "constructor",
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private isCacheValid(key: string): boolean {
    const timestamp = cacheTimestamps.get(key)
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_DURATION
  }

  private setCacheValue(key: string, value: string): void {
    envCache.set(key, value)
    cacheTimestamps.set(key, Date.now())
  }

  async getEnvironmentVariable(key: string): Promise<string | null> {
    // Check cache first
    if (this.isCacheValid(key)) {
      return envCache.get(key) || null
    }

    if (!this.supabase) {
      logger.warn("Supabase client not available, falling back to local env", {
        component: "SupabaseEnvironmentService",
        action: "getEnvironmentVariable",
        metadata: { key }
      })
      return process.env[key] || null
    }

    try {
      // Try to get from Supabase secrets/environment
      // Note: This assumes you have a table or edge function to manage environment variables
      // You might need to adjust this based on how you've stored them in Supabase
      
      // Option 1: If stored in a custom table
      const { data, error } = await this.supabase
        .from('environment_variables')
        .select('value')
        .eq('key', key)
        .single()

      if (error) {
        logger.warn(`Failed to fetch ${key} from Supabase environment table`, {
          component: "SupabaseEnvironmentService",
          action: "getEnvironmentVariable",
          error: error.message,
          metadata: { key }
        })
        
        // Fallback to local environment
        const localValue = process.env[key]
        if (localValue) {
          this.setCacheValue(key, localValue)
          return localValue
        }
        return null
      }

      const value = data?.value
      if (value) {
        this.setCacheValue(key, value)
        logger.info(`Successfully retrieved ${key} from Supabase environment`, {
          component: "SupabaseEnvironmentService",
          action: "getEnvironmentVariable",
          metadata: { key }
        })
        return value
      }

      return null
    } catch (error) {
      logger.error(`Error fetching environment variable ${key}`, {
        component: "SupabaseEnvironmentService",
        action: "getEnvironmentVariable",
        error: error instanceof Error ? error.message : String(error),
        metadata: { key }
      })
      
      // Fallback to local environment
      const localValue = process.env[key]
      if (localValue) {
        this.setCacheValue(key, localValue)
        return localValue
      }
      return null
    }
  }

  async getAllApiKeys(): Promise<SupabaseEnvConfig> {
    const keys = [
      'TICKETMASTER_API_KEY',
      'RAPIDAPI_KEY', 
      'EVENTBRITE_API_KEY',
      'EVENTBRITE_PRIVATE_TOKEN',
      'PREDICTHQ_API_KEY',
      'MAPBOX_API_KEY',
      'TOMTOM_API_KEY',
      'OPENROUTER_API_KEY'
    ]

    const config: SupabaseEnvConfig = {}

    // Fetch all keys in parallel
    const promises = keys.map(async (key) => {
      const value = await this.getEnvironmentVariable(key)
      if (value) {
        config[key as keyof SupabaseEnvConfig] = value
      }
    })

    await Promise.all(promises)

    logger.info("Retrieved API configuration from Supabase environment", {
      component: "SupabaseEnvironmentService",
      action: "getAllApiKeys",
      metadata: { 
        retrievedKeys: Object.keys(config),
        totalKeys: keys.length 
      }
    })

    return config
  }

  // Clear cache when needed
  clearCache(): void {
    envCache.clear()
    cacheTimestamps.clear()
    logger.info("Environment variable cache cleared", {
      component: "SupabaseEnvironmentService",
      action: "clearCache"
    })
  }
}

// Alternative approach if environment variables are stored in Supabase Edge Functions environment
class SupabaseEdgeFunctionEnvService {
  async getApiKeys(): Promise<SupabaseEnvConfig> {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-api-keys`, {
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.status}`)
      }

      const data = await response.json()
      
      logger.info("Retrieved API keys from Supabase Edge Function", {
        component: "SupabaseEdgeFunctionEnvService",
        action: "getApiKeys",
        metadata: { retrievedKeys: Object.keys(data) }
      })

      return data
    } catch (error) {
      logger.error("Failed to get API keys from Edge Function", {
        component: "SupabaseEdgeFunctionEnvService", 
        action: "getApiKeys",
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Return empty config as fallback
      return {}
    }
  }
}

// Export both services
export const supabaseEnvService = new SupabaseEnvironmentService()
export const supabaseEdgeFunctionEnvService = new SupabaseEdgeFunctionEnvService()

// Helper function to get API config with Supabase environment variables
export async function getSupabaseApiConfig(): Promise<SupabaseEnvConfig> {
  try {
    // Try the environment table approach first
    const config = await supabaseEnvService.getAllApiKeys()
    
    // If no keys found, try the edge function approach
    if (Object.keys(config).length === 0) {
      return await supabaseEdgeFunctionEnvService.getApiKeys()
    }
    
    return config
  } catch (error) {
    logger.error("Failed to get API configuration from Supabase", {
      component: "getSupabaseApiConfig",
      error: error instanceof Error ? error.message : String(error)
    })
    
    return {}
  }
}