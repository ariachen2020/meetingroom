# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /app

# Install system dependencies for backups and cron
RUN apk add --no-cache \
    sqlite \
    dcron \
    tini

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create directories for data and backups
RUN mkdir -p /app/data /app/backups /var/log/cron

# Copy backup and migration scripts and make them executable
COPY scripts/backup.sh /app/scripts/backup.sh
COPY scripts/verify-backups.sh /app/scripts/verify-backups.sh
COPY scripts/monitor-backups.sh /app/scripts/monitor-backups.sh
COPY scripts/fix-migration.sh /app/scripts/fix-migration.sh
COPY scripts/init-db.sh /app/scripts/init-db.sh
COPY scripts/crontab /etc/cron.d/backup-cron

RUN chmod +x /app/scripts/backup.sh \
    && chmod +x /app/scripts/verify-backups.sh \
    && chmod +x /app/scripts/monitor-backups.sh \
    && chmod +x /app/scripts/fix-migration.sh \
    && chmod +x /app/scripts/init-db.sh \
    && chmod 0644 /etc/cron.d/backup-cron \
    && crontab /etc/cron.d/backup-cron

# Set the database URL environment variable directly in the image
ENV DATABASE_URL="file:/app/data/booking.db"
ENV NODE_ENV="production"

# Expose port
EXPOSE 3000

# Start the application by running the entrypoint script
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

# Use tini as init system to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/scripts/entrypoint.sh"]