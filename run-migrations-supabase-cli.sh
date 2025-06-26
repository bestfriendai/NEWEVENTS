#!/bin/bash

# Alternative script to run migrations using Supabase CLI
# This links the project to the remote Supabase instance and pushes migrations

# Load environment variables
source .env.local

echo "=== Setting up Supabase CLI for Remote Migrations ==="

# Extract project ID from the Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Could not extract project ID from SUPABASE_URL"
    exit 1
fi

echo "Project ID: $PROJECT_ID"
echo ""

# Link to the remote project
echo "Linking to remote Supabase project..."
supabase link --project-ref $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "Error: Failed to link to Supabase project"
    echo "You may need to authenticate first with: supabase login"
    exit 1
fi

# Push the database schema (migrations)
echo ""
echo "Pushing migrations to remote database..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Migrations successfully pushed to remote database! ==="
    echo ""
    echo "You can verify the tables in your Supabase dashboard at:"
    echo "https://app.supabase.com/project/$PROJECT_ID/editor"
else
    echo ""
    echo "Error: Failed to push migrations"
    echo "Check the error messages above for details"
    exit 1
fi