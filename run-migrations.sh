#!/bin/bash

# Script to run Supabase migrations on the remote database
# This script connects directly to the Supabase database and runs the migration files

# Load environment variables
source .env.local

# Database connection string
DATABASE_URL="${POSTGRES_URL_NON_POOLING}"

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set. Please check your .env.local file."
    exit 1
fi

echo "=== Running Supabase Migrations ==="
echo "Database: ${POSTGRES_HOST}"
echo ""

# Run migrations in order
MIGRATION_DIR="./supabase/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo "Error: Migration directory not found at $MIGRATION_DIR"
    exit 1
fi

# Get all SQL files in the migrations directory, sorted by name
for migration_file in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo "Running migration: $filename"
        
        # Run the migration file
        psql "$DATABASE_URL" -f "$migration_file" -v ON_ERROR_STOP=1
        
        if [ $? -eq 0 ]; then
            echo "✓ Successfully ran: $filename"
        else
            echo "✗ Failed to run: $filename"
            echo "Stopping migration process due to error."
            exit 1
        fi
        echo ""
    fi
done

echo "=== All migrations completed successfully! ==="
echo ""
echo "You can verify the tables were created by running:"
echo "psql \"$DATABASE_URL\" -c '\\dt'"