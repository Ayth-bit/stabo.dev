-- Seed data for stabo.dev application
-- This file populates the database with initial test data

-- Create a test admin user (this will be inserted when a user signs up with admin@example.com)
-- The actual user record will be created by Supabase Auth, but we can prepare the extended data

-- Insert all Yamanote Line station boards (30 stations, view_radius: 1500m, access_radius: 300m)
INSERT INTO boards (name, description, type, latitude, longitude, access_radius, view_radius) VALUES
-- Yamanote Line Stations (complete set)
('東京駅', '東京駅周辺の情報交換', 'station', 35.6812, 139.7671, 300, 1500),
('神田駅', '神田駅周辺の情報交換', 'station', 35.6916, 139.7708, 300, 1500),
('秋葉原駅', '秋葉原駅周辺の情報交換', 'station', 35.6984, 139.7731, 300, 1500),
('御徒町駅', '御徒町駅周辺の情報交換', 'station', 35.7077, 139.7742, 300, 1500),
('上野駅', '上野駅周辺の情報交換', 'station', 35.7138, 139.7774, 300, 1500),
('鶯谷駅', '鶯谷駅周辺の情報交換', 'station', 35.7208, 139.7786, 300, 1500),
('日暮里駅', '日暮里駅周辺の情報交換', 'station', 35.7277, 139.7710, 300, 1500),
('西日暮里駅', '西日暮里駅周辺の情報交換', 'station', 35.7323, 139.7663, 300, 1500),
('田端駅', '田端駅周辺の情報交換', 'station', 35.7378, 139.7607, 300, 1500),
('駒込駅', '駒込駅周辺の情報交換', 'station', 35.7364, 139.7468, 300, 1500),
('巣鴨駅', '巣鴨駅周辺の情報交換', 'station', 35.7334, 139.7391, 300, 1500),
('大塚駅', '大塚駅周辺の情報交換', 'station', 35.7316, 139.7289, 300, 1500),
('池袋駅', '池袋駅周辺の情報交換', 'station', 35.7295, 139.7109, 300, 1500),
('目白駅', '目白駅周辺の情報交換', 'station', 35.7219, 139.7062, 300, 1500),
('高田馬場駅', '高田馬場駅周辺の情報交換', 'station', 35.7127, 139.7038, 300, 1500),
('新大久保駅', '新大久保駅周辺の情報交換', 'station', 35.7008, 139.7003, 300, 1500),
('新宿駅', '新宿駅周辺の情報交換', 'station', 35.6896, 139.7006, 300, 1500),
('代々木駅', '代々木駅周辺の情報交換', 'station', 35.6837, 139.7020, 300, 1500),
('原宿駅', '原宿駅周辺の情報交換', 'station', 35.6702, 139.7026, 300, 1500),
('渋谷駅', '渋谷駅周辺の情報交換', 'station', 35.6580, 139.7016, 300, 1500),
('恵比寿駅', '恵比寿駅周辺の情報交換', 'station', 35.6465, 139.7100, 300, 1500),
('目黒駅', '目黒駅周辺の情報交換', 'station', 35.6333, 139.7156, 300, 1500),
('五反田駅', '五反田駅周辺の情報交換', 'station', 35.6258, 139.7238, 300, 1500),
('大崎駅', '大崎駅周辺の情報交換', 'station', 35.6197, 139.7286, 300, 1500),
('品川駅', '品川駅周辺の情報交換', 'station', 35.6284, 139.7387, 300, 1500),
('高輪ゲートウェイ駅', '高輪ゲートウェイ駅周辺の情報交換', 'station', 35.6355, 139.7407, 300, 1500),
('田町駅', '田町駅周辺の情報交換', 'station', 35.6456, 139.7477, 300, 1500),
('浜松町駅', '浜松町駅周辺の情報交換', 'station', 35.6555, 139.7572, 300, 1500),
('新橋駅', '新橋駅周辺の情報交換', 'station', 35.6657, 139.7584, 300, 1500),
('有楽町駅', '有楽町駅周辺の情報交換', 'station', 35.6751, 139.7631, 300, 1500);

-- Insert test boards for Tokyo wards
INSERT INTO boards (name, description, type, latitude, longitude, access_radius, view_radius) VALUES
-- Tokyo Ward Boards
('千代田区', '千代田区の地域情報交換', 'ward', 35.6941, 139.7536, 300, 1500),
('中央区', '中央区の地域情報交換', 'ward', 35.6704, 139.7704, 300, 1500),
('港区', '港区の地域情報交換', 'ward', 35.6584, 139.7519, 300, 1500),
('新宿区', '新宿区の地域情報交換', 'ward', 35.6938, 139.7034, 300, 1500),
('文京区', '文京区の地域情報交換', 'ward', 35.7081, 139.7516, 300, 1500),
('台東区', '台東区の地域情報交換', 'ward', 35.7068, 139.7799, 300, 1500),
('墨田区', '墨田区の地域情報交換', 'ward', 35.7061, 139.8001, 300, 1500),
('江東区', '江東区の地域情報交換', 'ward', 35.6732, 139.8171, 300, 1500),
('品川区', '品川区の地域情報交換', 'ward', 35.6092, 139.7301, 300, 1500),
('目黒区', '目黒区の地域情報交換', 'ward', 35.6333, 139.6983, 300, 1500),
('大田区', '大田区の地域情報交換', 'ward', 35.5617, 139.7160, 300, 1500),
('世田谷区', '世田谷区の地域情報交換', 'ward', 35.6464, 139.6536, 300, 1500),
('渋谷区', '渋谷区の地域情報交換', 'ward', 35.6633, 139.6986, 300, 1500),
('中野区', '中野区の地域情報交換', 'ward', 35.7090, 139.6649, 300, 1500),
('杉並区', '杉並区の地域情報交換', 'ward', 35.6995, 139.6363, 300, 1500),
('豊島区', '豊島区の地域情報交換', 'ward', 35.7298, 139.7147, 300, 1500),
('北区', '北区の地域情報交換', 'ward', 35.7531, 139.7371, 300, 1500),
('荒川区', '荒川区の地域情報交換', 'ward', 35.7363, 139.7830, 300, 1500),
('板橋区', '板橋区の地域情報交換', 'ward', 35.7516, 139.7144, 300, 1500),
('練馬区', '練馬区の地域情報交換', 'ward', 35.7375, 139.6531, 300, 1500),
('足立区', '足立区の地域情報交換', 'ward', 35.7750, 139.8048, 300, 1500),
('葛飾区', '葛飾区の地域情報交換', 'ward', 35.7437, 139.8482, 300, 1500),
('江戸川区', '江戸川区の地域情報交換', 'ward', 35.7068, 139.8683, 300, 1500);

-- Insert some popular park boards
INSERT INTO boards (name, description, type, latitude, longitude, access_radius, view_radius) VALUES
('上野公園', '上野公園での情報交換', 'park', 35.7141, 139.7734, 300, 1500),
('代々木公園', '代々木公園での情報交換', 'park', 35.6719, 139.6961, 300, 1500),
('新宿御苑', '新宿御苑での情報交換', 'park', 35.6851, 139.7107, 300, 1500),
('井の頭恩賜公園', '井の頭公園での情報交換', 'park', 35.7004, 139.5706, 300, 1500),
('皇居東御苑', '皇居東御苑での情報交換', 'park', 35.6854, 139.7571, 300, 1500),
('浜離宮恩賜庭園', '浜離宮での情報交換', 'park', 35.6596, 139.7636, 300, 1500),
('芝公園', '芝公園での情報交換', 'park', 35.6572, 139.7487, 300, 1500),
('日比谷公園', '日比谷公園での情報交換', 'park', 35.6742, 139.7595, 300, 1500);

-- Insert some sample global threads (accessible from anywhere)
INSERT INTO threads (board_id, title, content, author_name, is_global, latitude, longitude) VALUES
((SELECT id FROM boards WHERE name = '東京駅' LIMIT 1), 'Welcome to stabo.dev!', 'このアプリについて質問や提案があればこちらでどうぞ！', 'System', true, 35.6812, 139.7671),
((SELECT id FROM boards WHERE name = '渋谷駅' LIMIT 1), '渋谷のおすすめカフェ情報', '渋谷でおすすめのカフェを教えてください。作業しやすい場所を探しています。', 'CafeSeeker', false, 35.6580, 139.7016),
((SELECT id FROM boards WHERE name = '新宿駅' LIMIT 1), '新宿駅の乗り換え情報', '新宿駅での効率的な乗り換えルートを共有しましょう！', 'TrainMaster', false, 35.6896, 139.7006);

-- Insert some sample posts for the threads
INSERT INTO posts (thread_id, author_name, content, latitude, longitude) VALUES
((SELECT id FROM threads WHERE title = 'Welcome to stabo.dev!' LIMIT 1), 'Developer', 'アプリの使い方で困ったことがあれば、遠慮なく質問してください。', 35.6812, 139.7671),
((SELECT id FROM threads WHERE title = '渋谷のおすすめカフェ情報' LIMIT 1), 'LocalGuide', 'スターバックス渋谷スカイビル店は景色が良くておすすめです！', 35.6580, 139.7016),
((SELECT id FROM threads WHERE title = '新宿駅の乗り換え情報' LIMIT 1), 'Commuter', 'JRから小田急への乗り換えは南口が一番近いですよ。', 35.6896, 139.7006);

-- Update thread post counts
UPDATE threads SET post_count = (
  SELECT COUNT(*) FROM posts WHERE posts.thread_id = threads.id
);

-- Note: User data will be inserted when users actually sign up through the application
-- The admin user (admin@example.com) will need to be created through the normal signup process
-- and then their user record can be updated to have admin privileges if needed