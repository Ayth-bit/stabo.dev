# Stabo.dev ファイル構成一覧

## プロジェクト概要
位置ベースのスレッド投稿プラットフォーム「Stabo.dev」のファイル構成と各ファイルの機能説明

## 技術スタック
- **フレームワーク**: Next.js 15.3.3 (App Router)
- **フロントエンド**: React 19, TypeScript
- **スタイリング**: Tailwind CSS v4
- **バックエンド**: Supabase (PostgreSQL + Edge Functions)
- **リンター**: Biome
- **地図**: Google Maps API & Leaflet

---

## ファイル構成と機能説明

### ルートディレクトリ
- **Makefile** - ビルド・デプロイタスクの自動化
- **README.md** - プロジェクト概要・セットアップ手順
- **package.json** - 依存関係・スクリプト定義（Biome、Next.js、Supabase等）
- **package-lock.json** - 依存関係のロック
- **next.config.ts** - Next.js設定ファイル
- **tsconfig.json** - TypeScript設定
- **tsconfig.tsbuildinfo** - TypeScriptビルドキャッシュ
- **eslint.config.mjs** - ESLint設定
- **biome.json** - Biome（リンター・フォーマッター）設定
- **postcss.config.mjs** - PostCSS設定（Tailwind CSS用）
- **next-env.d.ts** - Next.js TypeScript定義

### app/ - Next.js App Router構造

#### ページディレクトリ
- **app/layout.tsx** - ルートレイアウト（フォント設定、テーマプロバイダー、認証、ナビゲーション）
- **app/page.tsx** - ホームページ（位置情報取得、スレッド検索、Google Maps統合）
- **app/globals.css** - グローバルスタイル（Tailwind CSS、テーマシステム、4つのテーマ定義）
- **app/favicon.ico** - サイトアイコン

#### 認証関連
- **app/auth/login/page.tsx** - ログインページ
- **app/auth/register/page.tsx** - ユーザー登録ページ
- **app/auth/reset-password/page.tsx** - パスワードリセット
- **app/auth/update-password/page.tsx** - パスワード更新
- **app/login/page.tsx** - 追加ログインページ

#### スレッド・ボード機能
- **app/boards/page.tsx** - ボード一覧ページ
- **app/boards/[id]/page.tsx** - 個別ボードページ
- **app/boards/[id]/create/page.tsx** - ボード内スレッド作成
- **app/thread/[id]/page.tsx** - 個別スレッド表示・投稿機能
- **app/create-thread/layout.tsx** - スレッド作成レイアウト
- **app/create-thread/page.tsx** - スレッド作成フォーム

#### 管理機能
- **app/admin/page.tsx** - 管理画面メイン
- **app/admin-setup/page.tsx** - 管理者初期設定
- **app/admin-login-page/page.tsx** - 管理者専用ログイン

#### その他ページ
- **app/home/page.tsx** - ホーム機能（重複？）
- **app/map/[boardId]/page.tsx** - ボード地図表示
- **app/mypage/page.tsx** - ユーザーマイページ

#### API Routes
- **app/api/boards/route.ts** - ボード一覧API
- **app/api/boards/data.ts** - ボードデータ操作
- **app/api/boards/integrated/route.ts** - 統合ボードAPI
- **app/api/boards/[id]/route.ts** - 個別ボードAPI
- **app/api/boards/[id]/threads/route.ts** - ボード内スレッドAPI
- **app/api/threads/lifecycle/route.ts** - スレッドライフサイクル管理
- **app/api/admin/setup/route.ts** - 管理者セットアップAPI
- **app/api/admin/map-data/route.ts** - 管理者用地図データAPI
- **app/api/cron/archive-expired-threads/route.ts** - スレッド自動アーカイブ

### コンポーネント・機能層

#### Reactコンポーネント (components/)
- **ThemeSwitcher.tsx** - テーマ切り替えUI（4テーマ対応）
- **Navigation.tsx** - サイトナビゲーション
- **AuthProvider.tsx** - 認証状態管理プロバイダー
- **AuthLayout.tsx** - 認証レイアウトコンポーネント
- **LocationGuard.tsx** - 位置情報アクセス制御
- **AdminMapView.tsx** - 管理者用地図コンポーネント
- **BaseRegistration.tsx** - ユーザー登録基本コンポーネント
- **DirectMessages.tsx** - ダイレクトメッセージ機能
- **FriendsManager.tsx** - フレンド管理機能
- **ThreadLifecycleManager.tsx** - スレッドライフサイクル管理UI
- **UserPosts.tsx** - ユーザー投稿表示

#### コンテキスト (contexts/)
- **ThemeContext.tsx** - テーマ状態管理（4テーマ：classic/modern-chic/y2k-web/harajuku-pop）

#### アプリケーション層 (app/)
- **app/repositories/interfaces.ts** - リポジトリインターフェース定義
- **app/repositories/SupabaseUserRepository.ts** - ユーザーリポジトリ
- **app/repositories/supabase/SupabaseBoardRepository.ts** - ボードデータ操作
- **app/repositories/supabase/SupabaseBoardThreadRepository.ts** - スレッドデータ操作
- **app/repositories/supabase/SupabaseChatRepository.ts** - チャット機能
- **app/repositories/supabase/SupabaseUserRepository.ts** - ユーザーデータ操作

#### ユースケース (app/usecases/)
- **GachaUsecase.ts** - ガチャ機能ビジネスロジック
- **LocationUsecase.ts** - 位置情報処理ロジック
- **ThreadLifecycleUsecase.ts** - スレッドライフサイクル管理
- **UserUsecase.ts** - ユーザー関連ビジネスロジック

#### 型定義 (app/types/)
- **domain.ts** - ドメインモデル型定義

### ライブラリ・ユーティリティ

#### lib/
- **supabase.ts** - Supabaseクライアント設定（認証・サービスロール設定）

#### utils/
- **locationCheck.ts** - 位置情報検証ユーティリティ

### Supabase関連

#### Edge Functions (supabase/functions/)
- **handle-location/index.ts** - メイン位置処理ロジック
- **handle-location/deno.json** - Deno設定
- **handle-location/tsconfig.json** - TypeScript設定
- **get-distant-threads/index.ts** - 遠方スレッド取得
- **get-distant-threads/deno.json** - Deno設定
- **get-global-threads/index.ts** - グローバルスレッド取得
- **get-global-threads/deno.json** - Deno設定
- **get-readonly-threads/index.ts** - 読み取り専用スレッド取得
- **get-readonly-threads/deno.json** - Deno設定
- **location_functions.sql** - 位置計算SQL関数

#### データベース
- **supabase/config.toml** - Supabaseローカル開発設定
- **supabase/seed.sql** - 初期データ
- **database/schema.sql** - データベーススキーマ定義
- **database/master-data.sql** - マスターデータ

#### マイグレーション (supabase/migrations/)
- **20250724000000_initial_schema.sql** - 初期スキーマ作成（全テーブル・RLS・インデックス）
- **20250724000001_create_admin_user.sql** - 管理者ユーザー作成・管理機能
- **20250724000002_add_connections_and_chats.sql** - 接続・チャット機能追加
- **20250724000003_fix_users_extended_rls.sql** - ユーザー拡張RLS修正
- **20250724000004_add_base_radius.sql** - 基準半径追加

### 静的アセット・スクリプト

#### public/
- **file.svg** - ファイルアイコン
- **globe.svg** - グローブアイコン
- **window.svg** - ウィンドウアイコン

#### scripts/
- **db-helpers.sh** - データベース操作ヘルパースクリプト

#### docs/
- **DATABASE_COMMANDS.md** - データベースコマンド一覧

---

## 主要機能の実装パターン

### 1. 位置ベース機能
- **位置取得**: `app/page.tsx` でブラウザGeolocation API
- **距離計算**: Edge Functionsでヒュベニの公式
- **アクセス制御**: 1km半径制限（`locationCheck.ts`）

### 2. テーマシステム
- **4テーマ**: classic/modern-chic/y2k-web/harajuku-pop
- **CSS変数**: `globals.css`で`data-theme`属性ベース
- **状態管理**: `ThemeContext.tsx`でReact Context
- **永続化**: localStorage保存

### 3. リアルタイム機能
- **Supabase Realtime**: スレッド・投稿のライブ更新
- **Edge Functions**: 位置・距離計算の分散処理

### 4. 認証・セキュリティ
- **Supabase Auth**: PKCEフロー
- **RLS**: Row Level Security
- **位置認証**: 読み書き両方で位置チェック

このファイル構成により、スケーラブルで保守性の高い位置ベースソーシャルプラットフォームが実現されています。