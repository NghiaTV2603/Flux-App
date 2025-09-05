# Why: Multi-stage build để optimize image size
# Context: Production-ready Docker image cho Spring Boot application

# Build stage
FROM maven:3.9.4-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Why: Copy pom.xml first để leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Why: Copy source code và build application
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

# Why: Create non-root user cho security
RUN addgroup -g 1001 -S emailservice && \
    adduser -u 1001 -S emailservice -G emailservice

WORKDIR /app

# Why: Copy JAR file từ build stage
COPY --from=build /app/target/email-service-*.jar app.jar

# Why: Change ownership của application files
RUN chown -R emailservice:emailservice /app

# Why: Switch to non-root user
USER emailservice

# Why: Expose port cho health checks và application
EXPOSE 8085

# Why: Health check để monitoring container status
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8085/api/v1/actuator/health || exit 1

# Why: JVM tuning cho container environment
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC -XX:G1HeapRegionSize=16m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
