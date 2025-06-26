#!/bin/bash

# Load environment variables
source .env.local

# Check if tables exist
echo "=== Checking Database Schema ==="
echo "Database: db.ejsllpjzxnbndrrfpjkz.supabase.co"
echo

# Check for events table
echo "Checking for events table..."
psql "$POSTGRES_URL_NON_POOLING" -t -c "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events');" 2>/dev/null | grep -q 't' && echo "✓ events table exists" || echo "✗ events table not found"

# Check for event_stats table  
echo "Checking for event_stats table..."
psql "$POSTGRES_URL_NON_POOLING" -t -c "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_stats');" 2>/dev/null | grep -q 't' && echo "✓ event_stats table exists" || echo "✗ event_stats table not found"

echo
echo "=== Table Columns ==="
# Show events table structure if it exists
if psql "$POSTGRES_URL_NON_POOLING" -t -c "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events');" 2>/dev/null | grep -q 't'; then
    echo "Events table structure:"
    psql "$POSTGRES_URL_NON_POOLING" -c "\d events" 2>/dev/null | head -30
fi

echo
echo "=== Testing Database Connection ==="
# Test a simple query
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT COUNT(*) as event_count FROM events;" 2>/dev/null && echo "✓ Database connection successful" || echo "✗ Database connection failed"