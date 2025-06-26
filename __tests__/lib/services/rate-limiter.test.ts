import { rateLimiter } from '@/lib/services/rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear any existing state
    jest.clearAllMocks()
  })

  describe('canMakeRequest', () => {
    it('should allow requests within rate limit', async () => {
      const canMake = await rateLimiter.canMakeRequest('test-api')
      expect(canMake).toBe(true)
    })

    it('should track request history per API', async () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.canMakeRequest('test-api-1')
      }
      
      // Different API should have separate limit
      const canMake = await rateLimiter.canMakeRequest('test-api-2')
      expect(canMake).toBe(true)
    })
  })

  describe('executeApiCall', () => {
    it('should execute successful API calls', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'success' })
      
      const result = await rateLimiter.executeApiCall(
        'test-api',
        mockApiCall,
        { retries: 1 }
      )
      
      expect(result).toEqual({ data: 'success' })
      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })

    it('should retry failed API calls', async () => {
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' })
      
      const result = await rateLimiter.executeApiCall(
        'test-api',
        mockApiCall,
        { retries: 2, retryDelayMs: 10 }
      )
      
      expect(result).toEqual({ data: 'success' })
      expect(mockApiCall).toHaveBeenCalledTimes(2)
    })

    it('should respect circuit breaker state', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('Server error'))
      
      // Trigger circuit breaker by failing multiple times
      for (let i = 0; i < 5; i++) {
        try {
          await rateLimiter.executeApiCall(
            'test-circuit-api',
            mockApiCall,
            { retries: 1, retryDelayMs: 10 }
          )
        } catch (e) {
          // Expected to fail
        }
      }
      
      // Circuit should be open now
      await expect(
        rateLimiter.executeApiCall('test-circuit-api', mockApiCall)
      ).rejects.toThrow('Circuit breaker is open')
    })

    it('should handle timeout correctly', async () => {
      const mockApiCall = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      await expect(
        rateLimiter.executeApiCall(
          'test-api',
          mockApiCall,
          { timeout: 100, retries: 1 }
        )
      ).rejects.toThrow('Request timeout')
    })
  })

  describe('getApiStats', () => {
    it('should return correct statistics', async () => {
      const mockSuccessCall = jest.fn().mockResolvedValue({ data: 'success' })
      const mockFailCall = jest.fn().mockRejectedValue(new Error('Failed'))
      
      // Make some successful calls
      await rateLimiter.executeApiCall('stats-api', mockSuccessCall)
      await rateLimiter.executeApiCall('stats-api', mockSuccessCall)
      
      // Make a failed call
      try {
        await rateLimiter.executeApiCall('stats-api', mockFailCall, { retries: 1 })
      } catch (e) {
        // Expected to fail
      }
      
      const stats = rateLimiter.getApiStats('stats-api')
      
      expect(stats.totalRequests).toBeGreaterThan(0)
      expect(stats.successCount).toBeGreaterThan(0)
      expect(stats.failureCount).toBeGreaterThan(0)
      expect(stats.successRate).toBeGreaterThan(0)
      expect(stats.successRate).toBeLessThan(1)
      expect(stats.circuitBreakerState).toBe('closed')
      expect(stats.queueLength).toBe(0)
    })
  })
})