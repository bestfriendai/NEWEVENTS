const https = require('https');

// Test RapidAPI directly
const options = {
  method: 'GET',
  hostname: 'real-time-events-search.p.rapidapi.com',
  port: null,
  path: '/search-events?query=music&location=New%20York',
  headers: {
    'X-RapidAPI-Key': '92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9',
    'X-RapidAPI-Host': 'real-time-events-search.p.rapidapi.com'
  }
};

console.log('Testing RapidAPI Real-Time Events Search...\n');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Headers:', options.headers);
console.log('\n---\n');

const req = https.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    const response = body.toString();
    
    console.log('Status Code:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('\nResponse Body:');
    
    try {
      const data = JSON.parse(response);
      console.log(JSON.stringify(data, null, 2));
      
      if (data.results && Array.isArray(data.results)) {
        console.log(`\n✅ Found ${data.results.length} events`);
        if (data.results.length > 0) {
          console.log('\nFirst event:');
          console.log(JSON.stringify(data.results[0], null, 2));
        }
      } else if (data.error) {
        console.log('\n❌ API Error:', data.error);
      } else {
        console.log('\n⚠️  Unexpected response format');
      }
    } catch (e) {
      console.log('Raw response:', response);
      console.log('\n❌ Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.end();