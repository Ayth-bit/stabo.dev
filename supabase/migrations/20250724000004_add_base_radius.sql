-- Add base_radius column to users_extended table
-- This migration adds the missing base_radius column for user activity radius

ALTER TABLE users_extended 
ADD COLUMN IF NOT EXISTS base_radius INTEGER DEFAULT 1000;