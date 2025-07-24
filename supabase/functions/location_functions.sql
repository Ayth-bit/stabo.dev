-- Supabase PostgreSQL Functions for Location-based SNS
-- Generated for Tokyo 23-ku location-based thread system

-- Function 1: get_visible_threads
-- Gets threads within 1.5km radius, max 3 items, within 72 hours
CREATE OR REPLACE FUNCTION get_visible_threads(latitude float8, longitude float8)
RETURNS SETOF threads AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM threads t
  WHERE 
    -- Within 72 hours (including restored threads)
    (t.created_at >= now() - interval '72 hours' OR 
     (t.is_restored = true AND t.restored_at >= now() - interval '72 hours'))
    -- Within 1.5km radius using PostGIS
    AND ST_DWithin(
      t.location,
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
      1500  -- 1.5km in meters
    )
  ORDER BY t.created_at DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: can_post
-- Checks if user is within 300m of their home base
CREATE OR REPLACE FUNCTION can_post(latitude float8, longitude float8)
RETURNS boolean AS $$
DECLARE
  user_home_base geometry;
  current_location geometry;
BEGIN
  -- Get current authenticated user's home base
  SELECT ue.home_base INTO user_home_base
  FROM users_extended ue
  WHERE ue.user_id = auth.uid();
  
  -- Return false if no home base is set
  IF user_home_base IS NULL THEN
    RETURN false;
  END IF;
  
  -- Create point from current location
  current_location := ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
  
  -- Check if within 300m of home base
  RETURN ST_DWithin(user_home_base, current_location, 300);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: is_within_tokyo_23ku
-- Checks if location is within Tokyo 23 wards boundary
CREATE OR REPLACE FUNCTION is_within_tokyo_23ku(latitude float8, longitude float8)
RETURNS boolean AS $$
DECLARE
  location_point geometry;
  ward_count integer;
BEGIN
  -- Create point from coordinates
  location_point := ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
  
  -- Check if point is within any of the 23 wards
  SELECT COUNT(*) INTO ward_count
  FROM tokyo_23ku_boundary t23
  WHERE ST_Contains(t23.geom, location_point);
  
  -- Return true if point is within at least one ward
  RETURN ward_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 4: restore_thread
-- Restores a thread within 72 hours, only once, by original creator
CREATE OR REPLACE FUNCTION restore_thread(thread_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
  thread_record threads%ROWTYPE;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Verify user_id matches authenticated user
  IF current_user_id != user_id THEN
    RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;
  
  -- Get thread record
  SELECT * INTO thread_record
  FROM threads t
  WHERE t.id = thread_id;
  
  -- Check if thread exists
  IF thread_record.id IS NULL THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;
  
  -- Check if user is the thread creator
  IF thread_record.user_id != current_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Only thread creator can restore';
  END IF;
  
  -- Check if already restored
  IF thread_record.is_restored = true THEN
    RAISE EXCEPTION 'Thread already restored';
  END IF;
  
  -- Check if within 72 hours of creation
  IF thread_record.created_at < now() - interval '72 hours' THEN
    RAISE EXCEPTION 'Thread restore period expired (72 hours)';
  END IF;
  
  -- Update thread to restored status
  UPDATE threads
  SET 
    is_restored = true,
    restored_at = now()
  WHERE id = thread_id;
  
  -- Return success
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE LOG 'restore_thread error: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_visible_threads(float8, float8) TO authenticated;
GRANT EXECUTE ON FUNCTION can_post(float8, float8) TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_tokyo_23ku(float8, float8) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_thread(uuid, uuid) TO authenticated;

-- Create indexes for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_threads_location_gist ON threads USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads (created_at);
CREATE INDEX IF NOT EXISTS idx_threads_is_restored ON threads (is_restored);
CREATE INDEX IF NOT EXISTS idx_users_extended_home_base_gist ON users_extended USING GIST (home_base);
CREATE INDEX IF NOT EXISTS idx_tokyo_23ku_boundary_geom_gist ON tokyo_23ku_boundary USING GIST (geom);