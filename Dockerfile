# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /app

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
RUN mkdir -p /app/data /app/backups

# Set the database URL environment variable directly in the image
ENV DATABASE_URL="file:/app/data/booking.db"
ENV NODE_ENV="production"

# Expose port
EXPOSE 3000

# Start the application by running the entrypoint script
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

CMD ["/app/scripts/entrypoint.sh"]