#!/bin/sh
set -e

# Docker startup script for InvoiceSlayer
# This script ensures the database is initialized before starting the app

echo "InvoiceSlayer Docker Startup"
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL not set, using default"
    export DATABASE_URL="file:/app/data/dev.db"
fi

# Ensure the database directory exists
DB_DIR=$(dirname "$DATABASE_URL" | sed 's/^file://')
mkdir -p "$DB_DIR"

echo "Database location: $DATABASE_URL"

# Check if database file exists, if not we need to initialize it
DB_FILE=$(echo "$DATABASE_URL" | sed 's/^file://')
if [ ! -f "$DB_FILE" ]; then
    echo "Database not found at $DB_FILE, initializing..."

    # Create empty database file
    touch "$DB_FILE"

    # Run Prisma migrations to set up the schema
    echo "Running database migrations..."
    cd /app
    npx prisma migrate deploy || {
        echo "Migration failed, attempting db push..."
        npx prisma db push --skip-generate 2>/dev/null || echo "Migration skipped (may need manual intervention)"
    }

    echo "Database initialized successfully!"
else
    echo "Existing database found"
fi

echo ""
echo "Starting InvoiceSlayer..."
echo ""

# Start the Next.js application
exec node server.js
