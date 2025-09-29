# Use official Node.js LTS image
FROM node:18

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Create directories for data and backups
RUN mkdir -p /app/data /app/backups

# Set the database URL environment variable directly in the image
ENV DATABASE_URL="file:/app/data/booking.db"

# Expose port
EXPOSE 3000

# Start the application by running the entrypoint script
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh
CMD ["/app/scripts/entrypoint.sh"]