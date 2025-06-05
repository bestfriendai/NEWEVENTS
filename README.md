# Recreate UI from screenshot

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/bestfriendais-projects/v0-recreate-ui-from-screenshot)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/5IiH7Yu5tyg)

## Supabase Configuration

This application connects to Supabase for features like database interactions and authentication.

### Environment Variables for Next.js Application

For the Next.js application to connect to Supabase, create a `.env.local` file in the root of your project with the following essential variables:

```bash
# Essential for Supabase client connection in the Next.js app
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-url.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Example values (replace with your actual Supabase project details):
# NEXT_PUBLIC_SUPABASE_URL="https://ejsllpjzxnbndrrfpjkz.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xscGp6eG5ibmRycmZwamt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTYxNDYsImV4cCI6MjA2MzQ5MjE0Nn0.uFthMUbM4dkOqlxGWC2tVoTjo_5b9VmvhnYdXWnlLXU"
```

**Important:**
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anonymous key for your Supabase project. This key is safe to expose on the client side and is used for operations that adhere to your Row Level Security (RLS) policies.

The application reads these variables via `lib/env.ts`.

### Other Supabase-related Environment Variables

Your Supabase project provides other keys and connection strings for different purposes:
- **Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`):** Used for server-side operations that require bypassing RLS. Store this securely and do not expose it on the client side. It should be set as an environment variable in your deployment environment for server-side functions or scripts that need admin privileges.
- **JWT Secret (`SUPABASE_JWT_SECRET`):** Used for signing and verifying JWTs. Store this securely.
- **Direct Database Connection Strings (e.g., `POSTGRES_URL`, `POSTGRES_PRISMA_URL`):** Used for connecting directly to your PostgreSQL database, often for migrations, server-side scripts, or tools like Prisma. These should also be stored securely and used in server-side contexts.

These additional variables should be set in your deployment environment or in `.env.local` if specifically required by a local script or server-side utility that you are running, but ensure they are not prefixed with `NEXT_PUBLIC_` unless intended to be client-accessible (which is generally not the case for these sensitive keys).

### Testing the Connection

After setting up your `.env.local` file:

1.  Ensure all dependencies are installed: `pnpm install`
2.  Start the development server: `pnpm dev` (or `npm run dev`, `yarn dev`)
3.  Visit the Supabase test page: `http://localhost:3000/supabase-test`
    - Click "Test Client Connection" to verify the client-side Supabase setup.
    - Click "Test Server Connection" to verify basic server-side connectivity to Supabase (via `app/api/test-supabase/route.ts`).
4.  Alternatively, run the command-line test script: `pnpm run test:supabase-connection` (or `npm run test:supabase-connection`, `yarn test:supabase-connection`).

This script (`scripts/test-supabase-basic-connection.ts`) directly tests the `.env.local` variables and attempts a basic connection.

### Files Modified/Checked for this Setup

- `.env.local`: Created to store your local environment variables.
- `lib/env.ts`: Defines how environment variables are accessed.
- `lib/api/supabase-api.ts`: Contains Supabase client initialization logic.
- `components/supabase-connection-test.tsx`: UI component for testing Supabase connection.
- `app/supabase-test/page.tsx`: Page that hosts the connection test component.
- `app/api/test-supabase/route.ts`: API route for server-side connection testing.
- `scripts/test-supabase-basic-connection.ts`: CLI script for testing connection.
- `package.json`: Added `test:supabase-connection` script.

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
