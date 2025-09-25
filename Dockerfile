# Use official Node.js LTS image
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create directories for data and backups
RUN mkdir -p /app/data /app/backups

# Initialize database
RUN npx prisma db push

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]