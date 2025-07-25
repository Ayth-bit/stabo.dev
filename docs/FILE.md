# Stabo.dev ファイル構成一覧

## プロジェクト概要
東京23区内の住民・滞在者向け位置情報活用掲示板システム「Stabo.dev」のファイル構成と各ファイルの機能説明

## アプリの目的
東京23区内の住民・滞在者が、位置情報を活用して周囲の掲示板機能・友達管理・リアルタイムチャット機能を通じて情報交換・交流できるサービス

## 全体仕様
- **東京23区エリア外ではアプリを利用できない**
- **掲示板の閲覧・投稿範囲:**
  - **閲覧**: 半径1.5km以内にある掲示板を表示（最大3件）
  - **投稿**: 対象掲示板の中心から300m以内で可能
- **友達管理**: QRコード交換による双方向友達登録
- **チャット機能**: 友達同士のリアルタイムメッセージング

## 技術スタック
- **フレームワーク**: Next.js 15.3.3 (App Router)
- **フロントエンド**: React 19, TypeScript
- **スタイリング**: Tailwind CSS v4 + Material Design 3.0
- **バックエンド**: Supabase (PostgreSQL + Edge Functions + Realtime)
- **リンター**: Biome
- **地図**: Google Maps API & Leaflet
- **QRコード**: 外部API (qr-server.com)

---

## ファイル構成と機能説明

### ルートディレクトリ
- **Makefile** - ビルド・デプロイタスクの自動化
- **README.md** - プロジェクト概要・セットアップ手順
- **package.json** - 依存関係・スクリプト定義（Biome、Next.js、Supabase等）
- **package-lock.json** - 依存関係のロック
- **next.config.ts** - Next.js設定ファイル
- **tsconfig.json** - TypeScript設定
- **eslint.config.mjs** - ESLint設定
- **biome.json** - Biome（リンター・フォーマッター）設定
- **postcss.config.mjs** - PostCSS設定（Tailwind CSS用）

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
- **app/mypage/page.tsx** - ユーザーマイページ（拠点登録・友達管理・DM・投稿履歴）

#### API Routes
- **app/api/boards/route.ts** - ボード一覧API
- **app/api/boards/data.ts** - 掲示板データ（山手線全30駅・東京23区・都立公園）
- **app/api/boards/integrated/route.ts** - 統合ボードAPI（距離計算・最大3件制限）
- **app/api/boards/[id]/route.ts** - 個別ボードAPI
- **app/api/boards/[id]/threads/route.ts** - ボード内スレッドAPI
- **app/api/threads/lifecycle/route.ts** - スレッドライフサイクル管理
- **app/api/admin/setup/route.ts** - 管理者セットアップAPI
- **app/api/admin/map-data/route.ts** - 管理者用地図データAPI
- **app/api/cron/archive-expired-threads/route.ts** - スレッド自動アーカイブ

### コンポーネント・機能層

#### Reactコンポーネント (components/)
- **AdminMapView.tsx** - 管理者用地図表示コンポーネント（Google Maps連携）
- **AuthLayout.tsx** - 認証ページ共通レイアウト（ログイン・登録画面用）
- **AuthProvider.tsx** - 認証状態管理プロバイダー（Supabase Auth連携）
- **BaseRegistration.tsx** - 拠点登録機能（1つまで、東京23区内限定、地図選択UI）
- **DirectMessages.tsx** - リアルタイムチャット機能（Supabase Realtime、自動更新、既読管理）
- **FriendsManager.tsx** - 友達管理機能（QRコード生成・読取、双方向登録、友達削除）
- **LocationGuard.tsx** - 位置情報アクセス制御（東京23区内判定、開発環境フォールバック）
- **Navigation.tsx** - サイトナビゲーション（認証状態対応、テーマ切り替え）
- **ThemeSwitcher.tsx** - テーマ切り替えUI（4テーマ対応：classic/modern-chic/y2k-web/harajuku-pop）
- **ThreadLifecycleManager.tsx** - スレッドライフサイクル管理（72時間制限、復元機能、アーカイブ処理）
- **UserPosts.tsx** - ユーザー投稿履歴表示（1回限り復元機能、投稿統計）

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
- **db-helpers.sh** - データベース操作ヘルパースクリプト（バックアップ・復元）
- **db-setup.js** - リモートSupabaseセットアップスクリプト（テーブル確認・SQL生成）
- **test-db.js** - データベース接続・機能テストスクリプト（全テーブル確認）

#### docs/
- **FILE.md** - プロジェクトファイル構成一覧（このファイル）
- **TABLES_STATUS.md** - データベーステーブル状況整理（リモート・ローカル対応状況）

---

## 主要機能の実装パターン

### 1. 位置ベース機能
- **位置取得**: `app/page.tsx` でブラウザGeolocation API
- **距離計算**: Edge Functionsでヒュベニの公式
- **アクセス制御**: 東京23区内限定（`locationCheck.ts`）
- **掲示板表示**: 1.5km以内、最大3件表示
- **投稿範囲**: 各掲示板から300m以内

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