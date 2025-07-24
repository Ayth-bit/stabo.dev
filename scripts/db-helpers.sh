#!/bin/bash
# データベースヘルパースクリプト
# よく使うSQLクエリのショートカット

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}$1${NC}"
}

echo_warn() {
    echo -e "${YELLOW}$1${NC}"
}

echo_error() {
    echo -e "${RED}$1${NC}"
}

# ユーザー詳細表示
show_user() {
    if [ -z "$1" ]; then
        echo_error "使用法: $0 show_user <user_id_or_email>"
        return 1
    fi
    
    echo_info "ユーザー詳細: $1"
    psql $DB_URL -c "
    SELECT 
        ue.id,
        ue.display_name,
        au.email,
        ue.points,
        ue.qr_code,
        ue.home_base_lat,
        ue.home_base_lng,
        ue.created_at
    FROM users_extended ue
    JOIN auth.users au ON ue.id = au.id
    WHERE ue.id = '$1' OR au.email = '$1';
    "
}

# スレッド詳細表示
show_thread() {
    if [ -z "$1" ]; then
        echo_error "使用法: $0 show_thread <thread_id>"
        return 1
    fi
    
    echo_info "スレッド詳細: $1"
    psql $DB_URL -c "
    SELECT 
        t.id,
        t.title,
        t.content,
        t.author_name,
        b.name as board_name,
        t.latitude,
        t.longitude,
        t.is_archived,
        t.expires_at,
        t.restore_count,
        t.created_at
    FROM threads t
    LEFT JOIN boards b ON t.board_id = b.id
    WHERE t.id = '$1';
    "
}

# 掲示板の統計情報
board_stats() {
    echo_info "掲示板統計情報"
    psql $DB_URL -c "
    SELECT 
        b.name,
        b.type,
        COUNT(t.id) as thread_count,
        COUNT(CASE WHEN t.is_archived = false THEN 1 END) as active_threads,
        AVG(t.post_count) as avg_post_count
    FROM boards b
    LEFT JOIN threads t ON b.id = t.board_id
    GROUP BY b.id, b.name, b.type
    ORDER BY thread_count DESC;
    "
}

# アクティブユーザー一覧
active_users() {
    echo_info "アクティブユーザー（過去24時間）"
    psql $DB_URL -c "
    SELECT 
        ue.display_name,
        au.email,
        COUNT(t.id) as threads_created,
        MAX(t.created_at) as last_activity
    FROM users_extended ue
    JOIN auth.users au ON ue.id = au.id
    LEFT JOIN threads t ON ue.id = t.author_id 
        AND t.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY ue.id, ue.display_name, au.email
    HAVING COUNT(t.id) > 0
    ORDER BY last_activity DESC;
    "
}

# データベースサイズ情報
db_size() {
    echo_info "データベースサイズ情報"
    psql $DB_URL -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_stat_get_tuples_returned(c.oid) as tuples
    FROM pg_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "
}

# 位置情報付きスレッド一覧
threads_with_location() {
    echo_info "位置情報付きスレッド一覧"
    psql $DB_URL -c "
    SELECT 
        t.title,
        t.author_name,
        b.name as board_name,
        ROUND(t.latitude::numeric, 6) as lat,
        ROUND(t.longitude::numeric, 6) as lng,
        t.created_at
    FROM threads t
    LEFT JOIN boards b ON t.board_id = b.id
    WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    ORDER BY t.created_at DESC
    LIMIT 10;
    "
}

# エラーログ調査
check_errors() {
    echo_info "最近のエラー確認"
    echo_warn "RLSポリシー違反:"
    psql $DB_URL -c "
    SELECT 
        schemaname,
        tablename,
        attname,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
    "
}

# テストデータ作成
create_test_data() {
    echo_warn "テストデータを作成しますか? [y/N]"
    read -r REPLY
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo_info "テストデータ作成中..."
        
        # テストユーザー作成
        psql $DB_URL -c "
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, confirmation_token, email_change, 
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'testuser@example.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{\"provider\":\"email\",\"providers\":[\"email\"]}',
            '{\"display_name\":\"テストユーザー\"}',
            now(),
            now(),
            '', '', '', ''
        ) ON CONFLICT (email) DO NOTHING;
        " > /dev/null
        
        echo_info "テストデータ作成完了"
    fi
}

# ヘルプ表示
show_help() {
    echo_info "データベースヘルパーコマンド:"
    echo "  $0 show_user <user_id_or_email>  - ユーザー詳細表示"
    echo "  $0 show_thread <thread_id>       - スレッド詳細表示"
    echo "  $0 board_stats                   - 掲示板統計"
    echo "  $0 active_users                  - アクティブユーザー"
    echo "  $0 db_size                       - DB容量情報"
    echo "  $0 threads_with_location         - 位置情報付きスレッド"
    echo "  $0 check_errors                  - エラー調査"
    echo "  $0 create_test_data              - テストデータ作成"
}

# メイン処理
case "$1" in
    show_user)
        show_user "$2"
        ;;
    show_thread)
        show_thread "$2"
        ;;
    board_stats)
        board_stats
        ;;
    active_users)
        active_users
        ;;
    db_size)
        db_size
        ;;
    threads_with_location)
        threads_with_location
        ;;
    check_errors)
        check_errors
        ;;
    create_test_data)
        create_test_data
        ;;
    *)
        show_help
        ;;
esac