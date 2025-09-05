#!/bin/bash

# Email Service - Local Development Runner
echo "🚀 Starting Email Service locally..."

# Check if local.env exists
if [ ! -f "local.env" ]; then
    echo "❌ local.env file not found! Please create it from env.example"
    exit 1
fi

echo "📋 Loading environment variables from local.env..."
export $(grep -v '^#' local.env | xargs)

echo "🔧 Environment Configuration:"
echo "  - Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "  - Redis: $REDIS_HOST:$REDIS_PORT"
echo "  - RabbitMQ: $RABBITMQ_HOST:$RABBITMQ_PORT"
echo "  - SMTP: $SMTP_HOST:$SMTP_PORT"
echo "  - Server Port: $SERVER_PORT"

echo ""
echo "🏗️  Building project..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix compilation errors."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🔗 Testing connections..."

# Test PostgreSQL connection (optional)
# psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
# if [ $? -eq 0 ]; then
#     echo "✅ PostgreSQL connection OK"
# else
#     echo "⚠️  PostgreSQL connection failed - please check database"
# fi

echo ""
echo "🌟 Starting Email Service..."
echo "📊 Health Check URL: http://localhost:$SERVER_PORT/api/v1/actuator/health"
echo "📈 Metrics URL: http://localhost:$SERVER_PORT/api/v1/actuator/metrics"
echo ""
echo "🛑 Press Ctrl+C to stop the service"
echo "========================================"

# Run the application with environment variables
mvn spring-boot:run -Dspring-boot.run.profiles=development

