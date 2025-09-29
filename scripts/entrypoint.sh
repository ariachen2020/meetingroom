#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations complete."

echo "Starting the application..."
exec npm start
