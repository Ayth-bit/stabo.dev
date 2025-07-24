# データベース操作コマンド

ローカル開発環境でのデータベース操作を効率化するコマンド集です。

## 🚀 クイックスタート

```bash
# ヘルプ表示
make help

# データベースシェル接続
make db-shell

# 基本的なデータ確認
make db-users
make db-threads
make db-boards
```

## 📊 基本的なデータベース操作

### 1. Makefileコマンド

```bash
# データベース状態確認
make db-status

# 全テーブル一覧
make db-tables

# ユーザー一覧表示
make db-users

# スレッド一覧表示
make db-threads

# 掲示板一覧表示
make db-boards

# 最近のアクティビティ
make db-recent
```

### 2. npmスクリプト

```bash
# データベースシェル
npm run db:shell

# 基本状態確認
npm run db:status

# テーブル一覧
npm run db:tables

# ユーザー一覧
npm run db:users

# スレッド一覧
npm run db:threads
```

### 3. ヘルパースクリプト

```bash
# ヘルプ表示
./scripts/db-helpers.sh

# ユーザー詳細（IDまたはメールで検索）
./scripts/db-helpers.sh show_user "test@example.com"
./scripts/db-helpers.sh show_user "123e4567-e89b-12d3-a456-426614174000"

# スレッド詳細
./scripts/db-helpers.sh show_thread "thread_id_here"

# 掲示板統計情報
./scripts/db-helpers.sh board_stats

# アクティブユーザー（過去24時間）
./scripts/db-helpers.sh active_users

# データベースサイズ情報
./scripts/db-helpers.sh db_size

# 位置情報付きスレッド
./scripts/db-helpers.sh threads_with_location

# テストデータ作成
./scripts/db-helpers.sh create_test_data
```

## 🔧 カスタムクエリ

```bash
# カスタムSQL実行
make db-query QUERY="SELECT * FROM threads WHERE title LIKE '%テスト%';"

# テーブル構造確認
make db-describe TABLE=threads
make db-describe TABLE=users_extended
```

## 📝 よく使うSQLクエリ例

### ユーザー情報確認
```sql
-- 全ユーザー一覧（認証情報付き）
SELECT 
    ue.id,
    ue.display_name,
    au.email,
    ue.points,
    ue.created_at
FROM users_extended ue
JOIN auth.users au ON ue.id = au.id
ORDER BY ue.created_at DESC;
```

### スレッド情報確認
```sql
-- アクティブなスレッド一覧
SELECT 
    t.title,
    t.author_name,
    b.name as board_name,
    t.is_archived,
    t.expires_at,
    t.created_at
FROM threads t
LEFT JOIN boards b ON t.board_id = b.id
WHERE t.is_archived = false
ORDER BY t.created_at DESC;
```

### 掲示板統計
```sql
-- 掲示板別スレッド数
SELECT 
    b.name,
    b.type,
    COUNT(t.id) as thread_count,
    COUNT(CASE WHEN t.is_archived = false THEN 1 END) as active_threads
FROM boards b
LEFT JOIN threads t ON b.id = t.board_id
GROUP BY b.id, b.name, b.type
ORDER BY thread_count DESC;
```

## 🛠 開発環境管理

```bash
# Supabase環境管理
make supabase-status    # 状態確認
make supabase-start     # 開始
make supabase-stop      # 停止
make supabase-reset     # リセット

# 開発サーバー
make dev               # Next.js単体起動
make dev-all          # Supabase + Next.js同時起動

# メンテナンス
make clean            # ビルドファイル削除
make setup            # 初回環境構築
make reset-all        # 完全リセット
```

## 🚨 トラブルシューティング

### PostgreSQL接続エラー
```bash
# Supabaseが起動しているか確認
make supabase-status

# 手動でSupabase起動
make supabase-start
```

### テーブルが見つからない
```bash
# マイグレーション状態確認
supabase migration list

# データベースリセット
make supabase-reset
```

### 権限エラー
```bash
# RLSポリシー確認
make db-query QUERY="SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

## 💡 Tips

1. **PostgreSQLシェルでの便利なコマンド**:
   - `\dt` - テーブル一覧
   - `\d table_name` - テーブル構造
   - `\q` - 終了
   - `\h` - SQLヘルプ

2. **よく使うフィルタリング**:
   ```sql
   -- 今日作成されたスレッド
   WHERE created_at >= CURRENT_DATE
   
   -- 過去24時間のアクティビティ
   WHERE created_at > NOW() - INTERVAL '24 hours'
   
   -- 特定の掲示板のスレッド
   WHERE board_id = 'your_board_id'
   ```

3. **JSON形式でのデータ出力**:
   ```bash
   psql $DB_URL -c "SELECT row_to_json(t) FROM (SELECT * FROM threads LIMIT 5) t;"
   ```