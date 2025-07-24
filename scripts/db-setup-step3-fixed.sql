-- Step 3: Supporting tables and initial data (Fixed version)
-- Execute AFTER db-setup-step2.sql is successful

-- Supporting tables (simple ones first)
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('new_board', 'thread_reply', 'friend_request', 'direct_message')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users_extended(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_threads_board_id ON threads(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user1_id ON chats(user1_id);

-- Basic RLS
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public user profiles" ON users_extended FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users_extended FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Boards are publicly readable" ON boards FOR SELECT USING (is_active = true);

CREATE POLICY "Threads are publicly readable" ON threads FOR SELECT USING (NOT is_archived);
CREATE POLICY "Users can create threads" ON threads FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Posts are publicly readable" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can read own connections" ON connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "Users can read own chats" ON chats FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_extended_updated_at BEFORE UPDATE ON users_extended FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial station data
INSERT INTO boards (name, description, type, latitude, longitude, access_radius, view_radius) VALUES
('品川駅', '品川駅周辺の情報交換', 'station', 35.6284, 139.7387, 300, 1500),
('渋谷駅', '渋谷駅周辺の情報交換', 'station', 35.6580, 139.7016, 300, 1500),
('新宿駅', '新宿駅周辺の情報交換', 'station', 35.6896, 139.7006, 300, 1500),
('池袋駅', '池袋駅周辺の情報交換', 'station', 35.7295, 139.7109, 300, 1500),
('東京駅', '東京駅周辺の情報交換', 'station', 35.6812, 139.7671, 300, 1500),
('上野駅', '上野駅周辺の情報交換', 'station', 35.7141, 139.7774, 300, 1500),
('秋葉原駅', '秋葉原駅周辺の情報交換', 'station', 35.6984, 139.7731, 300, 1500)
ON CONFLICT DO NOTHING;