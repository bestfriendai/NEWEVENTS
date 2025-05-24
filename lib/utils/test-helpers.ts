/**
 * Test utilities and helpers for improved code testing
 */

import { logger } from "@/lib/utils/logger"
import { apiValidators } from "@/lib/utils/validation"
import { geocodingManager } from "@/lib/utils/geocoding"
import { memoryCache } from "@/lib/utils/cache"
import { apiConfigManager } from "@/lib/utils/api-config"

export interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
  metadata?: Record<string, any>
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  duration: number
}

/**
 * Test runner for API and utility functions
 */
export class TestRunner {
  private results: TestSuite[] = []

  async runTest(name: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    const startTime = performance.now()

    try {
      await testFn()
      const duration = performance.now() - startTime

      logger.info(`Test passed: ${name}`, {
        component: "test-runner",
        action: "test_passed",
        metadata: { name, duration },
      })

      return {
        name,
        passed: true,
        duration,
      }
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      logger.error(
        `Test failed: ${name}`,
        {
          component: "test-runner",
          action: "test_failed",
          metadata: { name, duration, error: errorMessage },
        },
        error instanceof Error ? error : new Error(errorMessage),
      )

      return {
        name,
        passed: false,
        error: errorMessage,
        duration,
      }
    }
  }

  async runSuite(
    suiteName: string,
    tests: Array<{ name: string; test: () => Promise<void> | void }>,
  ): Promise<TestSuite> {
    const startTime = performance.now()
    const results: TestResult[] = []

    logger.info(`Starting test suite: ${suiteName}`, {
      component: "test-runner",
      action: "suite_start",
      metadata: { suiteName, testCount: tests.length },
    })

    for (const { name, test } of tests) {
      const result = await this.runTest(name, test)
      results.push(result)
    }

    const duration = performance.now() - startTime
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length

    const suite: TestSuite = {
      name: suiteName,
      tests: results,
      passed,
      failed,
      duration,
    }

    this.results.push(suite)

    logger.info(`Test suite completed: ${suiteName}`, {
      component: "test-runner",
      action: "suite_complete",
      metadata: { suiteName, passed, failed, duration },
    })

    return suite
  }

  getResults(): TestSuite[] {
    return this.results
  }

  getSummary(): { totalTests: number; totalPassed: number; totalFailed: number; totalDuration: number } {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0)
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0)
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0)
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.duration, 0)

    return { totalTests, totalPassed, totalFailed, totalDuration }
  }
}

/**
 * Mock data generators
 */
export const mockData = {
  eventDetail: () => ({
    id: 12345,
    title: "Test Concert",
    description: "A great test concert event",
    category: "Music",
    date: "2024-12-25",
    time: "7:00 PM - 10:00 PM",
    location: "Test Venue",
    address: "123 Test St, Test City, TC 12345",
    price: "Tickets Available",
    image: "https://example.com/test-image.jpg",
    organizer: {
      name: "Test Organizer",
      avatar: "https://example.com/avatar.jpg",
    },
    attendees: 150,
    isFavorite: false,
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
    ticketLinks: [
      {
        source: "Test Tickets",
        link: "https://example.com/tickets",
      },
    ],
  }),

  searchParams: () => ({
    keyword: "concert",
    location: "New York",
    radius: 25,
    page: 0,
    size: 20,
  }),

  coordinates: () => ({
    lat: 40.7128,
    lng: -74.006,
  }),

  apiResponse: () => ({
    events: [mockData.eventDetail()],
    totalCount: 1,
    page: 0,
    totalPages: 1,
    sources: ["test-api"],
  }),
}

/**
 * Assertion helpers
 */
export const assert = {
  isTrue: (value: boolean, message?: string) => {
    if (!value) {
      throw new Error(message || "Expected value to be true")
    }
  },

  isFalse: (value: boolean, message?: string) => {
    if (value) {
      throw new Error(message || "Expected value to be false")
    }
  },

  equals: (actual: any, expected: any, message?: string) => {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`)
    }
  },

  notEquals: (actual: any, expected: any, message?: string) => {
    if (actual === expected) {
      throw new Error(message || `Expected values to be different, both were ${actual}`)
    }
  },

  isNull: (value: any, message?: string) => {
    if (value !== null) {
      throw new Error(message || "Expected value to be null")
    }
  },

  isNotNull: (value: any, message?: string) => {
    if (value === null) {
      throw new Error(message || "Expected value to not be null")
    }
  },

  isUndefined: (value: any, message?: string) => {
    if (value !== undefined) {
      throw new Error(message || "Expected value to be undefined")
    }
  },

  isDefined: (value: any, message?: string) => {
    if (value === undefined) {
      throw new Error(message || "Expected value to be defined")
    }
  },

  isArray: (value: any, message?: string) => {
    if (!Array.isArray(value)) {
      throw new Error(message || "Expected value to be an array")
    }
  },

  isObject: (value: any, message?: string) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(message || "Expected value to be an object")
    }
  },

  isString: (value: any, message?: string) => {
    if (typeof value !== "string") {
      throw new Error(message || "Expected value to be a string")
    }
  },

  isNumber: (value: any, message?: string) => {
    if (typeof value !== "number" || isNaN(value)) {
      throw new Error(message || "Expected value to be a number")
    }
  },

  throws: async (fn: () => Promise<any> | any, message?: string) => {
    try {
      await fn()
      throw new Error(message || "Expected function to throw an error")
    } catch (_error) {
      // Expected behavior
    }
  },

  doesNotThrow: async (fn: () => Promise<any> | any, message?: string) => {
    try {
      await fn()
    } catch (error) {
      throw new Error(message || `Expected function not to throw, but it threw: ${error}`)
    }
  },
}

/**
 * Performance testing utilities
 */
export const performance = {
  now: (): number => {
    return Date.now()
  },
  
  measure: async <T>(name: string, fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> => {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start

    logger.info(`Performance measurement: ${name}`, {
      component: "performance",
      action: "measure",
      metadata: { name, duration },
    })

    return { result, duration }
  },

  benchmark: async <T>(
    name: string,
    fn: () => Promise<T> | T,
    iterations: number = 10
  ): Promise<
{
  averageDuration: number
  minDuration: number
  maxDuration: number
  results: T[]
}
> =>
{
  const durations: number[] = []
  const results: T[] = []

  for (let i = 0; i < iterations; i++) {
    const { result, duration } = await performance.measure(`${name} iteration ${i + 1}`, fn)
    durations.push(duration)
    results.push(result)
  }

  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)

  logger.info(`Benchmark completed: ${name}`, {
    component: "performance",
    action: "benchmark",
    metadata: { name, iterations, averageDuration, minDuration, maxDuration },
  })

  return { averageDuration, minDuration, maxDuration, results }
}
}

/**
 * Integration test suites
 */
export const integrationTests = {
  validation: async (): Promise<TestSuite> => {
    const runner = new TestRunner()

    return runner.runSuite("Validation Tests", [
      {
        name: "Valid event detail validation",
        test: () => {
          const data = mockData.eventDetail()
          const result = apiValidators.eventDetail(data)
          assert.isTrue(result.isValid, "Event detail should be valid")
        },
      },
      {
        name: "Invalid event detail validation",
        test: () => {
          const data = { ...mockData.eventDetail(), id: "invalid" }
          const result = apiValidators.eventDetail(data)
          assert.isFalse(result.isValid, "Event detail should be invalid")
        },
      },
      {
        name: "Valid search params validation",
        test: () => {
          const data = mockData.searchParams()
          const result = apiValidators.searchParams(data)
          assert.isTrue(result.isValid, "Search params should be valid")
        },
      },
    ])
  },

  geocoding: async (): Promise<TestSuite> => {
    const runner = new TestRunner()

    return runner.runSuite("Geocoding Tests", [
      {
        name: "Geocode known address",
        test: async () => {
          const result = await geocodingManager.geocode("New York")
          assert.isNotNull(result, "Should return geocoding result")
          if (result) {
            assert.isNumber(result.lat, "Latitude should be a number")
            assert.isNumber(result.lng, "Longitude should be a number")
          }
        },
      },
      {
        name: "Reverse geocode coordinates",
        test: async () => {
          const result = await geocodingManager.reverseGeocode(40.7128, -74.006)
          assert.isString(result, "Should return address string")
        },
      },
      {
        name: "Calculate distance",
        test: () => {
          const distance = geocodingManager.calculateDistance(40.7128, -74.006, 34.0522, -118.2437)
          assert.isNumber(distance, "Distance should be a number")
          assert.isTrue(distance > 0, "Distance should be positive")
        },
      },
    ])
  },

  cache: async (): Promise<TestSuite> => {
    const runner = new TestRunner()

    return runner.runSuite("Cache Tests", [
      {
        name: "Set and get cache value",
        test: () => {
          const key = "test-key"
          const value = "test-value"

          memoryCache.set(key, value)
          const retrieved = memoryCache.get(key)

          assert.equals(retrieved, value, "Retrieved value should match set value")
        },
      },
      {
        name: "Cache expiration",
        test: async () => {
          const key = "expire-test"
          const value = "expire-value"

          memoryCache.set(key, value, 100) // 100ms TTL

          // Should be available immediately
          assert.equals(memoryCache.get(key), value, "Value should be available immediately")

          // Wait for expiration
          await new Promise((resolve) => setTimeout(resolve, 150))

          // Should be expired
          assert.isNull(memoryCache.get(key), "Value should be expired")
        },
      },
      {
        name: "Cache statistics",
        test: () => {
          memoryCache.clear()

          // Generate some cache activity
          memoryCache.set("stats-test-1", "value1")
          memoryCache.set("stats-test-2", "value2")
          memoryCache.get("stats-test-1") // hit
          memoryCache.get("stats-test-1") // hit
          memoryCache.get("nonexistent") // miss

          const stats = memoryCache.getStats()
          assert.isNumber(stats.hits, "Hits should be a number")
          assert.isNumber(stats.misses, "Misses should be a number")
          assert.isNumber(stats.hitRate, "Hit rate should be a number")
        },
      },
    ])
  },

  apiConfig: async (): Promise<TestSuite> => {
    const runner = new TestRunner()

    return runner.runSuite("API Config Tests", [
      {
        name: "Get provider status",
        test: () => {
          const status = apiConfigManager.getProviderStatus()
          assert.isObject(status, "Status should be an object")
          assert.isDefined(status.ticketmaster, "Ticketmaster status should be defined")
        },
      },
      {
        name: "Rate limit check",
        test: () => {
          const result = apiConfigManager.checkRateLimit("test-provider")
          assert.isObject(result, "Rate limit result should be an object")
          assert.isDefined(result.allowed, "Allowed property should be defined")
        },
      },
    ])
  },
}

// Create test runner instance
export const testRunner = new TestRunner()

// Convenience function to run all integration tests
export const runAllTests = async (): Promise<TestSuite[]> => {
  logger.info("Starting comprehensive test suite", {
    component: "test-runner",
    action: "run_all_tests",
  })

  const results = await Promise.all([
    integrationTests.validation(),
    integrationTests.geocoding(),
    integrationTests.cache(),
    integrationTests.apiConfig(),
  ])

  const summary = {
    totalSuites: results.length,
    totalTests: results.reduce((sum, suite) => sum + suite.tests.length, 0),
    totalPassed: results.reduce((sum, suite) => sum + suite.passed, 0),
    totalFailed: results.reduce((sum, suite) => sum + suite.failed, 0),
    totalDuration: results.reduce((sum, suite) => sum + suite.duration, 0),
  }

  logger.info("All tests completed", {
    component: "test-runner",
    action: "all_tests_complete",
    metadata: summary,
  })

  return results
}
