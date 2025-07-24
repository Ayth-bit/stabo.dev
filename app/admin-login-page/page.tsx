'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import {
  AuthButton,
  AuthForm,
  AuthLayout,
  ErrorMessage,
  FormGroup,
  FormInput,
} from '../../components/AuthLayout';
import { supabase } from '../../lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    // 管理者専用アカウントチェック（メールドメインベース）
    const adminEmails = ['admin@stabo.dev', 'admin@example.com'];
    const isAdminEmail = adminEmails.some(
      (adminEmail) => email.trim().toLowerCase() === adminEmail.toLowerCase()
    );

    if (!isAdminEmail) {
      setError('管理者アカウントではありません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('メールアドレスまたはパスワードが間違っています');
        } else {
          setError('ログインに失敗しました。もう一度お試しください。');
        }
        return;
      }

      if (data.user) {
        console.log('Admin login successful:', data.user.email);
        // 管理画面にリダイレクト
        router.push('/admin');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="管理者ログイン"
      subtitle="stabo.dev管理画面"
      backLink={{ href: '/', text: 'トップページに戻る' }}
    >
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 text-center">
        <p className="my-1 text-yellow-800 text-sm">⚠️ 管理者専用ログインページです</p>
        <p className="my-1 text-yellow-800 text-sm">
          一般ユーザーの方は
          <a
            href="/auth/login"
            className="text-yellow-600 underline font-semibold hover:text-yellow-500"
          >
            こちら
          </a>
          からログインしてください
        </p>
      </div>

      <AuthForm onSubmit={handleAdminLogin}>
        <FormGroup label="管理者メールアドレス" htmlFor="email">
          <FormInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            disabled={loading}
          />
        </FormGroup>

        <FormGroup label="パスワード" htmlFor="password">
          <FormInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理者パスワード"
            required
            disabled={loading}
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'ログイン中...' : '管理者ログイン'}
        </AuthButton>
      </AuthForm>
    </AuthLayout>
  );
}
