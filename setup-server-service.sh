#!/bin/bash

# Setup Server Service
echo "🚀 Setting up Server Service..."

# Navigate to server service directory
cd services/server-service

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

echo "✅ Server Service setup completed!"

# Go back to root directory
cd ../..

echo "🔥 Server Service is ready to use!"
echo ""
echo "Next steps:"
echo "1. Start databases: docker-compose up -d postgres mongodb redis rabbitmq"
echo "2. Run migrations: cd services/server-service && npm run prisma:migrate"
echo "3. Start dev mode: cd services/server-service && npm run start:dev"
echo "4. Or use full setup: ./start.sh dev"
echo "5. Test the API endpoints using test-server-api.http"
