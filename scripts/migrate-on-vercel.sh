#!/bin/bash
# Database migration script for Vercel deployments
# This can be run as a Vercel build command or manually

set -e

echo "Running database migrations..."

# Check if SUPABASE_URL and SUPABASE_DB_PASSWORD are set
if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL is not set"
  exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "Error: SUPABASE_DB_PASSWORD is not set"
  exit 1
fi

# Run migrations using the migrate script
pnpm db:migrate

echo "Migrations completed successfully!"
