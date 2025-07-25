# データベーステーブル状況整理

## 現在のリモートSupabaseテーブル一覧
- `boards` ✅ (掲示板)
- `chat_messages` ✅ (チャットメッセージ)  
- `chats` ✅ (チャット会話)
- `connections` ✅ (友達関係)
- `direct_messages` ✅ (ダイレクトメッセージ)
- `posts` ✅ (投稿)
- `threads` ✅ (スレッド)
- `users_extended` ✅ (拡張ユーザー情報)

## SQLファイルの分類

### 1. 正式なマイグレーションファイル（ローカル開発用）
- `supabase/migrations/20250724000000_initial_schema.sql` - 初期スキーマ
- `supabase/migrations/20250724000001_create_admin_user.sql` - 管理者機能
- `supabase/migrations/20250724000002_add_connections_and_chats.sql` - 友達・チャット機能
- `supabase/migrations/20250724000003_fix_users_extended_rls.sql` - RLS修正
- `supabase/migrations/20250724000004_add_base_radius.sql` - 基準半径追加

### 2. 初期データファイル
- `supabase/seed.sql` - 初期データ（駅・区・公園データ）

### 3. リモートSupabase補完用（手動実行）
- `scripts/create-missing-tables.sql` - 不足テーブル作成（古い、削除対象）
- `scripts/db-setup.js` - テーブル状況確認・SQL生成スクリプト

### 4. ユーティリティ
- `scripts/test-db.js` - データベース接続テスト
- `scripts/db-helpers.sh` - データベース操作ヘルパー

## 現在の問題
- リモートSupabaseには必要なテーブルは作成済み
- しかし、chatsテーブルの構造に問題がある可能性（双方向メッセージが届かない）