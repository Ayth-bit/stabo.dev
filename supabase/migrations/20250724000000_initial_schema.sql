-- Initial schema for stabo.dev application
-- This migration creates all necessary tables for the location-based thread platform

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users extended table (for additional user information)
CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(20) NOT NULL,
  is_creator BOOLEAN DEFAULT FALSE,
  qr_code VARCHAR(100) UNIQUE NOT NULL,
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

-- Boards table (location-based discussion boards)
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('station', 'ward', 'park', 'custom')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  access_radius INTEGER DEFAULT 300, -- meters
  view_radius INTEGER DEFAULT 1500, -- meters
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users_extended(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threads table (discussion threads within boards)
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users_extended(id),
  author_name VARCHAR(20) NOT NULL,
  font_family VARCHAR(50) DEFAULT 'Noto Sans JP',
  is_global BOOLEAN DEFAULT FALSE,
  post_count INTEGER DEFAULT 0,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '72 hours'),
  is_archived BOOLEAN DEFAULT FALSE,
  restored_at TIMESTAMP WITH TIME ZONE,
  restore_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (individual posts within threads)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users_extended(id),
  author_name VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  font_family VARCHAR(50) DEFAULT 'Noto Sans JP',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table (user connections via QR codes)
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('new_board', 'thread_reply', 'friend_request', 'direct_message')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- can reference threads, boards, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users_extended(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'thread', 'board', etc.
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Station boards data (Yamanote Line 30 stations)
INSERT INTO boards (name, description, type, latitude, longitude, access_radius, view_radius) VALUES
('品川駅', '品川駅周辺の情報交換', 'station', 35.6284, 139.7387, 300, 1500),
('大崎駅', '大崎駅周辺の情報交換', 'station', 35.6197, 139.7286, 300, 1500),
('五反田駅', '五反田駅周辺の情報交換', 'station', 35.6258, 139.7238, 300, 1500),
('目黒駅', '目黒駅周辺の情報交換', 'station', 35.6332, 139.7156, 300, 1500),
('恵比寿駅', '恵比寿駅周辺の情報交換', 'station', 35.6465, 139.7102, 300, 1500),
('渋谷駅', '渋谷駅周辺の情報交換', 'station', 35.6580, 139.7016, 300, 1500),
('原宿駅', '原宿駅周辺の情報交換', 'station', 35.6702, 139.7027, 300, 1500),
('代々木駅', '代々木駅周辺の情報交換', 'station', 35.6835, 139.7020, 300, 1500),
('新宿駅', '新宿駅周辺の情報交換', 'station', 35.6896, 139.7006, 300, 1500),
('新大久保駅', '新大久保駅周辺の情報交換', 'station', 35.7016, 139.7005, 300, 1500),
('高田馬場駅', '高田馬場駅周辺の情報交換', 'station', 35.7123, 139.7038, 300, 1500),
('目白駅', '目白駅周辺の情報交換', 'station', 35.7214, 139.7062, 300, 1500),
('池袋駅', '池袋駅周辺の情報交換', 'station', 35.7295, 139.7109, 300, 1500),
('大塚駅', '大塚駅周辺の情報交換', 'station', 35.7315, 139.7285, 300, 1500),
('巣鴨駅', '巣鴨駅周辺の情報交換', 'station', 35.7335, 139.7389, 300, 1500),
('駒込駅', '駒込駅周辺の情報交換', 'station', 35.7362, 139.7468, 300, 1500),
('田端駅', '田端駅周辺の情報交換', 'station', 35.7612, 139.7607, 300, 1500),
('西日暮里駅', '西日暮里駅周辺の情報交換', 'station', 35.7320, 139.7669, 300, 1500),
('日暮里駅', '日暮里駅周辺の情報交換', 'station', 35.7279, 139.7710, 300, 1500),
('鶯谷駅', '鶯谷駅周辺の情報交換', 'station', 35.7206, 139.7786, 300, 1500),
('上野駅', '上野駅周辺の情報交換', 'station', 35.7141, 139.7774, 300, 1500),
('御徒町駅', '御徒町駅周辺の情報交換', 'station', 35.7077, 139.7743, 300, 1500),
('秋葉原駅', '秋葉原駅周辺の情報交換', 'station', 35.6984, 139.7731, 300, 1500),
('神田駅', '神田駅周辺の情報交換', 'station', 35.6916, 139.7708, 300, 1500),
('東京駅', '東京駅周辺の情報交換', 'station', 35.6812, 139.7671, 300, 1500),
('有楽町駅', '有楽町駅周辺の情報交換', 'station', 35.6751, 139.7634, 300, 1500),
('新橋駅', '新橋駅周辺の情報交換', 'station', 35.6663, 139.7583, 300, 1500),
('浜松町駅', '浜松町駅周辺の情報交換', 'station', 35.6554, 139.7570, 300, 1500),
('田町駅', '田町駅周辺の情報交換', 'station', 35.6456, 139.7476, 300, 1500),
('高輪ゲートウェイ駅', '高輪ゲートウェイ駅周辺の情報交換', 'station', 35.6356, 139.7407, 300, 1500);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threads_board_id ON threads(board_id);
CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_expires_at ON threads(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Spatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_boards_location ON boards USING GIST(ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_threads_location ON threads USING GIST(ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_users_extended_location ON users_extended USING GIST(ST_Point(location_lng, location_lat));

-- RLS (Row Level Security) policies
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users_extended FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users_extended FOR UPDATE USING (auth.uid() = id);

-- Users can read public user information
CREATE POLICY "Public user profiles" ON users_extended FOR SELECT USING (true);

-- Boards are publicly readable
CREATE POLICY "Boards are publicly readable" ON boards FOR SELECT USING (is_active = true);

-- Threads are publicly readable
CREATE POLICY "Threads are publicly readable" ON threads FOR SELECT USING (NOT is_archived);
CREATE POLICY "Users can create threads" ON threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own threads" ON threads FOR UPDATE USING (auth.uid() = author_id);

-- Posts are publicly readable
CREATE POLICY "Posts are publicly readable" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Friends table access
CREATE POLICY "Users can read own friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friend requests" ON friends FOR ALL USING (auth.uid() = user_id);

-- Direct messages access
CREATE POLICY "Users can read own messages" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own sent messages" ON direct_messages FOR UPDATE USING (auth.uid() = sender_id);

-- Notifications access
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_extended_updated_at BEFORE UPDATE ON users_extended FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON direct_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update thread post count
CREATE OR REPLACE FUNCTION update_thread_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE threads SET post_count = post_count + 1 WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE threads SET post_count = post_count - 1 WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_count_on_insert AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION update_thread_post_count();
CREATE TRIGGER update_post_count_on_delete AFTER DELETE ON posts FOR EACH ROW EXECUTE FUNCTION update_thread_post_count();

-- Function to check if thread should be archived (1000 posts limit)
CREATE OR REPLACE FUNCTION check_thread_archive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.post_count >= 1000 THEN
    NEW.is_archived = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_archive_on_post_count_update BEFORE UPDATE ON threads FOR EACH ROW EXECUTE FUNCTION check_thread_archive();