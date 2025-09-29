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
    npx prisma migrate deploy || {
        echo "Migration deploy failed, trying db push to ensure schema is up to date..."
        npx prisma db push || echo "Warning: Database schema sync failed"
    }
fi

echo "Verifying Prisma client..."
npx prisma generate

echo "Starting backup system..."
# Start cron daemon in background
if command -v crond >/dev/null 2>&1; then
    echo "Starting cron daemon for automated backups..."
    crond -b -L /var/log/cron/cron.log

    # Run initial backup verification
    echo "Running initial backup system check..."
    /app/scripts/monitor-backups.sh health || echo "Warning: Initial backup health check failed"
else
    echo "Warning: cron daemon not available - automated backups disabled"
fi

# Set backup environment variables for cron jobs
export BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "Starting Next.js application..."
echo "PORT is set to: ${PORT}"
exec npm start
