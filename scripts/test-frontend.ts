#!/usr/bin/env npx tsx

/**
 * Frontend Functionality Test Script
 * Tests all major features of the DateAI app
 */

const BASE_URL = 'http://localhost:3001'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

async function main() {
  const tests: TestResult[] = []

  async function runTest(name: string, testFn: () => Promise<boolean>) {
    console.log(`\n🧪 Testing: ${name}...`)
    try {
      const result = await testFn()
      tests.push({ name, passed: result })
      console.log(result ? '✅ PASSED' : '❌ FAILED')
    } catch (error: any) {
      tests.push({ name, passed: false, error: error.message })
      console.log(`❌ ERROR: ${error.message}`)
    }
  }

  // Test 1: Homepage loads
  await runTest('Homepage loads correctly', async () => {
  const response = await fetch(BASE_URL)
  const html = await response.text()
  return response.ok && html.includes('Find Your Next') && html.includes('Amazing Event')
})

// Test 2: Events page loads
await runTest('Events page loads correctly', async () => {
  const response = await fetch(`${BASE_URL}/events`)
  const html = await response.text()
  return response.ok && html.includes('Real-Time Events')
})

// Test 3: Featured Events API
await runTest('Featured Events API returns data', async () => {
  const response = await fetch(`${BASE_URL}/api/events/featured?location=New York`)
  const data = await response.json()
  return data.success && Array.isArray(data.data) && data.data.length > 0
})

// Test 4: Real Events API
await runTest('Real Events API returns data', async () => {
  const response = await fetch(`${BASE_URL}/api/events/real?location=New York&limit=10`)
  const data = await response.json()
  return data.success && Array.isArray(data.data) && data.data.length > 0
})

// Test 5: Event Search API
await runTest('Event Search API works', async () => {
  const response = await fetch(`${BASE_URL}/api/events/real?keyword=concert&location=New York`)
  const data = await response.json()
  return data.success && Array.isArray(data.data)
})

// Test 6: Category Filter API
await runTest('Category Filter API works', async () => {
  const response = await fetch(`${BASE_URL}/api/events/real?category=Music&location=New York`)
  const data = await response.json()
  return data.success && Array.isArray(data.data)
})

// Test 7: Geocoding API
await runTest('Geocoding API works', async () => {
  const response = await fetch(`${BASE_URL}/api/geocode/reverse?lat=40.7128&lng=-74.0060`)
  const data = await response.json()
  return data.success && data.data.city === 'New York'
})

// Test 8: Ticketmaster API Test
await runTest('Ticketmaster API is configured', async () => {
  const response = await fetch(`${BASE_URL}/api/test-ticketmaster`)
  const data = await response.json()
  return data.success && data.data.connectivity.success
})

// Test 9: Mapbox API Test
await runTest('Mapbox API is configured', async () => {
  const response = await fetch(`${BASE_URL}/api/test-mapbox`)
  const data = await response.json()
  return data.success && data.geocoding.result.name === 'Washington, DC'
})

// Test 10: RapidAPI Test
await runTest('RapidAPI is configured', async () => {
  const response = await fetch(`${BASE_URL}/api/test-rapidapi`)
  const data = await response.json()
  return data.success && data.data.connectivity.success
})

// Test 11: All APIs Test
await runTest('All APIs summary check', async () => {
  const response = await fetch(`${BASE_URL}/api/test-all-apis`)
  const data = await response.json()
  return data.success && data.summary.connected >= 2 // At least 2 APIs working
})

// Test 12: Favorites page loads (should show login prompt)
await runTest('Favorites page loads', async () => {
  const response = await fetch(`${BASE_URL}/favorites`)
  const html = await response.text()
  return response.ok && (html.includes('Sign in to view favorites') || html.includes('Your Favorites'))
})

// Test 13: Party page loads
await runTest('Party page loads', async () => {
  const response = await fetch(`${BASE_URL}/party`)
  const html = await response.text()
  return response.ok && html.includes('party') // Should contain party-related content
})

// Test 14: Profile page loads
await runTest('Profile page loads', async () => {
  const response = await fetch(`${BASE_URL}/profile`)
  const html = await response.text()
  return response.ok && html.includes('profile') // Should contain profile-related content
})

// Test 15: Static assets load
await runTest('Static assets are accessible', async () => {
  const response = await fetch(`${BASE_URL}/favicon.ico`)
  return response.ok
})

  // Print results
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(60))

  const passed = tests.filter(t => t.passed).length
  const failed = tests.filter(t => !t.passed).length
  const total = tests.length

  console.log(`\n✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${failed}/${total}`)
  console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}${test.error ? `: ${test.error}` : ''}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log(passed === total ? '🎉 All tests passed!' : '⚠️  Some tests failed')
  console.log('='.repeat(60))

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run the main function
main().catch(console.error)