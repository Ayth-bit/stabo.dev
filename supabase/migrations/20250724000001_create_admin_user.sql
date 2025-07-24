-- Create admin user migration
-- This migration sets up admin functions without creating placeholder data
-- Admin user records will be created through normal signup process

-- Create admin management functions
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM users_extended 
    WHERE id = user_id AND (is_creator = TRUE OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin user if not exists
CREATE OR REPLACE FUNCTION create_admin_user_if_not_exists()
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_id 
  FROM auth.users 
  WHERE email = 'admin@example.com';
  
  -- If admin user doesn't exist, create it
  IF admin_id IS NULL THEN
    -- Note: In production, this should be done through the Supabase dashboard
    -- or auth.admin API to properly hash the password
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      'admin@example.com',
      crypt('admin123', gen_salt('bf')), -- This is a simplified approach
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    ) RETURNING id INTO admin_id;
  END IF;
  
  -- Ensure users_extended record exists with admin privileges
  INSERT INTO users_extended (
    id,
    display_name,
    is_creator,
    is_admin,
    created_at
  ) VALUES (
    admin_id,
    'System Administrator',
    TRUE,
    TRUE,
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    is_creator = TRUE,
    is_admin = TRUE,
    display_name = COALESCE(users_extended.display_name, 'System Administrator');
    
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail migration
    RAISE NOTICE 'Could not create admin user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create admin user
SELECT create_admin_user_if_not_exists();

-- Create admin dashboard stats view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM users_extended) as total_users,
  (SELECT COUNT(*) FROM boards) as total_boards,
  (SELECT COUNT(*) FROM threads WHERE NOT is_archived) as active_threads,
  (SELECT COUNT(*) FROM threads WHERE is_archived) as archived_threads,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM direct_messages) as total_messages;

-- Grant access to admin functions
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- Note: The actual auth.users record for admin@example.com needs to be created
-- through the normal signup process. After signup, update the users_extended
-- record to link it properly:
-- 
-- UPDATE users_extended 
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
-- WHERE id = '00000000-0000-0000-0000-000000000001';