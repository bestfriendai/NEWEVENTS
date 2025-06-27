// Direct test of RapidAPI through the unified service
const https = require('https');

async function testRapidAPIIntegration() {
  console.log('Testing RapidAPI Integration in Unified Service...\n');
  
  // Test 1: Direct RapidAPI service test
  console.log('1. Testing RapidAPI service directly:');
  const test1 = await fetch('http://localhost:3000/api/test-rapidapi-realtime');
  const result1 = await test1.json();
  console.log('   - Events found:', result1.searchTest.eventsFound);
  console.log('   - Success:', result1.searchTest.success);
  
  // Test 2: Force refresh with specific coordinates
  console.log('\n2. Testing unified service with force refresh:');
  const test2 = await fetch('http://localhost:3000/api/events?lat=40.7580&lng=-73.9855&radius=10&limit=5&forceRefresh=true');
  const result2 = await test2.json();
  console.log('   - Total events:', result2.totalCount);
  console.log('   - RapidAPI events:', result2.sources.rapidapi);
  console.log('   - Ticketmaster events:', result2.sources.ticketmaster);
  console.log('   - Cached events:', result2.sources.cached);
  
  // Test 3: Check environment
  console.log('\n3. Checking API configuration:');
  const test3 = await fetch('http://localhost:3000/api/test-config');
  const result3 = await test3.json();
  console.log('   - RapidAPI configured:', result3.apiKeys.rapidapi.configured);
  console.log('   - Ticketmaster configured:', result3.apiKeys.ticketmaster.configured);
  
  // Test 4: Direct call to see if it's a timing issue
  console.log('\n4. Testing with timeout between calls:');
  await new Promise(resolve => setTimeout(resolve, 1000));
  const test4 = await fetch('http://localhost:3000/api/events?lat=40.6892&lng=-74.0445&radius=15&limit=10&forceRefresh=true');
  const result4 = await test4.json();
  console.log('   - Total events:', result4.totalCount);
  console.log('   - Sources:', JSON.stringify(result4.sources));
}

testRapidAPIIntegration().catch(console.error);