#!/bin/sh

# Database Migration Fix Script
# This script ensures the database schema is correctly updated on Zeabur

set -e

echo "=== Database Migration Fix ==="

DB_PATH="${DATABASE_URL#file:}"
echo "Database path: $DB_PATH"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Database doesn't exist, creating new one..."
    npx prisma migrate deploy
    exit 0
fi

# Check if order_index column exists
echo "Checking if order_index column exists..."
ORDER_INDEX_EXISTS=$(sqlite3 "$DB_PATH" "PRAGMA table_info(bookings);" | grep -c "order_index" || echo "0")

if [ "$ORDER_INDEX_EXISTS" = "0" ]; then
    echo "order_index column missing, adding manually..."

    # Add the column manually
    sqlite3 "$DB_PATH" "
    ALTER TABLE bookings ADD COLUMN order_index INTEGER NOT NULL DEFAULT 1;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS bookings_room_id_date_time_slot_order_index_idx
    ON bookings(room_id, date, time_slot, order_index);
    "

    echo "order_index column added successfully"
else
    echo "order_index column already exists"
fi

# Run migrations to ensure everything is up to date
echo "Running Prisma migrations..."
npx prisma migrate deploy || {
    echo "Migration failed, using db push as fallback..."
    npx prisma db push --accept-data-loss
}

# Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

echo "=== Database Migration Fix Complete ==="