const https = require('https');

// Test if secrets are properly configured by calling the Supabase Edge Function
async function testSupabaseSecrets() {
  console.log('Testing Supabase Secrets Configuration...\n');

  const projectUrl = 'https://ejsllpjzxnbndrrfpjkz.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xscGp6eG5ibmRycmZwamt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTYxNDYsImV4cCI6MjA2MzQ5MjE0Nn0.uFthMUbM4dkOqlxGWC2tVoTjo_5b9VmvhnYdXWnlLXU';

  const options = {
    hostname: 'ejsllpjzxnbndrrfpjkz.supabase.co',
    path: '/functions/v1/get-api-keys',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Supabase Edge Function Response:');
          console.log('Status:', res.statusCode);
          
          if (res.statusCode === 200) {
            console.log('\n🔑 API Keys Found:');
            if (result.RAPIDAPI_KEY) console.log('  - RAPIDAPI_KEY: ✓ Set');
            if (result.TICKETMASTER_API_KEY) console.log('  - TICKETMASTER_API_KEY: ✓ Set');
            if (result.TICKETMASTER_SECRET) console.log('  - TICKETMASTER_SECRET: ✓ Set');
            
            if (!result.RAPIDAPI_KEY || !result.TICKETMASTER_API_KEY) {
              console.log('\n⚠️  Some keys are missing. Please run:');
              console.log('  supabase secrets set RAPIDAPI_KEY=92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9');
              console.log('  supabase secrets set TICKETMASTER_API_KEY=DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9');
              console.log('  supabase secrets set TICKETMASTER_SECRET=H1dYvpxiiaTgJow5');
            } else {
              console.log('\n✅ All required API keys are configured in Supabase!');
            }
          } else {
            console.log('\n❌ Error:', result.error || 'Unknown error');
            console.log('\nPlease ensure the Edge Function is deployed:');
            console.log('  supabase functions deploy get-api-keys');
          }
        } catch (e) {
          console.log('❌ Failed to parse response:', e.message);
          console.log('Response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test local environment variables
function testLocalEnv() {
  console.log('\n📋 Local Environment Variables:');
  console.log('  - RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY ? '✓ Set' : '✗ Not set');
  console.log('  - TICKETMASTER_API_KEY:', process.env.TICKETMASTER_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('  - TICKETMASTER_SECRET:', process.env.TICKETMASTER_SECRET ? '✓ Set' : '✗ Not set');
}

// Run tests
console.log('🔍 Checking API Keys Configuration\n');
console.log('=' .repeat(50));

testLocalEnv();
console.log('\n' + '=' .repeat(50) + '\n');

testSupabaseSecrets().catch(error => {
  console.error('Test failed:', error);
});