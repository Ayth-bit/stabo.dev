-- Step 1: Extensions and basic tables
-- Execute in Supabase Dashboard SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users extended table (no dependencies)
CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(20) NOT NULL DEFAULT 'ユーザー',
  is_creator BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  qr_code VARCHAR(100) UNIQUE NOT NULL DEFAULT ('qr_' || gen_random_uuid()::text),
  points INTEGER DEFAULT 100,
  avatar_url TEXT,
  bio TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  home_base_name VARCHAR(100),
  home_base_lat DECIMAL(10, 8),
  home_base_lng DECIMAL(11, 8),
  base_radius INTEGER DEFAULT 1000,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table (depends on users_extended)
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('station', 'ward', 'park', 'custom')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  access_radius INTEGER DEFAULT 300,
  view_radius INTEGER DEFAULT 1500,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users_extended(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);