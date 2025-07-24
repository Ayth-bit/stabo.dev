-- Step 4: Optional advanced tables
-- Execute ONLY if needed, AFTER step3-fixed is successful

-- Thread history table (depends on boards being fully set up)
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

-- Additional indexes for advanced features
CREATE INDEX IF NOT EXISTS idx_thread_history_thread_id ON thread_history(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_history_user_id ON thread_history(user_id);

-- RLS for thread history
ALTER TABLE thread_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own thread history" ON thread_history FOR SELECT USING (auth.uid() = user_id);

-- Advanced functions for post counting
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