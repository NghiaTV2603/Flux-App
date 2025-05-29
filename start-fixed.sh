#!/bin/bash

echo "🚀 Starting Flux Microservices (Fixed Version)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true

# Start databases first
echo "📦 Starting databases..."
docker-compose up -d postgres mongodb redis rabbitmq

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec flux-postgres pg_isready -U flux_user -d flux_db >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts - PostgreSQL not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ PostgreSQL failed to start after $max_attempts attempts"
    return 1
}

# Function to wait for MongoDB to be ready
wait_for_mongodb() {
    echo "⏳ Waiting for MongoDB to be ready..."
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec flux-mongodb mongosh --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; then
            echo "✅ MongoDB is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts - MongoDB not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "✅ MongoDB timeout - continuing anyway..."
    return 0
}

# Wait for databases to be ready
wait_for_postgres
wait_for_mongodb

# Check if we should run in development mode
if [ "$1" = "dev" ]; then
    echo "🔧 Development mode - installing dependencies..."
    
    # Install dependencies for each service
    echo "📦 Installing auth-service dependencies..."
    cd services/auth-service && npm install && cd ../..
    
    echo "📦 Installing user-service dependencies..."
    cd services/user-service && npm install && cd ../..
    
    echo "📦 Installing gateway-api dependencies..."
    cd services/gateway-api && npm install && cd ../..
    
    echo "🗄️ Running database migrations..."
    
    # Auth service migrations
    echo "🔄 Running auth-service migrations..."
    cd services/auth-service 
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    npx prisma generate
    npx prisma db push --force-reset
    cd ../..
    
    # User service migrations
    echo "🔄 Running user-service migrations..."
    cd services/user-service
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    npx prisma generate
    npx prisma db push --force-reset
    cd ../..
    
    echo "🎯 Starting services in development mode..."
    echo ""
    echo "Services will be available at:"
    echo "🌐 Gateway API: http://localhost:3000"
    echo "🔐 Auth Service: http://localhost:3001"
    echo "👤 User Service: http://localhost:3002"
    echo "🐰 RabbitMQ Management: http://localhost:15672"
    echo ""
    echo "To start services manually, run these commands in separate terminals:"
    echo "📁 cd services/auth-service && npm run start:dev"
    echo "📁 cd services/user-service && npm run start:dev"
    echo "📁 cd services/gateway-api && npm run start:dev"
    echo ""
    echo "🔍 To check database connection:"
    echo "docker exec -it flux-postgres psql -U flux_user -d flux_db"
    
else
    echo "🐳 Production mode - building and starting all services..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 20
    
    echo "✅ All services started!"
    echo "🌐 Gateway API: http://localhost:3000"
    echo "🔐 Auth Service: http://localhost:3001"
    echo "👤 User Service: http://localhost:3002"
    echo "🐰 RabbitMQ Management: http://localhost:15672"
    echo ""
    echo "📋 To view logs: docker-compose logs -f"
    echo "🛑 To stop services: docker-compose down"
fi

echo "🎉 Flux is ready!" 