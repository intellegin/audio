#!/bin/bash
# Database migration script for Vercel deployments
# This can be run as a Vercel build command or manually

set -e

echo "Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

# Run migrations using the migrate script
pnpm db:migrate

echo "Migrations completed successfully!"
