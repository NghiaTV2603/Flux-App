#!/bin/bash

echo "🧪 Testing Flux Project Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if databases are running
echo "📦 Checking databases..."
if docker-compose ps | grep -q "flux-postgres.*Up"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    exit 1
fi

if docker-compose ps | grep -q "flux-redis.*Up"; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not running"
    exit 1
fi

if docker-compose ps | grep -q "flux-rabbitmq.*Up"; then
    echo "✅ RabbitMQ is running"
else
    echo "❌ RabbitMQ is not running"
    exit 1
fi

# Test Auth Service setup
echo "🔐 Testing Auth Service..."
cd services/auth-service

if [ ! -d "node_modules" ]; then
    echo "📦 Installing Auth Service dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    echo 'DATABASE_URL="postgresql://flux_user:flux_password@localhost:5432/flux_auth_db"' > .env
    echo 'JWT_SECRET="your-super-secret-jwt-key-change-in-production"' >> .env
    echo 'PORT=3001' >> .env
fi

echo "🗄️ Testing Prisma connection..."
if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo "✅ Auth Service database connection successful"
else
    echo "❌ Auth Service database connection failed"
    cd ../..
    exit 1
fi

echo "🔨 Testing Auth Service build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Auth Service builds successfully"
else
    echo "❌ Auth Service build failed"
    cd ../..
    exit 1
fi

cd ../..

# Test User Service setup
echo "👤 Testing User Service..."
cd services/user-service

if [ ! -d "node_modules" ]; then
    echo "📦 Installing User Service dependencies..."
    npm install
fi

echo "🔨 Testing User Service build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ User Service builds successfully"
else
    echo "❌ User Service build failed"
    cd ../..
    exit 1
fi

cd ../..

# Test Gateway API setup
echo "🌐 Testing Gateway API..."
cd services/gateway-api

if [ ! -d "node_modules" ]; then
    echo "📦 Installing Gateway API dependencies..."
    npm install
fi

echo "🔨 Testing Gateway API build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Gateway API builds successfully"
else
    echo "❌ Gateway API build failed"
    cd ../..
    exit 1
fi

cd ../..

echo ""
echo "🎉 All tests passed! Your Flux project is ready for development."
echo ""
echo "Next steps:"
echo "1. Start Auth Service: cd services/auth-service && npm run start:dev"
echo "2. Start User Service: cd services/user-service && npm run start:dev"
echo "3. Start Gateway API: cd services/gateway-api && npm run start:dev"
echo ""
echo "Or use the start script: ./start.sh dev" 