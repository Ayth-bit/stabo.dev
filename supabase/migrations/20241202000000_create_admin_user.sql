-- Create admin user migration
-- This migration creates a placeholder record for the admin user in users_extended

-- Insert admin user placeholder (will be linked when admin@example.com signs up)
INSERT INTO users_extended (
  id,
  display_name,
  is_creator,
  qr_code,
  points,
  notification_enabled,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Placeholder UUID for admin
  'Administrator',
  TRUE,
  'admin_qr_code_placeholder',
  1000,
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create admin management functions
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM users_extended 
    WHERE id = user_id AND is_creator = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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