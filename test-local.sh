#!/bin/bash

echo "🧪 Testing Local Setup..."
echo ""

# Base URL
BASE_URL="http://localhost:3000"

# Test 1: Check if server is running
echo "1. Testing server availability..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ "$STATUS" = "200" ]; then
    echo "✅ Server is running on $BASE_URL"
else
    echo "❌ Server not responding (Status: $STATUS)"
    echo "   Please ensure the server is running: npm run dev"
    exit 1
fi

echo ""
echo "2. Testing API endpoints..."

# Test Supabase connection
echo "   - Testing Supabase connection..."
SUPABASE_RESPONSE=$(curl -s $BASE_URL/api/test-supabase)
if [[ $SUPABASE_RESPONSE == *"success"* ]]; then
    echo "   ✅ Supabase connection successful"
else
    echo "   ⚠️  Supabase test endpoint returned: $SUPABASE_RESPONSE"
fi

# Test network connectivity
echo "   - Testing network connectivity..."
NETWORK_RESPONSE=$(curl -s $BASE_URL/api/test-network)
if [[ $NETWORK_RESPONSE == *"success"* ]]; then
    echo "   ✅ Network connectivity test passed"
else
    echo "   ⚠️  Network test returned unexpected response"
fi

# Test API configuration
echo "   - Testing API configuration..."
ALL_APIS_RESPONSE=$(curl -s $BASE_URL/api/test-all-apis)
if [[ $ALL_APIS_RESPONSE == *"results"* ]]; then
    echo "   ✅ API configuration test completed"
    echo "   📊 API Status:"
    
    # Parse API statuses if jq is available
    if command -v jq &> /dev/null; then
        echo "$ALL_APIS_RESPONSE" | jq -r '.data.results[] | "      - \(.api): \(.status)"' 2>/dev/null || echo "      (Could not parse API statuses)"
    fi
else
    echo "   ⚠️  API configuration test returned unexpected response"
fi

echo ""
echo "3. Testing main application..."
echo "   🌐 Open http://localhost:3000 in your browser"
echo ""
echo "4. Quick checks:"
echo "   - Can you see the homepage? ✓"
echo "   - Can you search for events? ✓"
echo "   - Is authentication working? ✓"
echo ""
echo "📝 Note: API keys are fetched from Supabase secrets"
echo "   If event searches aren't working, ensure your API keys are"
echo "   properly configured in Supabase Edge Functions."
echo ""
echo "✨ Testing complete!"