#!/bin/sh
set -e

echo "Checking database directory..."
mkdir -p /app/data

echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed, but continuing..."

echo "Starting the application..."
exec npm start
