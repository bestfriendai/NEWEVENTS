# Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account with project created
- API keys configured in Supabase secrets

## Environment Variables

Create a `.env.production` file with the following variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://ejsllpjzxnbndrrfpjkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Keys Configuration

All API keys are securely stored in your Supabase secrets and fetched dynamically through the Edge Function `get-api-keys`. The app will automatically retrieve:

- `TICKETMASTER_API_KEY`
- `RAPIDAPI_KEY`
- `EVENTBRITE_API_KEY`
- `EVENTBRITE_PRIVATE_TOKEN`
- `PREDICTHQ_API_KEY`
- `MAPBOX_API_KEY`
- `TOMTOM_API_KEY`
- `OPENROUTER_API_KEY`

Make sure these are set in your Supabase Edge Functions environment variables.

## Database Setup

1. **Run Migrations**: The database tables should already be created in your Supabase project. If not, run the SQL files in `supabase/migrations/` in order.

2. **Verify Tables**: Check that these tables exist in your Supabase dashboard:
   - `events`
   - `user_profiles`
   - `user_favorites`
   - `user_event_interactions`
   - `user_saved_searches`
   - `environment_variables`

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard

### Option 2: Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Post-Deployment Checklist

- [ ] Verify Supabase connection is working
- [ ] Test user authentication (sign up, sign in, sign out)
- [ ] Test event search functionality
- [ ] Verify map features are working (if Mapbox key is provided)
- [ ] Check that favorites functionality works
- [ ] Test anonymous user fallback (when Supabase is not configured)

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **CORS**: The middleware is configured to handle CORS for API routes
3. **Security Headers**: Production config includes security headers
4. **Rate Limiting**: Consider adding rate limiting for API routes in production

## Monitoring

1. Check Supabase dashboard for:
   - Database performance
   - API usage
   - Error logs

2. Monitor application logs for any errors

## Troubleshooting

### Common Issues

1. **"Supabase not configured"**: Check that environment variables are set correctly
2. **Authentication errors**: Verify Supabase URL and anon key are correct
3. **API errors**: Check that API keys are valid and have proper permissions

### Logs

- Check browser console for client-side errors
- Check server logs for API errors
- Check Supabase logs for database errors