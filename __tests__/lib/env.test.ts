import {
  hasMapboxApiKey,
  hasTicketmasterApiKey,
  hasEventbriteApiKey,
  hasPredictHQApiKey,
  hasRapidApiKey,
  hasTomTomApiKey,
  isValidApiKey,
  validateEnv,
  clientEnv,
  serverEnv
} from '@/lib/env'

describe('Environment Configuration', () => {
  // Save original env vars
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv
  })

  describe('isValidApiKey', () => {
    it('should return false for undefined keys', () => {
      expect(isValidApiKey(undefined)).toBe(false)
    })

    it('should return false for placeholder keys', () => {
      expect(isValidApiKey('your-api-key-here')).toBe(false)
      expect(isValidApiKey('placeholder-key')).toBe(false)
    })

    it('should return false for short keys', () => {
      expect(isValidApiKey('short')).toBe(false)
    })

    it('should return true for valid keys', () => {
      expect(isValidApiKey('sk_test_abcdef123456789')).toBe(true)
      expect(isValidApiKey('valid-api-key-with-sufficient-length')).toBe(true)
    })
  })

  describe('API key validation functions', () => {
    it('should validate Mapbox API key', () => {
      process.env.MAPBOX_API_KEY = 'your-mapbox-key'
      expect(hasMapboxApiKey()).toBe(false)
      
      process.env.MAPBOX_API_KEY = 'pk.eyJ1IjoidGVzdCIsImEiOiJjbTMzODBqYTYxbHcwMmpwdXpxeWljNXJ3In0.xKUEW2C1kjFBu7kr7Uxfow'
      expect(hasMapboxApiKey()).toBe(true)
    })

    it('should validate Ticketmaster API key', () => {
      process.env.TICKETMASTER_API_KEY = 'your-key'
      expect(hasTicketmasterApiKey()).toBe(false)
      
      process.env.TICKETMASTER_API_KEY = 'DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9'
      expect(hasTicketmasterApiKey()).toBe(true)
    })

    it('should validate RapidAPI key', () => {
      process.env.RAPIDAPI_KEY = 'your-rapidapi-key'
      expect(hasRapidApiKey()).toBe(false)
      
      process.env.RAPIDAPI_KEY = '92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9'
      expect(hasRapidApiKey()).toBe(true)
    })
  })

  describe('validateEnv', () => {
    it('should return validation results', () => {
      // Set required env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
      process.env.NEXT_PUBLIC_MAPBOX_API_KEY = 'test-mapbox-key'
      
      const result = validateEnv()
      
      expect(result.isValid).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should identify missing required variables', () => {
      // Remove required env vars
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_MAPBOX_API_KEY
      
      const result = validateEnv()
      
      expect(result.isValid).toBe(false)
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(result.missing).toContain('NEXT_PUBLIC_MAPBOX_API_KEY')
    })
  })

  describe('environment objects', () => {
    it('should have correct client environment variables', () => {
      expect(clientEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL')
      expect(clientEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(clientEnv).toHaveProperty('NEXT_PUBLIC_MAPBOX_API_KEY')
    })

    it('should have correct server environment variables', () => {
      expect(serverEnv).toHaveProperty('RAPIDAPI_KEY')
      expect(serverEnv).toHaveProperty('TICKETMASTER_API_KEY')
      expect(serverEnv).toHaveProperty('NODE_ENV')
    })
  })
})