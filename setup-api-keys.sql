-- Script to update API keys in the environment_variables table
-- Replace the placeholder values with your actual API keys

-- Update Ticketmaster API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_TICKETMASTER_API_KEY_HERE', updated_at = NOW()
WHERE key = 'TICKETMASTER_API_KEY';

-- Update RapidAPI Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_RAPIDAPI_KEY_HERE', updated_at = NOW()
WHERE key = 'RAPIDAPI_KEY';

-- Update Eventbrite API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_EVENTBRITE_API_KEY_HERE', updated_at = NOW()
WHERE key = 'EVENTBRITE_API_KEY';

-- Update Eventbrite Private Token
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_EVENTBRITE_PRIVATE_TOKEN_HERE', updated_at = NOW()
WHERE key = 'EVENTBRITE_PRIVATE_TOKEN';

-- Update PredictHQ API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_PREDICTHQ_API_KEY_HERE', updated_at = NOW()
WHERE key = 'PREDICTHQ_API_KEY';

-- Update Mapbox API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_MAPBOX_API_KEY_HERE', updated_at = NOW()
WHERE key = 'MAPBOX_API_KEY';

-- Update TomTom API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_TOMTOM_API_KEY_HERE', updated_at = NOW()
WHERE key = 'TOMTOM_API_KEY';

-- Update OpenRouter API Key
UPDATE public.environment_variables 
SET value = 'YOUR_ACTUAL_OPENROUTER_API_KEY_HERE', updated_at = NOW()
WHERE key = 'OPENROUTER_API_KEY';

-- Verify the updates
SELECT key, CASE WHEN LENGTH(value) > 0 THEN 'SET' ELSE 'EMPTY' END as status, description
FROM public.environment_variables
ORDER BY key;