# Updating Supabase Secrets

This guide explains how to update the API keys in Supabase secrets using the Supabase CLI.

## Prerequisites

1. Install Supabase CLI if not already installed:
   ```bash
   brew install supabase/tap/supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref ejsllpjzxnbndrrfpjkz
   ```

## Update API Keys

Run the following commands to set the API keys as secrets:

```bash
# Set RapidAPI key
supabase secrets set RAPIDAPI_KEY=92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9

# Set Ticketmaster API credentials
supabase secrets set TICKETMASTER_API_KEY=DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9
supabase secrets set TICKETMASTER_SECRET=H1dYvpxiiaTgJow5

# Optional: Set other API keys if you have them
# supabase secrets set EVENTBRITE_API_KEY=your_eventbrite_key
# supabase secrets set TOMTOM_API_KEY=your_tomtom_key
# supabase secrets set PREDICTHQ_API_KEY=your_predicthq_key
```

## Verify Secrets

To verify the secrets were set correctly:

```bash
supabase secrets list
```

## Deploy Edge Functions

After updating secrets, redeploy the Edge Function that serves the API keys:

```bash
supabase functions deploy get-api-keys
```

## Testing

1. Test the API keys locally:
   ```bash
   npm run dev
   ```

2. Visit the test endpoints:
   - http://localhost:3000/api/test-all-apis
   - http://localhost:3000/api/test-rapidapi-realtime
   - http://localhost:3000/api/test-config

3. Check the events page to see if real events are loading:
   - http://localhost:3000/events

## Alternative: Manual Update via Dashboard

If you prefer using the Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/ejsllpjzxnbndrrfpjkz
2. Navigate to Settings > Edge Functions
3. Click on "Secrets" tab
4. Add or update the following secrets:
   - `RAPIDAPI_KEY`: 92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9
   - `TICKETMASTER_API_KEY`: DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9
   - `TICKETMASTER_SECRET`: H1dYvpxiiaTgJow5

## Notes

- The application will automatically fetch these secrets from Supabase when running
- Local `.env.local` values will override Supabase secrets for local development
- Make sure not to commit API keys to version control