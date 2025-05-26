# Recreate UI from screenshot

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/bestfriendais-projects/v0-recreate-ui-from-screenshot)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/5IiH7Yu5tyg)

## Supabase Configuration

This application is connected to Supabase for database and authentication services.

### Environment Variables

The following environment variables are configured in `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://ejsllpjzxnbndrrfpjkz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"

# Database Configuration
POSTGRES_URL="your-postgres-connection-string"
POSTGRES_PRISMA_URL="your-postgres-prisma-connection-string"
POSTGRES_URL_NON_POOLING="your-postgres-non-pooling-connection-string"
POSTGRES_USER="postgres"
POSTGRES_HOST="db.ejsllpjzxnbndrrfpjkz.supabase.co"
POSTGRES_PASSWORD="your-password"
POSTGRES_DATABASE="postgres"
```

### Testing the Connection

To test the Supabase connection:

1. Start the development server: `npm run dev`
2. Visit: `http://localhost:3000/supabase-test`
3. Click "Test Client Connection" to test client-side connection
4. Click "Test Server Connection" to test server-side connection
5. Or visit the API endpoint directly: `http://localhost:3000/api/test-supabase`

### Database Details

- **Project ID**: ejsllpjzxnbndrrfpjkz
- **Region**: us-east-1
- **Database Host**: db.ejsllpjzxnbndrrfpjkz.supabase.co
- **Connection Pooler**: aws-0-us-east-1.pooler.supabase.com

### Files Modified

- `.env.local` - Environment variables
- `lib/env.ts` - Updated Supabase configuration
- `lib/api/supabase-api.ts` - Supabase client setup
- `components/supabase-connection-test.tsx` - Connection test component
- `app/supabase-test/page.tsx` - Test page
- `app/api/test-supabase/route.ts` - Server-side test endpoint

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/bestfriendais-projects/v0-recreate-ui-from-screenshot](https://vercel.com/bestfriendais-projects/v0-recreate-ui-from-screenshot)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/5IiH7Yu5tyg](https://v0.dev/chat/projects/5IiH7Yu5tyg)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
