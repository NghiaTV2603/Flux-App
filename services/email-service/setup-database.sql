-- Email Service Database Setup Script
-- Run this in your PostgreSQL instance

-- Create database
CREATE DATABASE flux_email_db;

-- Create user
CREATE USER flux_user WITH PASSWORD 'flux_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE flux_email_db TO flux_user;

-- Connect to the database
\c flux_email_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO flux_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flux_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flux_user;

-- Create extension if needed (for JSON support)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify setup
SELECT current_database(), current_user;

