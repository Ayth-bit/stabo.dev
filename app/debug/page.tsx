'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

const supabase = createClientComponentClient();

interface DBStatus {
  status: string;
  timestamp: string;
  supabase: {
    url: string;
    auth: {
      connected: boolean;
      error: string | null;
      user: string | null;
    };
    database: {
      users_extended: {
        accessible: boolean;
        error: string | null;
        count: number;
      };
      boards: {
        status: string;
      };
    };
  };
  environment: {
    NODE_ENV: string;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  };
}

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // DB ステータス取得
        const dbResponse = await fetch('/api/debug/db-status');
        const dbData = await dbResponse.json();
        setDbStatus(dbData);

        // 認証ユーザー情報取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          setError(userError.message);
        } else {
          setAuthUser(user);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const testLogin = async () => {
    // テスト用ログイン（実際の環境では削除してください）
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        alert('テストログイン失敗: ' + error.message);
      } else {
        alert('テストログイン成功: ' + data.user?.email);
        window.location.reload();
      }
    } catch (err) {
      alert('テストログインエラー: ' + err);
    }
  };

  const testLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('ログアウト失敗: ' + error.message);
      } else {
        alert('ログアウト成功');
        window.location.reload();
      }
    } catch (err) {
      alert('ログアウトエラー: ' + err);
    }
  };

  if (loading) {
    return (
      <div className="debug-page">
        <h1>Debug Mode - Loading...</h1>
      </div>
    );
  }

  return (
    <div className="debug-page">
      <div className="debug-container">
        <header>
          <h1>🔧 Debug Mode</h1>
          <p>開発・デバッグ用の情報表示ページ</p>
          <Link href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← ホームに戻る
          </Link>
        </header>

        {error && (
          <div className="error-section">
            <h2>❌ エラー</h2>
            <pre>{error}</pre>
          </div>
        )}

        <section className="auth-section">
          <h2>🔐 認証状態</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>ログイン状態:</strong>
              <span className={authUser ? 'status-success' : 'status-error'}>
                {authUser ? 'ログイン中' : '未ログイン'}
              </span>
            </div>
            {authUser && (
              <>
                <div className="info-item">
                  <strong>ユーザーID:</strong> {authUser.id}
                </div>
                <div className="info-item">
                  <strong>メールアドレス:</strong> {authUser.email}
                </div>
                <div className="info-item">
                  <strong>ユーザーID:</strong> {authUser.id}
                </div>
              </>
            )}
          </div>
          
          <div className="button-group">
            <button onClick={testLogin} className="test-button">
              テストログイン
            </button>
            <button onClick={testLogout} className="test-button logout">
              ログアウト
            </button>
          </div>
        </section>

        {dbStatus && (
          <section className="db-section">
            <h2>🗄️ データベース状態</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Supabase URL:</strong> {dbStatus.supabase.url}
              </div>
              <div className="info-item">
                <strong>DB接続:</strong>
                <span className={dbStatus.supabase.auth.connected ? 'status-success' : 'status-error'}>
                  {dbStatus.supabase.auth.connected ? '接続OK' : '接続エラー'}
                </span>
              </div>
              <div className="info-item">
                <strong>users_extended テーブル:</strong>
                <span className={dbStatus.supabase.database.users_extended.accessible ? 'status-success' : 'status-error'}>
                  {dbStatus.supabase.database.users_extended.accessible ? '利用可能' : 'エラー'}
                </span>
              </div>
              <div className="info-item">
                <strong>ユーザー数:</strong> {dbStatus.supabase.database.users_extended.count}
              </div>
              <div className="info-item">
                <strong>掲示板データ:</strong>
                <span className={dbStatus.supabase.database.boards.status === 'Available' ? 'status-success' : 'status-error'}>
                  {dbStatus.supabase.database.boards.status}
                </span>
              </div>
            </div>
          </section>
        )}

        {dbStatus && (
          <section className="env-section">
            <h2>⚙️ 環境設定</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>NODE_ENV:</strong> {dbStatus.environment.NODE_ENV}
              </div>
              <div className="info-item">
                <strong>SITE_URL:</strong> {dbStatus.environment.NEXT_PUBLIC_SITE_URL}
              </div>
              <div className="info-item">
                <strong>Google Maps API:</strong>
                <span className={dbStatus.environment.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'Set' ? 'status-success' : 'status-error'}>
                  {dbStatus.environment.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                </span>
              </div>
              <div className="info-item">
                <strong>タイムスタンプ:</strong> {new Date(dbStatus.timestamp).toLocaleString()}
              </div>
            </div>
          </section>
        )}

        <section className="actions-section">
          <h2>🔗 アクション</h2>
          <div className="button-group">
            <Link href="/auth/login" className="action-button">
              ログインページ
            </Link>
            <Link href="/auth/register" className="action-button">
              新規登録ページ
            </Link>
            <Link href="/boards" className="action-button">
              掲示板一覧
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="action-button refresh"
            >
              ページ更新
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .debug-page {
          min-height: 100vh;
          padding: 2rem;
          background: #f8f9fa;
          font-family: monospace;
        }

        .debug-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        header {
          border-bottom: 2px solid #eee;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }

        h1 {
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        h2 {
          color: #555;
          margin: 1.5rem 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #eee;
        }

        section {
          margin-bottom: 2rem;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }

        .status-success {
          color: #28a745;
          font-weight: bold;
        }

        .status-error {
          color: #dc3545;
          font-weight: bold;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .test-button, .action-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .test-button {
          background: #007bff;
          color: white;
        }

        .test-button.logout {
          background: #dc3545;
        }

        .test-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .action-button {
          background: #6c757d;
          color: white;
          display: inline-block;
        }

        .action-button.refresh {
          background: #17a2b8;
        }

        .action-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .error-section {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 2rem;
        }

        .error-section h2 {
          color: #721c24;
          margin-top: 0;
        }

        pre {
          background: #f1f3f4;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .debug-page {
            padding: 1rem;
          }

          .debug-container {
            padding: 1rem;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}