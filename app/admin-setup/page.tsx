'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminSetupPage() {
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<{
    exists: boolean;
    hasProfile: boolean;
    user?: any;
  } | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/setup');
      if (response.ok) {
        const data = await response.json();
        setAdminStatus(data);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const createAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      setSuccess('管理者ユーザーが正常に作成されました！');
      checkAdminStatus(); // Refresh status
    } catch (err) {
      console.error('Admin creation error:', err);
      setError(err instanceof Error ? err.message : '管理者ユーザーの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">管理者セットアップ</h1>
          <p className="text-gray-600 text-sm">
            stabo.dev 管理者アカウントの作成
          </p>
        </div>

        {adminStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            adminStatus.exists 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h3 className="font-semibold mb-2">現在の状態:</h3>
            {adminStatus.exists ? (
              <div className="text-green-700 text-sm">
                <p>✅ 管理者ユーザーが存在します</p>
                <p>✅ プロフィール: {adminStatus.hasProfile ? '作成済み' : '未作成'}</p>
                <p className="mt-2">
                  <strong>Email:</strong> {adminStatus.user?.email}
                </p>
                <div className="mt-4">
                  <Link 
                    href="/auth/login" 
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    ログインページへ
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-yellow-700 text-sm">
                ⚠️ 管理者ユーザーが作成されていません
              </p>
            )}
          </div>
        )}

        {!adminStatus?.exists && (
          <form onSubmit={createAdminUser} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value="admin@example.com"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                デフォルト: admin123（変更可能）
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '作成中...' : '管理者ユーザーを作成'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Link 
            href="/" 
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            トップページに戻る
          </Link>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600">
            <strong>注意:</strong> このページは開発・初期設定用です。
            本番環境では適切なセキュリティ対策を実装してください。
          </p>
        </div>
      </div>
    </div>
  );
}