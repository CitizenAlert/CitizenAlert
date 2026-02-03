-- PostgreSQL initialization script
-- This script runs when the database is first created

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add any initial setup here
-- Tables will be created automatically by TypeORM synchronize in development
-- or migrations in production

-- Create a test user (optional, for development)
-- Password is 'password123' hashed with bcrypt
-- INSERT INTO users (id, email, password, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
-- VALUES (
--   uuid_generate_v4(),
--   'test@example.com',
--   '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', -- Replace with actual bcrypt hash
--   'Test',
--   'User',
--   true,
--   NOW(),
--   NOW()
-- );
