#!/bin/bash

echo "🐳 Starting Flux Project with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up..."
docker-compose down -v --remove-orphans

# Build and start all services
echo "🏗️ Building and starting all services..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
echo "🔍 You can monitor progress in Docker Desktop"
echo ""
echo "🌟 Services will be available at:"
echo "🌐 Gateway API: http://localhost:3000"
echo "🔐 Auth Service: http://localhost:3001"
echo "👤 User Service: http://localhost:3002"
echo "🐰 RabbitMQ Management: http://localhost:15672"
echo ""
echo "📊 Management commands:"
echo "🔍 View logs: docker-compose logs -f"
echo "🛑 Stop project: docker-compose down"
echo "🔄 Restart: docker-compose restart"
echo ""
echo "🎉 Project started! Check Docker Desktop for status." 