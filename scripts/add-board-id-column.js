-- Add board_id column to threads table and migrate existing data
-- This migration integrates the existing coordinate-based thread system with the new board system

-- Add board_id column to threads table
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES boards(id) ON DELETE SET NULL;

-- Add missing columns that exist in local schema but not in production
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users_extended(id),
ADD COLUMN IF NOT EXISTS author_name VARCHAR(20),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Noto Sans JP',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '72 hours'),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restore_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users_extended(id),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Remove columns that shouldn't exist in posts
ALTER TABLE posts DROP COLUMN IF EXISTS link;
ALTER TABLE posts DROP COLUMN IF EXISTS color;

-- Create function to automatically match threads to nearest boards
CREATE OR REPLACE FUNCTION match_thread_to_nearest_board(thread_lat DECIMAL, thread_lng DECIMAL)
RETURNS UUID AS $$
DECLARE
    nearest_board_id UUID;
    min_distance FLOAT := 5000; -- 5km maximum distance
    board_record RECORD;
    distance FLOAT;
BEGIN
    -- Find the nearest board within 5km
    FOR board_record IN 
        SELECT id, latitude, longitude 
        FROM boards 
        WHERE is_active = true
    LOOP
        -- Calculate distance using Haversine formula (simplified)
        distance := SQRT(
            POWER((thread_lat - board_record.latitude) * 111320, 2) +
            POWER((thread_lng - board_record.longitude) * 111320 * COS(RADIANS(thread_lat)), 2)
        );
        
        IF distance < min_distance THEN
            min_distance := distance;
            nearest_board_id := board_record.id;
        END IF;
    END LOOP;
    
    RETURN nearest_board_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing threads with board_id based on their coordinates
UPDATE threads 
SET board_id = match_thread_to_nearest_board(latitude, longitude)
WHERE board_id IS NULL 
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND NOT is_global;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threads_board_id ON threads(board_id);
CREATE INDEX IF NOT EXISTS idx_threads_coordinates ON threads(latitude, longitude);

-- Update the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for threads updated_at
DROP TRIGGER IF EXISTS update_threads_updated_at ON threads;
CREATE TRIGGER update_threads_updated_at 
  BEFORE UPDATE ON threads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for posts updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();