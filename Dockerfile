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

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]