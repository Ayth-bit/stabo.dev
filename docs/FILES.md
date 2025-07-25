# ファイル構成

## プロジェクト概要
位置情報ベース掲示板アプリケーション「Appcadia」のファイル構成

## ディレクトリ構造

### `/app` - Next.js App Router
- **`/api`** - APIエンドポイント
  - `/admin/` - 管理者機能API
    - `map-data/route.ts` - 地図データ取得
    - `setup/route.ts` - 初期設定
  - `/boards/` - 掲示板関連API
    - `[id]/route.ts` - 個別掲示板取得
    - `[id]/threads/route.ts` - 掲示板のスレッド操作
    - `data.ts` - 掲示板データ取得ヘルパー
    - `integrated/route.ts` - 統合掲示板データ
    - `route.ts` - 掲示板一覧
  - `/cron/` - バッチ処理
    - `archive-expired-threads/route.ts` - 期限切れスレッドアーカイブ
  - `/threads/` - スレッド関連API
    - `[id]/restore/route.ts` - スレッド復元
    - `[id]/route.ts` - 個別スレッド取得
    - `create/route.ts` - スレッド作成
    - `lifecycle/route.ts` - スレッドライフサイクル管理
  - `/users/` - ユーザー関連API
    - `[id]/threads/route.ts` - ユーザーのスレッド一覧

- **`/auth`** - 認証関連ページ
  - `login/page.tsx` - ログインページ
  - `register/page.tsx` - 登録ページ
  - `reset-password/page.tsx` - パスワードリセット
  - `update-password/page.tsx` - パスワード更新

- **`/boards`** - 掲示板ページ
  - `[id]/create/page.tsx` - スレッド作成
  - `[id]/page.tsx` - 掲示板詳細
  - `page.tsx` - 掲示板一覧

- **その他のページ**
  - `admin/page.tsx` - 管理者ページ
  - `admin-login-page/page.tsx` - 管理者ログイン
  - `admin-setup/page.tsx` - 管理者セットアップ
  - `create-thread/page.tsx` - スレッド作成（汎用）
  - `home/page.tsx` - ホームページ
  - `map/[boardId]/page.tsx` - 地図表示
  - `mypage/page.tsx` - マイページ
  - `thread/[id]/page.tsx` - スレッド詳細
  - `page.tsx` - トップページ

### `/components` - Reactコンポーネント
- `AdminMapView.tsx` - 管理者地図ビュー
- `AuthLayout.tsx` - 認証レイアウト
- `AuthProvider.tsx` - 認証プロバイダー
- `BaseRegistration.tsx` - 拠点登録
- `DirectMessages.tsx` - ダイレクトメッセージ
- `FriendsManager.tsx` - 友達管理
- `LocationGuard.tsx` - 位置情報ガード
- `Navigation.tsx` - ナビゲーション
- `ThemeSwitcher.tsx` - テーマ切り替え
- `ThreadLifecycleManager.tsx` - スレッドライフサイクル管理
- `UserPosts.tsx` - ユーザー投稿管理

### `/lib` - ライブラリとユーティリティ
- `supabase.ts` - Supabaseクライアント設定
- `supabase-admin.ts` - Supabase管理者クライアント

### `/contexts` - Reactコンテキスト
- `ThemeContext.tsx` - テーマコンテキスト

### `/utils` - ユーティリティ関数
- `locationCheck.ts` - 位置情報チェック

### `/app/repositories` - リポジトリパターン
- `interfaces.ts` - インターフェース定義
- `SupabaseUserRepository.ts` - ユーザーリポジトリ
- `/supabase/` - Supabaseリポジトリ実装
  - `SupabaseBoardRepository.ts`
  - `SupabaseBoardThreadRepository.ts`
  - `SupabaseChatRepository.ts`
  - `SupabaseUserRepository.ts`

### `/app/usecases` - ユースケース層
- `GachaUsecase.ts` - ガチャ機能
- `LocationUsecase.ts` - 位置情報処理
- `ThreadLifecycleUsecase.ts` - スレッドライフサイクル
- `UserUsecase.ts` - ユーザー操作

### `/app/types` - 型定義
- `domain.ts` - ドメイン型定義

### `/supabase` - Supabase設定
- `config.toml` - Supabase設定
- `/functions/` - エッジ関数
  - `get-distant-threads/` - 遠距離スレッド取得
  - `get-global-threads/` - グローバルスレッド取得
  - `get-readonly-threads/` - 読み取り専用スレッド取得
  - `handle-location/` - 位置情報処理
  - `location_functions.sql` - 位置情報関数
- `/migrations/` - データベースマイグレーション
  - `20250724000000_initial_schema.sql` - 初期スキーマ
  - `20250724000001_create_admin_user.sql` - 管理者ユーザー作成
  - `20250724000002_add_connections_and_chats.sql` - 接続とチャット機能
  - `20250724000003_fix_users_extended_rls.sql` - RLS修正
  - `20250724000004_add_base_radius.sql` - 拠点半径追加
- `seed.sql` - 初期データ

### `/scripts` - スクリプト
- `db-helpers.sh` - データベースヘルパー
- `db-setup.js` - データベースセットアップ
- `test-db.js` - データベーステスト

### `/docs` - ドキュメント
- `FILES.md` - このファイル
- `TABLES_STATUS.md` - テーブル状態

## 設定ファイル
- `next.config.ts` - Next.js設定
- `tailwind.config.js` - Tailwind CSS設定
- `tsconfig.json` - TypeScript設定
- `biome.json` - Biome設定
- `eslint.config.mjs` - ESLint設定
- `postcss.config.mjs` - PostCSS設定
- `package.json` - パッケージ設定
- `.env.local` - 環境変数（ローカル）

## 主要機能

### 認証・ユーザー管理
- Supabase Auth による認証
- ユーザー登録・ログイン・パスワードリセット
- マイページでのプロフィール管理

### 掲示板機能
- 位置情報ベース掲示板
- スレッド作成・投稿
- 期限切れスレッドの復元機能
- 匿名投稿対応

### 位置情報機能
- 地図表示（Leaflet）
- 位置ベースの投稿制限
- 拠点登録機能

### チャット機能
- ダイレクトメッセージ
- リアルタイム通信
- 友達管理

### 管理者機能
- 管理者ダッシュボード
- システム設定
- データ管理

## 技術スタック
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **UI**: Tailwind CSS
- **Maps**: Leaflet
- **Linting**: Biome
- **Development**: Turbopack