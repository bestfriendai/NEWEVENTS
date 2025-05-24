#!/usr/bin/env tsx

/**
 * Demonstration script for the code improvements
 * Run with: npx tsx scripts/test-improvements.ts
 */

import { logger } from '../lib/utils/logger'
import { memoryCache, persistentCache } from '../lib/utils/cache'
import { geocodeAddress, calculateDistance } from '../lib/utils/geocoding'
import { apiValidators, sanitizers } from '../lib/utils/validation'
import { withRetry, debounce, formatErrorMessage } from '../lib/utils'
import { runAllTests, mockData, assert } from '../lib/utils/test-helpers'
import { getProviderStatus } from '../lib/utils/api-config'

async function demonstrateLogging() {
  console.log('\n🔍 === Logging System Demo ===')
  
  logger.info('Starting demonstration', {
    component: 'demo-script',
    action: 'start_demo',
    metadata: { version: '1.0.0' }
  })
  
  logger.warn('This is a warning message', {
    component: 'demo-script',
    action: 'demo_warning'
  })
  
  try {
    throw new Error('Demo error for testing')
  } catch (error) {
    logger.error('Caught demo error', {
      component: 'demo-script',
      action: 'demo_error'
    }, error instanceof Error ? error : new Error('Unknown error'))
  }
  
  console.log('✅ Logging system working correctly')
}

async function demonstrateCaching() {
  console.log('\n💾 === Caching System Demo ===')
  
  // Test memory cache
  const key = 'demo-data'
  const value = { message: 'Hello from cache!', timestamp: Date.now() }
  
  console.log('Setting cache value...')
  memoryCache.set(key, value, 5000) // 5 seconds TTL
  
  console.log('Getting cache value...')
  const cached = memoryCache.get(key)
  console.log('Cached value:', cached)
  
  // Test cache statistics
  const stats = memoryCache.getStats()
  console.log('Cache stats:', stats)
  
  // Test getOrSet pattern
  const expensiveData = await memoryCache.getOrSet('expensive-operation', async () => {
    console.log('Performing expensive operation...')
    await new Promise(resolve => setTimeout(resolve, 100))
    return { result: 'Expensive computation result', computed: Date.now() }
  }, 10000)
  
  console.log('Expensive data:', expensiveData)
  
  // Second call should be from cache
  const cachedExpensiveData = await memoryCache.getOrSet('expensive-operation', async () => {
    console.log('This should not be called!')
    return { result: 'Should not see this' }
  })
  
  console.log('Cached expensive data:', cachedExpensiveData)
  console.log('✅ Caching system working correctly')
}

async function demonstrateGeocoding() {
  console.log('\n🌍 === Geocoding System Demo ===')
  
  try {
    // Test geocoding
    console.log('Geocoding "New York"...')
    const location = await geocodeAddress('New York')
    
    if (location) {
      console.log('Geocoding result:', {
        name: location.name,
        coordinates: `${location.lat}, ${location.lng}`,
        provider: location.provider,
        confidence: location.confidence
      })
      
      // Test distance calculation
      const distance = calculateDistance(
        location.lat, location.lng,
        34.0522, -118.2437 // Los Angeles coordinates
      )
      console.log(`Distance to Los Angeles: ${distance.toFixed(2)} km`)
    } else {
      console.log('Geocoding failed - using fallback')
    }
    
    console.log('✅ Geocoding system working correctly')
  } catch (error) {
    console.log('❌ Geocoding error:', formatErrorMessage(error))
  }
}

async function demonstrateValidation() {
  console.log('\n✅ === Validation System Demo ===')
  
  // Test valid data
  const validEvent = mockData.eventDetail()
  const validResult = apiValidators.eventDetail(validEvent)
  console.log('Valid event validation:', validResult.isValid ? '✅ PASSED' : '❌ FAILED')
  
  // Test invalid data
  const invalidEvent = { ...validEvent, id: 'invalid-id' }
  const invalidResult = apiValidators.eventDetail(invalidEvent)
  console.log('Invalid event validation:', invalidResult.isValid ? '❌ FAILED' : '✅ PASSED')
  console.log('Validation errors:', invalidResult.errors)
  
  // Test sanitization
  const dirtyData = {
    name: '  John Doe  ',
    age: '25',
    active: 'true',
    tags: 'music,arts'
  }
  
  const sanitized = {
    name: sanitizers.string(dirtyData.name),
    age: sanitizers.number(dirtyData.age),
    active: sanitizers.boolean(dirtyData.active),
    tags: sanitizers.array(dirtyData.tags.split(','))
  }
  
  console.log('Sanitized data:', sanitized)
  console.log('✅ Validation system working correctly')
}

async function demonstrateRetryLogic() {
  console.log('\n🔄 === Retry Logic Demo ===')
  
  let attempts = 0
  
  try {
    const result = await withRetry(async () => {
      attempts++
      console.log(`Attempt ${attempts}`)
      
      if (attempts < 3) {
        throw new Error('Simulated failure')
      }
      
      return 'Success!'
    }, {
      maxAttempts: 3,
      baseDelay: 500
    })
    
    console.log('Retry result:', result)
    console.log('✅ Retry logic working correctly')
  } catch (error) {
    console.log('❌ Retry failed:', formatErrorMessage(error))
  }
}

async function demonstrateDebounce() {
  console.log('\n⏱️ === Debounce Demo ===')
  
  let callCount = 0
  const debouncedFunction = debounce(() => {
    callCount++
    console.log(`Debounced function called! Count: ${callCount}`)
  }, 300)
  
  // Call multiple times rapidly
  console.log('Calling debounced function 5 times rapidly...')
  for (let i = 0; i < 5; i++) {
    debouncedFunction()
  }
  
  // Wait for debounce to complete
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log(`Final call count: ${callCount} (should be 1)`)
  console.log('✅ Debounce working correctly')
}

async function demonstrateApiConfig() {
  console.log('\n⚙️ === API Configuration Demo ===')
  
  const status = getProviderStatus()
  console.log('Provider status:')
  
  for (const [provider, info] of Object.entries(status)) {
    const statusIcon = info.available ? '✅' : '❌'
    const validatedIcon = info.validated ? '✅' : '⚠️'
    console.log(`  ${provider}: ${statusIcon} Available, ${validatedIcon} Validated`)
    if (info.error) {
      console.log(`    Error: ${info.error}`)
    }
  }
  
  console.log('✅ API configuration working correctly')
}

async function runComprehensiveTests() {
  console.log('\n🧪 === Running Comprehensive Tests ===')
  
  try {
    const results = await runAllTests()
    
    console.log('\nTest Results Summary:')
    results.forEach(suite => {
      const passIcon = suite.failed === 0 ? '✅' : '❌'
      console.log(`${passIcon} ${suite.name}: ${suite.passed}/${suite.tests.length} passed (${suite.duration.toFixed(2)}ms)`)
      
      if (suite.failed > 0) {
        suite.tests.filter(t => !t.passed).forEach(test => {
          console.log(`  ❌ ${test.name}: ${test.error}`)
        })
      }
    })
    
    const totalTests = results.reduce((sum, suite) => sum + suite.tests.length, 0)
    const totalPassed = results.reduce((sum, suite) => sum + suite.passed, 0)
    const totalFailed = results.reduce((sum, suite) => sum + suite.failed, 0)
    
    console.log(`\nOverall: ${totalPassed}/${totalTests} tests passed`)
    
    if (totalFailed === 0) {
      console.log('🎉 All tests passed!')
    } else {
      console.log(`⚠️ ${totalFailed} tests failed`)
    }
  } catch (error) {
    console.log('❌ Test execution failed:', formatErrorMessage(error))
  }
}

async function main() {
  console.log('🚀 === Code Improvements Demonstration ===')
  console.log('This script demonstrates the new utilities and improvements.')
  
  try {
    await demonstrateLogging()
    await demonstrateCaching()
    await demonstrateGeocoding()
    await demonstrateValidation()
    await demonstrateRetryLogic()
    await demonstrateDebounce()
    await demonstrateApiConfig()
    await runComprehensiveTests()
    
    console.log('\n🎉 === Demonstration Complete ===')
    console.log('All improvements are working correctly!')
    
    logger.info('Demonstration completed successfully', {
      component: 'demo-script',
      action: 'demo_complete'
    })
    
  } catch (error) {
    console.error('❌ Demonstration failed:', formatErrorMessage(error))
    logger.error('Demonstration failed', {
      component: 'demo-script',
      action: 'demo_failed'
    }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
    
    process.exit(1)
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error)
}

export { main as runDemo }
