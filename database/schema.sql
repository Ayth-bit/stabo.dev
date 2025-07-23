-- 位置連動型掲示板アプリ - 新機能追加スキーマ
-- ====================================
-- 注意: 既存のthreads, postsテーブルは変更しません
-- ====================================

-- ユーザー拡張テーブル（既存機能に影響しない追加情報）
CREATE TABLE users_extended (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    base_lat DECIMAL(10, 8), -- 拠点緯度
    base_lng DECIMAL(11, 8), -- 拠点経度
    base_radius INTEGER DEFAULT 1000, -- 拠点半径（メートル）
    is_creator BOOLEAN DEFAULT FALSE, -- ステッカー制作者フラグ
    qr_code TEXT UNIQUE, -- QRコード用ユニークID
    points INTEGER DEFAULT 0, -- ガチャ用ポイント
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー間接続（QR交換）
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, connected_user_id)
);

-- ステッカー
CREATE TABLE stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rarity INTEGER DEFAULT 1, -- 1:コモン, 2:レア, 3:スーパーレア
    effect_type TEXT, -- 'radius_boost' など
    effect_radius INTEGER, -- 効果範囲（メートル）
    price INTEGER DEFAULT 0, -- 販売価格（ポイント）
    is_for_sale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ガチャ結果
CREATE TABLE gacha_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 掲示板タイプ
CREATE TYPE board_type AS ENUM ('station', 'ward', 'park');

-- 掲示板
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type board_type NOT NULL,
    name TEXT NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    access_radius INTEGER NOT NULL, -- アクセス半径（メートル）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スレッド（投稿）
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sticker_id UUID REFERENCES stickers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- 寿命
    is_archived BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);

-- スレッド履歴（削除・アーカイブ時に移動）
CREATE TABLE thread_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL, -- 元のthread.id
    board_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    sticker_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_reason TEXT -- 'expired', 'limit_reached', 'manual' など
);

-- チャット
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK(user1_id < user2_id) -- 順序を統一
);

-- チャットメッセージ
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sticker_id UUID REFERENCES stickers(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'new_board', 'chat_message', 'sticker_drop' など
    title TEXT NOT NULL,
    message TEXT,
    data JSONB, -- 追加データ（board_id, chat_id など）
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいね
CREATE TABLE thread_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- ====================================
-- インデックス
-- ====================================

-- 位置検索用のインデックス
CREATE INDEX idx_boards_location ON boards USING GIST(ll_to_earth(lat, lng));
CREATE INDEX idx_users_base_location ON users USING GIST(ll_to_earth(base_lat, base_lng)) WHERE base_lat IS NOT NULL;

-- よく使われる検索用インデックス
CREATE INDEX idx_threads_board_created ON threads(board_id, created_at DESC);
CREATE INDEX idx_threads_user_created ON threads(user_id, created_at DESC);
CREATE INDEX idx_threads_expires_at ON threads(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_gacha_results_user_obtained ON gacha_results(user_id, obtained_at DESC);

-- ====================================
-- RLS（Row Level Security）
-- ====================================

-- users_extended
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all extended profiles" ON users_extended FOR SELECT USING (true);
CREATE POLICY "Users can insert their extended profile" ON users_extended FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own extended profile" ON users_extended FOR UPDATE USING (auth.uid() = id);

-- users  
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their connections" ON connections FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "Users can create their connections" ON connections FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- stickers
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stickers" ON stickers FOR SELECT USING (true);
CREATE POLICY "Creators can manage their stickers" ON stickers FOR ALL 
    USING (auth.uid() = creator_id);

-- threads
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active threads" ON threads FOR SELECT 
    USING (NOT is_archived AND (expires_at IS NULL OR expires_at > NOW()));
CREATE POLICY "Users can create threads" ON threads FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their threads" ON threads FOR UPDATE 
    USING (auth.uid() = user_id);

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their chat messages" ON chat_messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM chats c 
        WHERE c.id = chat_id 
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    ));
CREATE POLICY "Users can send chat messages" ON chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT 
    USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- ====================================
-- 関数とトリガー
-- ====================================

-- updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- スレッド数制限と古い投稿の自動アーカイブ
CREATE OR REPLACE FUNCTION archive_old_threads()
RETURNS TRIGGER AS $$
BEGIN
    -- 期限切れスレッドをアーカイブ
    INSERT INTO thread_history (thread_id, board_id, user_id, content, sticker_id, created_at, archive_reason)
    SELECT id, board_id, user_id, content, sticker_id, created_at, 'expired'
    FROM threads 
    WHERE expires_at IS NOT NULL AND expires_at < NOW() AND NOT is_archived;
    
    UPDATE threads SET is_archived = TRUE 
    WHERE expires_at IS NOT NULL AND expires_at < NOW() AND NOT is_archived;
    
    -- 掲示板ごとの投稿数制限（例：100件）
    WITH ranked_threads AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY board_id ORDER BY created_at DESC) as rn
        FROM threads WHERE NOT is_archived
    )
    INSERT INTO thread_history (thread_id, board_id, user_id, content, sticker_id, created_at, archive_reason)
    SELECT t.id, t.board_id, t.user_id, t.content, t.sticker_id, t.created_at, 'limit_reached'
    FROM threads t
    JOIN ranked_threads rt ON t.id = rt.id
    WHERE rt.rn > 100 AND NOT t.is_archived;
    
    UPDATE threads SET is_archived = TRUE 
    WHERE id IN (
        SELECT t.id FROM threads t
        JOIN ranked_threads rt ON t.id = rt.id
        WHERE rt.rn > 100 AND NOT t.is_archived
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- スレッド作成時にアーカイブトリガーを実行
CREATE TRIGGER trigger_archive_old_threads
    AFTER INSERT ON threads
    FOR EACH STATEMENT EXECUTE FUNCTION archive_old_threads();

-- チャット最終メッセージ更新
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message = NEW.message, last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_chat_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- いいね数カウント更新
CREATE OR REPLACE FUNCTION update_thread_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE threads SET like_count = like_count + 1 WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE threads SET like_count = like_count - 1 WHERE id = OLD.thread_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_thread_like_count
    AFTER INSERT OR DELETE ON thread_likes
    FOR EACH ROW EXECUTE FUNCTION update_thread_like_count();

-- ====================================
-- 初期データ（サンプル）
-- ====================================

-- サンプル掲示板（東京主要駅）
INSERT INTO boards (type, name, lat, lng, access_radius) VALUES
('station', '新宿駅', 35.6896, 139.7006, 1650), -- 1.65km
('station', '渋谷駅', 35.6580, 139.7016, 1650),
('station', '池袋駅', 35.7295, 139.7109, 1650),
('station', '東京駅', 35.6812, 139.7671, 1650),
('station', '品川駅', 35.6284, 139.7387, 1650);

-- サンプル掲示板（東京23区）
INSERT INTO boards (type, name, lat, lng, access_radius) VALUES
('ward', '千代田区', 35.6941, 139.7534, 3000), -- 3km
('ward', '中央区', 35.6702, 139.7705, 3000),
('ward', '港区', 35.6584, 139.7519, 3000),
('ward', '新宿区', 35.6940, 139.7036, 3000),
('ward', '渋谷区', 35.6580, 139.7016, 3000);

-- サンプル掲示板（都立公園）
INSERT INTO boards (type, name, lat, lng, access_radius) VALUES
('park', '上野恩賜公園', 35.7141, 139.7736, 1000), -- 1km
('park', '代々木公園', 35.6732, 139.6940, 1000),
('park', '井の頭恩賜公園', 35.7009, 139.5773, 1000),
('park', '新宿御苑', 35.6851, 139.7101, 1000);

-- サンプルステッカー
INSERT INTO stickers (name, image_url, creator_id, rarity, effect_type, effect_radius, is_for_sale, price) VALUES
('基本スタンプ', 'https://example.com/basic.png', NULL, 1, NULL, NULL, TRUE, 100),
('レア桜スタンプ', 'https://example.com/sakura.png', NULL, 2, 'radius_boost', 500, TRUE, 500),
('スーパーレア東京タワー', 'https://example.com/tower.png', NULL, 3, 'radius_boost', 1000, TRUE, 1000);