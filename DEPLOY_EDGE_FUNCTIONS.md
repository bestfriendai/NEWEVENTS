# Deploy Supabase Edge Functions

Since your API keys are stored in Supabase secrets, you need to deploy the Edge Functions to access them.

## Prerequisites

1. Make sure you have Supabase CLI installed and linked to your project
2. You'll need a Supabase access token (get it from https://app.supabase.com/account/tokens)

## Deploy Edge Functions

1. Set your Supabase access token:
```bash
export SUPABASE_ACCESS_TOKEN=your_access_token_here
```

2. Link to your project:
```bash
supabase link --project-ref ejsllpjzxnbndrrfpjkz
```

3. Deploy the Edge Functions:
```bash
# Deploy the get-api-keys function
supabase functions deploy get-api-keys

# Deploy other functions (optional)
supabase functions deploy event-analytics
supabase functions deploy events-search
```

## Set Environment Variables in Edge Functions

After deploying, set your API keys as secrets in the Edge Functions:

```bash
# Set each API key as a secret
supabase secrets set TICKETMASTER_API_KEY=your_key
supabase secrets set RAPIDAPI_KEY=your_key
supabase secrets set EVENTBRITE_API_KEY=your_key
supabase secrets set EVENTBRITE_PRIVATE_TOKEN=your_key
supabase secrets set PREDICTHQ_API_KEY=your_key
supabase secrets set MAPBOX_API_KEY=your_key
supabase secrets set TOMTOM_API_KEY=your_key
supabase secrets set OPENROUTER_API_KEY=your_key
```

Or if you already have them set in Supabase Dashboard, they should be available to the Edge Functions automatically.

## Verify Deployment

Test if the Edge Function is working:

```bash
curl -X GET https://ejsllpjzxnbndrrfpjkz.supabase.co/functions/v1/get-api-keys \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

The function should return your API keys (make sure to use this endpoint securely in production).