-- Add missing tables for user connections and chat functionality
-- This migration adds the connections table and chat-related tables

-- Connections table (for friend relationships)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Chats table (for direct message conversations)
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

-- Chat messages table (for individual messages in chats)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread history table (for archived threads)
CREATE TABLE IF NOT EXISTS thread_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  board_id UUID REFERENCES boards(id),
  user_id UUID REFERENCES users_extended(id),
  content TEXT NOT NULL,
  archive_reason VARCHAR(50) NOT NULL CHECK (archive_reason IN ('expired', 'user_deleted', 'admin_deleted', 'post_limit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user1_id ON chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2_id ON chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_thread_history_thread_id ON thread_history(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_history_user_id ON thread_history(user_id);

-- RLS policies for connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own connections" ON connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "Users can manage own connections" ON connections FOR ALL USING (auth.uid() = user_id);

-- RLS policies for chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own chats" ON chats FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS policies for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read messages in their chats" ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = chat_messages.chat_id 
    AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON chat_messages FOR UPDATE USING (auth.uid() = sender_id);

-- RLS policies for thread history
ALTER TABLE thread_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own thread history" ON thread_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert thread history" ON thread_history FOR INSERT WITH CHECK (true);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last message in chats
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chats 
    SET last_message = NEW.message, last_message_at = NEW.created_at 
    WHERE id = NEW.chat_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_last_message_on_insert AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();