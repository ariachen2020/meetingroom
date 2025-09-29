#!/bin/sh

# Database Initialization Script
# This script ensures the database is properly initialized

set -e

echo "=== Database Initialization ==="

# Set default DATABASE_URL if not set (for production)
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/data/booking.db"
fi

DB_PATH="${DATABASE_URL#file:}"
echo "Database path: $DB_PATH"

# Ensure directory exists
mkdir -p "$(dirname "$DB_PATH")"

# Remove any existing empty database
if [ -f "$DB_PATH" ] && [ ! -s "$DB_PATH" ]; then
    echo "Removing empty database file..."
    rm -f "$DB_PATH"
fi

# Initialize database if it doesn't exist
if [ ! -f "$DB_PATH" ]; then
    echo "Creating new database..."
    
    # Generate Prisma client first
    npx prisma generate
    
    # Create database using db push (more reliable than migrate deploy for new databases)
    npx prisma db push --force-reset
    
    echo "Database created successfully"
else
    echo "Database already exists, checking schema..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Check if database has proper schema
    if sqlite3 "$DB_PATH" ".schema" | grep -q "bookings"; then
        echo "Database schema is valid"
        
        # Run migrations to ensure schema is up to date
        npx prisma migrate deploy || {
            echo "Migration failed, using db push..."
            npx prisma db push --accept-data-loss
        }
    else
        echo "Database schema is invalid, recreating..."
        rm -f "$DB_PATH"
        npx prisma db push --force-reset
    fi
    
    echo "Database schema updated"
fi

# Final verification
echo "Verifying database..."
if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ] && sqlite3 "$DB_PATH" ".schema" | grep -q "bookings"; then
    echo "Database verification successful"
    echo "Database size: $(ls -lh "$DB_PATH" | awk '{print $5}')"
else
    echo "Database verification failed, recreating..."
    rm -f "$DB_PATH"
    npx prisma db push --force-reset
    echo "Database recreated successfully"
fi

echo "=== Database Initialization Complete ==="
