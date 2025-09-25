#!/bin/bash

# Deployment script for Zeabur
set -e

echo "🚀 Deploying to Zeabur..."

# Build and push to Zeabur
echo "📦 Building application..."
npm run build

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📊 Checking database..."
npx prisma db push

echo "✅ Deployment preparation complete!"
echo "📋 Next steps:"
echo "1. Push your code to your git repository"
echo "2. Connect your repository to Zeabur"
echo "3. Configure environment variables in Zeabur dashboard"
echo "4. Set up volumes for /app/data and /app/backups"
echo "5. Deploy!"

echo ""
echo "🔧 Required Environment Variables:"
echo "   DATABASE_URL=file:./data/booking.db"
echo "   BACKUP_SCHEDULE=0 2 * * *"
echo "   BACKUP_RETENTION_DAYS=30"
echo "   NODE_ENV=production"

echo ""
echo "💾 Required Volumes:"
echo "   /app/data (for SQLite database)"
echo "   /app/backups (for backup files)"