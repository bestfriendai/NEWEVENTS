import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request has proper authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get API keys from Deno environment (set in Supabase Edge Functions)
    const apiKeys = {
      TICKETMASTER_API_KEY: Deno.env.get('TICKETMASTER_API_KEY'),
      RAPIDAPI_KEY: Deno.env.get('RAPIDAPI_KEY'),
      EVENTBRITE_API_KEY: Deno.env.get('EVENTBRITE_API_KEY'), 
      EVENTBRITE_PRIVATE_TOKEN: Deno.env.get('EVENTBRITE_PRIVATE_TOKEN'),
      PREDICTHQ_API_KEY: Deno.env.get('PREDICTHQ_API_KEY'),
      MAPBOX_API_KEY: Deno.env.get('MAPBOX_API_KEY'),
      TOMTOM_API_KEY: Deno.env.get('TOMTOM_API_KEY'),
      OPENROUTER_API_KEY: Deno.env.get('OPENROUTER_API_KEY'),
    }

    // Filter out undefined values
    const validApiKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([_, value]) => value !== undefined)
    )

    console.log(`Returning ${Object.keys(validApiKeys).length} API keys`)

    return new Response(
      JSON.stringify(validApiKeys),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-api-keys function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})