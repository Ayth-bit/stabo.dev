-- Fix RLS policy for users_extended table to allow INSERT operations
-- This migration adds the missing INSERT policy for user registration

-- Add INSERT policy for users_extended table
CREATE POLICY "Users can insert own data" ON users_extended FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Ensure service role can bypass RLS for admin operations
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;