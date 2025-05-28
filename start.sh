#!/bin/bash

echo "🚀 Starting Flux Microservices..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start databases first
echo "📦 Starting databases..."
docker-compose up -d postgres mongodb redis rabbitmq

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Check if we should run in development mode
if [ "$1" = "dev" ]; then
    echo "🔧 Development mode - installing dependencies..."
    
    # Install dependencies for each service
    cd services/auth-service && npm install && cd ../..
    cd services/user-service && npm install && cd ../..
    cd services/gateway-api && npm install && cd ../..
    
    echo "🗄️ Running database migrations..."
    cd services/auth-service && npx prisma generate && npx prisma db push && cd ../..
    cd services/user-service && npx prisma generate && npx prisma db push && cd ../..
    
    echo "🎯 Starting services in development mode..."
    echo "Auth Service will be available at http://localhost:3001"
    echo "User Service will be available at http://localhost:3002"
    echo "Gateway API will be available at http://localhost:3000"
    echo ""
    echo "To start services manually:"
    echo "cd services/auth-service && npm run start:dev"
    echo "cd services/user-service && npm run start:dev"
    echo "cd services/gateway-api && npm run start:dev"
else
    echo "🐳 Production mode - building and starting all services..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 15
    
    echo "✅ All services started!"
    echo "Gateway API: http://localhost:3000"
    echo "Auth Service: http://localhost:3001"
    echo "User Service: http://localhost:3002"
    echo "RabbitMQ Management: http://localhost:15672"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
fi

echo "🎉 Flux is ready!" 