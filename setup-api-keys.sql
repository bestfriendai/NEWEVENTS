-- Script to update API keys in Supabase environment_variables table
-- Replace the placeholder values with your actual API keys

-- Update Ticketmaster API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_TICKETMASTER_API_KEY_HERE'
WHERE key = 'TICKETMASTER_API_KEY';

-- Update RapidAPI Key  
UPDATE public.environment_variables
SET value = 'YOUR_ACTUAL_RAPIDAPI_KEY_HERE'
WHERE key = 'RAPIDAPI_KEY';

-- Update Eventbrite Private Token
UPDATE public.environment_variables
SET value = 'YOUR_ACTUAL_EVENTBRITE_PRIVATE_TOKEN_HERE'
WHERE key = 'EVENTBRITE_PRIVATE_TOKEN';

-- Update PredictHQ API Key
UPDATE public.environment_variables
SET value = 'YOUR_ACTUAL_PREDICTHQ_API_KEY_HERE'
WHERE key = 'PREDICTHQ_API_KEY';

-- Update Mapbox API Key
UPDATE public.environment_variables
SET value = 'YOUR_ACTUAL_MAPBOX_API_KEY_HERE'
WHERE key = 'MAPBOX_API_KEY';

-- Update TomTom API Key
UPDATE public.environment_variables
SET value = 'YOUR_ACTUAL_TOMTOM_API_KEY_HERE'
WHERE key = 'TOMTOM_API_KEY';

-- Update OpenRouter API Key
UPDATE public.environment_variables
SET value = 'YOUR_ACTUAL_OPENROUTER_API_KEY_HERE'
WHERE key = 'OPENROUTER_API_KEY';

-- Verify the updates
SELECT key, 
       CASE 
         WHEN value = '' THEN 'NOT SET'
         WHEN value LIKE 'YOUR_ACTUAL_%' THEN 'PLACEHOLDER'
         ELSE 'CONFIGURED'
       END as status
FROM public.environment_variables
ORDER BY key;