#!/bin/bash

# Deployment script for Zeabur
# This script prepares the application for deployment

set -e

echo "=== Preparing for Zeabur Deployment ==="

# Build the application
echo "Building application..."
npm run build

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix database initialization for Zeabur deployment" || echo "No changes to commit"

# Push to repository
echo "Pushing to repository..."
git push origin main

echo "=== Deployment Preparation Complete ==="
echo "Please check Zeabur dashboard for deployment status"
echo "Make sure the following environment variables are set in Zeabur:"
echo "  DATABASE_URL=file:/app/data/booking.db"
echo "  NODE_ENV=production"
echo "  BACKUP_SCHEDULE=0 2 * * *"
echo "  BACKUP_RETENTION_DAYS=30"
echo ""
echo "Make sure the following volumes are mounted:"
echo "  data -> /app/data"
echo "  backups -> /app/backups"
