FROM node:18-slim

# Install dependencies needed for Prisma and curl for healthcheck
RUN apt-get update && apt-get install -y curl openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3002

# Start the application
CMD ["npm", "run", "start:prod"] 