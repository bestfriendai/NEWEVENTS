# Database Setup Instructions

Your Supabase credentials have been configured in the `.env.local` file. 

## Automatic Setup (Recommended)

Run the following command to test the database connection:

```bash
npm run test:supabase
```

## Manual Setup

If you need to set up the database tables manually:

1. Go to your Supabase Dashboard: https://app.supabase.com/project/ejsllpjzxnbndrrfpjkz

2. Navigate to the SQL Editor

3. Run the migrations in order:
   - First, run `/supabase/migrations/001_create_events_table.sql`
   - Then, run `/supabase/migrations/002_performance_optimizations.sql`

## Verify Setup

After running the migrations, you can verify the setup by:

1. Running the development server:
   ```bash
   npm run dev
   ```

2. Testing the API endpoint:
   ```bash
   curl http://localhost:3000/api/events
   ```

The API should now work with your Supabase instance!

## Environment Variables

The following have been configured:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (for server-side operations)

## Next Steps

1. Add API keys for event providers (Ticketmaster, Eventbrite, etc.) to fetch real events
2. The application will work without these keys but will have limited functionality
3. Check the `/api-test` page to test individual API integrations