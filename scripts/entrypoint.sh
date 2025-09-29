#!/bin/sh
set -e

echo "=== Starting Meetingroom App ==="

echo "Checking database directory..."
mkdir -p /app/data /app/backups

echo "Setting up database..."
if [ ! -f "/app/data/booking.db" ]; then
    echo "Database not found, creating new database..."
    npx prisma migrate deploy || {
        echo "Migration failed, trying db push..."
        npx prisma db push || echo "Warning: Database setup failed"
    }
else
    echo "Database exists, running migrations..."
    npx prisma migrate deploy || echo "Warning: Migration failed, but continuing..."
fi

echo "Verifying Prisma client..."
npx prisma generate

echo "Starting Next.js application..."
echo "PORT is set to: ${PORT}"
exec npm start
