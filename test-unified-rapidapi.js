const fetch = require('node-fetch');

async function testUnifiedService() {
  try {
    console.log('Testing Unified Events Service with RapidAPI...\n');
    
    const response = await fetch('http://localhost:3000/api/events?lat=40.7128&lng=-74.0060&radius=25&limit=10&forceRefresh=true');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    console.log('Total events:', data.totalCount);
    console.log('Sources:', data.sources);
    console.log('Response time:', data.responseTime, 'ms');
    
    if (data.error) {
      console.log('Error:', data.error);
    }
    
    // Show first few events
    if (data.events && data.events.length > 0) {
      console.log('\nFirst 3 events:');
      data.events.slice(0, 3).forEach((event, i) => {
        console.log(`\n${i + 1}. ${event.title}`);
        console.log(`   Date: ${event.date} at ${event.time}`);
        console.log(`   Location: ${event.location}`);
        console.log(`   Price: ${event.price}`);
        console.log(`   Source: ${event.source || 'Unknown'}`);
      });
    }
    
    // Check if RapidAPI is being called
    console.log('\n---');
    console.log('RapidAPI events found:', data.sources?.rapidapi || 0);
    console.log('Ticketmaster events found:', data.sources?.ticketmaster || 0);
    console.log('Cached events found:', data.sources?.cached || 0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUnifiedService();