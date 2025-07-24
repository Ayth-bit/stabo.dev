# stabo.dev Development Makefile
# ローカル開発環境用のコマンドショートカット

# 色付きの出力用
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# デフォルトのデータベース接続情報
DB_URL := postgresql://postgres:postgres@127.0.0.1:54322/postgres

.PHONY: help db-* supabase-* dev-*

# デフォルトターゲット
help:
	@echo "$(GREEN)stabo.dev 開発環境コマンド$(NC)"
	@echo ""
	@echo "$(YELLOW)📊 データベース操作:$(NC)"
	@echo "  make db-shell          - PostgreSQLシェルに接続"
	@echo "  make db-status         - データベースの状態確認"
	@echo "  make db-tables         - 全テーブル一覧表示"
	@echo "  make db-users          - ユーザー一覧表示"
	@echo "  make db-threads        - スレッド一覧表示"
	@echo "  make db-boards         - 掲示板一覧表示"
	@echo "  make db-recent         - 最近のアクティビティ"
	@echo ""
	@echo "$(YELLOW)🔧 Supabase操作:$(NC)"
	@echo "  make supabase-status   - Supabaseローカル環境の状態"
	@echo "  make supabase-start    - Supabaseローカル環境開始"
	@echo "  make supabase-stop     - Supabaseローカル環境停止"
	@echo "  make supabase-reset    - データベースリセット"
	@echo "  make supabase-logs     - Supabaseログ表示"
	@echo ""
	@echo "$(YELLOW)🚀 開発サーバー:$(NC)"
	@echo "  make dev               - Next.js開発サーバー起動"
	@echo "  make dev-all           - Supabase + Next.js同時起動"
	@echo "  make build             - プロダクションビルド"
	@echo "  make lint              - ESLintチェック"
	@echo ""
	@echo "$(YELLOW)🧹 メンテナンス:$(NC)"
	@echo "  make clean             - ビルドファイル削除"
	@echo "  make install           - 依存関係インストール"
	@echo ""

# =============================================================================
# データベース操作
# =============================================================================

db-shell:
	@echo "$(GREEN)PostgreSQLシェルに接続中...$(NC)"
	@echo "終了するには \\q を入力してください"
	@psql $(DB_URL)

db-status:
	@echo "$(GREEN)データベースステータス確認中...$(NC)"
	@psql $(DB_URL) -c "SELECT current_database(), current_user, version();"
	@psql $(DB_URL) -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

db-tables:
	@echo "$(GREEN)全テーブル一覧:$(NC)"
	@psql $(DB_URL) -c "\\dt"

db-users:
	@echo "$(GREEN)ユーザー一覧 (users_extended):$(NC)"
	@psql $(DB_URL) -c "SELECT ue.id, ue.display_name, au.email, ue.created_at FROM users_extended ue JOIN auth.users au ON ue.id = au.id ORDER BY ue.created_at DESC LIMIT 10;"

db-threads:
	@echo "$(GREEN)スレッド一覧:$(NC)"
	@psql $(DB_URL) -c "SELECT t.id, t.title, t.author_name, b.name as board_name, t.is_archived, t.created_at FROM threads t LEFT JOIN boards b ON t.board_id = b.id ORDER BY t.created_at DESC LIMIT 10;"

db-boards:
	@echo "$(GREEN)掲示板一覧:$(NC)"
	@psql $(DB_URL) -c "SELECT id, name, type, latitude, longitude, access_radius, created_at FROM boards ORDER BY created_at DESC;"

db-recent:
	@echo "$(GREEN)最近のアクティビティ:$(NC)"
	@echo "$(YELLOW)最新スレッド:$(NC)"
	@psql $(DB_URL) -c "SELECT title, author_name, created_at FROM threads ORDER BY created_at DESC LIMIT 5;"
	@echo "$(YELLOW)最新ユーザー:$(NC)"
	@psql $(DB_URL) -c "SELECT display_name, created_at FROM users_extended ORDER BY created_at DESC LIMIT 5;"

# カスタムクエリ用のターゲット
db-query:
	@echo "$(GREEN)カスタムクエリ実行:$(NC)"
	@echo "使用例: make db-query QUERY=\"SELECT * FROM threads LIMIT 5;\""
	@if [ -z "$(QUERY)" ]; then \
		echo "$(RED)エラー: QUERYパラメータを指定してください$(NC)"; \
		echo "例: make db-query QUERY=\"SELECT * FROM users_extended LIMIT 5;\""; \
	else \
		psql $(DB_URL) -c "$(QUERY)"; \
	fi

# テーブル詳細表示
db-describe:
	@echo "$(GREEN)テーブル構造表示:$(NC)"
	@echo "使用例: make db-describe TABLE=threads"
	@if [ -z "$(TABLE)" ]; then \
		echo "$(RED)エラー: TABLEパラメータを指定してください$(NC)"; \
		echo "例: make db-describe TABLE=threads"; \
	else \
		psql $(DB_URL) -c "\\d $(TABLE)"; \
	fi

# =============================================================================
# Supabase操作
# =============================================================================

supabase-status:
	@echo "$(GREEN)Supabaseローカル環境の状態:$(NC)"
	@supabase status

supabase-start:
	@echo "$(GREEN)Supabaseローカル環境を開始中...$(NC)"
	@supabase start

supabase-stop:
	@echo "$(GREEN)Supabaseローカル環境を停止中...$(NC)"
	@supabase stop

supabase-reset:
	@echo "$(RED)⚠️  データベースをリセットします。続行しますか? [y/N]$(NC)"
	@read -r REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		echo "$(GREEN)データベースリセット中...$(NC)"; \
		supabase db reset; \
	else \
		echo "キャンセルしました"; \
	fi

supabase-logs:
	@echo "$(GREEN)Supabaseログを表示中...$(NC)"
	@supabase logs

# =============================================================================
# 開発サーバー
# =============================================================================

dev:
	@echo "$(GREEN)Next.js開発サーバーを起動中...$(NC)"
	@npm run dev

dev-all:
	@echo "$(GREEN)Supabase + Next.js を同時起動中...$(NC)"
	@echo "$(YELLOW)注意: Supabaseが既に起動している場合はスキップされます$(NC)"
	@supabase start || true
	@sleep 2
	@npm run dev

build:
	@echo "$(GREEN)プロダクションビルド中...$(NC)"
	@npm run build

lint:
	@echo "$(GREEN)ESLintチェック実行中...$(NC)"
	@npm run lint

# =============================================================================
# メンテナンス
# =============================================================================

clean:
	@echo "$(GREEN)ビルドファイルをクリーンアップ中...$(NC)"
	@rm -rf .next
	@rm -rf out
	@rm -rf dist
	@echo "$(GREEN)クリーンアップ完了$(NC)"

install:
	@echo "$(GREEN)依存関係をインストール中...$(NC)"
	@npm install

# =============================================================================
# 便利なワンライナー
# =============================================================================

# 開発環境の完全セットアップ
setup:
	@echo "$(GREEN)開発環境をセットアップ中...$(NC)"
	@npm install
	@supabase start
	@echo "$(GREEN)セットアップ完了! 'make dev' で開発サーバーを起動してください$(NC)"

# 開発環境の完全リセット
reset-all:
	@echo "$(RED)⚠️  開発環境を完全リセットします。続行しますか? [y/N]$(NC)"
	@read -r REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		echo "$(GREEN)完全リセット中...$(NC)"; \
		supabase stop || true; \
		make clean; \
		supabase start; \
		npm install; \
		echo "$(GREEN)リセット完了!$(NC)"; \
	else \
		echo "キャンセルしました"; \
	fi

# 開発者向けクイックチェック
check:
	@echo "$(GREEN)開発環境チェック中...$(NC)"
	@echo "$(YELLOW)Node.js:$(NC)"
	@node --version || echo "$(RED)Node.js not found$(NC)"
	@echo "$(YELLOW)npm:$(NC)"
	@npm --version || echo "$(RED)npm not found$(NC)"
	@echo "$(YELLOW)Supabase CLI:$(NC)"
	@supabase --version || echo "$(RED)Supabase CLI not found$(NC)"
	@echo "$(YELLOW)PostgreSQL:$(NC)"
	@psql --version || echo "$(RED)PostgreSQL not found$(NC)"
	@echo "$(GREEN)チェック完了$(NC)"