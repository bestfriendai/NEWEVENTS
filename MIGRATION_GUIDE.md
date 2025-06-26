# Supabase Migration Guide

This guide explains how to run the database migrations for the NEWEVENTS project on your Supabase instance.

## Prerequisites

- Supabase project credentials (already in `.env.local`)
- One of the following tools installed:
  - PostgreSQL client (`psql`)
  - Supabase CLI
  - Access to Supabase Dashboard

## Migration Files

The project includes two migration files in `/supabase/migrations/`:

1. **001_create_events_table.sql** - Creates the main events table with indexes and RLS policies
2. **002_performance_optimizations.sql** - Adds performance optimizations, spatial indexes, and helper functions

## Method 1: Using PostgreSQL Client (Recommended)

This is the most reliable method that directly connects to your database:

```bash
# Run the migration script
./run-migrations.sh
```

This script will:
- Connect to your Supabase database using credentials from `.env.local`
- Run each migration file in order
- Stop on any errors
- Provide clear feedback on success/failure

## Method 2: Using Supabase CLI

If you prefer using the Supabase CLI:

```bash
# First, make sure you're logged in to Supabase
supabase login

# Then run the CLI migration script
./run-migrations-supabase-cli.sh
```

This script will:
- Link your local project to the remote Supabase instance
- Push all migrations using `supabase db push`

## Method 3: Manual via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (ID: `ejsllpjzxnbndrrfpjkz`)
3. Navigate to the SQL Editor
4. Open and run each migration file in order:
   - First run `001_create_events_table.sql`
   - Then run `002_performance_optimizations.sql`

## Method 4: Using Node.js Script (Limited)

```bash
node scripts/run-migrations.js
```

**Note**: This method has limitations due to Supabase client restrictions and may not execute all DDL statements properly. Use Methods 1-3 for reliable results.

## Verification

After running migrations, verify the tables were created:

### Using psql:
```bash
psql "$POSTGRES_URL_NON_POOLING" -c '\dt'
```

### Using Supabase Dashboard:
1. Go to Table Editor in your Supabase Dashboard
2. You should see:
   - `events` table
   - `event_stats` table
   - `popular_events` materialized view

### Expected Tables and Features:

1. **events** table with columns:
   - Basic fields: id, external_id, source, title, description, etc.
   - Location fields with spatial index
   - Full-text search capabilities
   - Row Level Security enabled

2. **event_stats** table for analytics

3. **Database functions**:
   - `get_events_near_location()` - Find events near a location
   - `search_events_fulltext()` - Full-text search
   - Analytics functions for tracking views, clicks, favorites

## Troubleshooting

### "Permission denied" errors
- Make sure you're using the service role key or admin credentials
- Check that your database URL includes proper SSL parameters

### "Extension not found" errors
- PostGIS extension is required for spatial features
- If not available, the migration will still work but without geographic queries

### Connection issues
- Verify your `.env.local` has the correct database credentials
- Check that your IP is allowed in Supabase connection settings

## Next Steps

After successful migration:

1. Test the API endpoints to ensure they can query the new tables
2. Implement data syncing from Ticketmaster/RapidAPI to populate the events
3. Set up periodic jobs to refresh the `popular_events` materialized view

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Ensure all environment variables are correctly set
3. Try running individual SQL statements to isolate problems