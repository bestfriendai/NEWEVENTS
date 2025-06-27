// Test RapidAPI through unified service with unique parameters
const fetch = require('node-fetch');

async function testUnique() {
  // Use unique coordinates to bypass cache
  const lat = 40.7128 + Math.random() * 0.01;
  const lng = -74.0060 + Math.random() * 0.01;
  
  console.log(`Testing with unique coordinates: ${lat}, ${lng}`);
  
  const url = `http://localhost:3000/api/events?lat=${lat}&lng=${lng}&radius=50&limit=10&forceRefresh=true`;
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('\nResponse:');
    console.log('- Success:', data.success);
    console.log('- Total events:', data.totalCount);
    console.log('- Sources:', data.sources);
    console.log('- Response time:', data.responseTime, 'ms');
    
    if (data.events && data.events.length > 0) {
      console.log('\nFirst event:');
      console.log('- Title:', data.events[0].title);
      console.log('- External ID:', data.events[0].externalId);
      console.log('- Source field:', data.events[0].source);
    }
    
    // Check if any events have rapidapi in their external ID
    if (data.events) {
      const rapidApiEvents = data.events.filter(e => 
        e.externalId && e.externalId.includes('rapidapi')
      );
      console.log('\nEvents with RapidAPI external ID:', rapidApiEvents.length);
      if (rapidApiEvents.length > 0) {
        console.log('Sample RapidAPI event:', rapidApiEvents[0].title);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUnique();