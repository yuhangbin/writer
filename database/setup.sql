-- ============================================================================
-- PostgreSQL Database Setup Script for Writer Project
-- ============================================================================
-- This script creates a new database, user, and grants necessary permissions.
--
-- USAGE:
--   1. Connect to PostgreSQL as superuser (usually postgres):
--      psql -U postgres
--
--   2. Execute this script:
--      \i database/setup.sql
--
--   OR run directly via command line:
--      psql -U postgres -f database/setup.sql
--
-- ============================================================================

-- ============================================================================
-- Step 1: Create Database User/Account
-- ============================================================================

-- Drop user if exists (for re-running setup)
-- Uncomment the line below if you want to reset the user
-- DROP USER IF EXISTS writer_user;

-- Create the application user with a secure password
-- CHANGE THE PASSWORD BELOW TO A SECURE ONE!
CREATE USER writer_user WITH
    ENCRYPTED PASSWORD 'change_this_secure_password_123!'

    -- Connection limits (optional, adjust based on your needs)
    CONNECTION LIMIT 20;

-- ============================================================================
-- Step 2: Create Database
-- ============================================================================

-- Drop database if exists (for re-running setup)
-- Uncomment the line below if you want to reset the database
-- DROP DATABASE IF EXISTS writer_db;

-- Create the database
CREATE DATABASE writer_db
    OWNER = writer_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- ============================================================================
-- Step 3: Grant Privileges
-- ============================================================================

-- Connect to the new database
\connect writer_db

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE writer_db TO writer_user;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO writer_user;

-- Allow user to create objects in the public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO writer_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO writer_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON FUNCTIONS TO writer_user;

-- Grant usage on all existing schemas
GRANT USAGE ON SCHEMA public TO writer_user;

-- ============================================================================
-- Step 4: Create Extensions (requires superuser)
-- ============================================================================

-- These must be created by a superuser, then made available to writer_user
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search (optional)

-- Grant usage on extensions
GRANT USAGE ON ALL FUNCTIONS IN SCHEMA public TO writer_user;

-- ============================================================================
-- Setup Complete
-- ============================================================================

-- Display success message
SELECT
    'Database setup complete!' AS status,
    'writer_db' AS database_name,
    'writer_user' AS database_user,
    'CHANGE THE PASSWORD!' AS security_warning;

-- ============================================================================
-- Next Steps:
-- ============================================================================
-- 1. Change the default password:
--    ALTER USER writer_user WITH PASSWORD 'your_new_secure_password';
--
-- 2. Load the schema:
--    \i database/schema.sql
--
-- 3. Test the connection:
--    psql -U writer_user -d writer_db -h localhost
--
-- 4. Configure your application with these credentials:
--    - Host: localhost (or your DB host)
--    - Port: 5432 (default PostgreSQL port)
--    - Database: writer_db
--    - User: writer_user
--    - Password: (your password)
-- ============================================================================
