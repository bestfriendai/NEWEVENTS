#!/bin/bash

# Update Supabase secrets using the Supabase CLI

echo "Updating Supabase secrets..."

# Set the API keys as secrets
supabase secrets set RAPIDAPI_KEY=92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9
supabase secrets set TICKETMASTER_API_KEY=DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9
supabase secrets set TICKETMASTER_SECRET=H1dYvpxiiaTgJow5

echo "Secrets updated successfully!"
echo ""
echo "To verify the secrets were set, run:"
echo "supabase secrets list"
echo ""
echo "Note: You may need to redeploy your Edge Functions for the changes to take effect:"
echo "supabase functions deploy get-api-keys"