'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AuthButton,
  AuthForm,
  AuthLayout,
  AuthLinks,
  ErrorMessage,
  FormGroup,
  FormInput,
} from '../../../components/AuthLayout';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    console.log('Attempting login with email:', email);

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        if (authError.message === 'Invalid login credentials') {
          setError('メールアドレスまたはパスワードが間違っています');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('メールアドレスが確認されていません。確認メールをご確認ください。');
        } else {
          setError('ログインに失敗しました。もう一度お試しください。');
        }
        return;
      }

      if (data.user) {
        console.log('Login successful:', data.user.email);
        // ログイン成功 - メインページにリダイレクト
        window.location.href = '/';
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="ログイン"
      subtitle="stabo.devへようこそ"
      backLink={{ href: '/', text: 'トップページに戻る' }}
    >
      <AuthForm onSubmit={handleLogin}>
        <FormGroup label="メールアドレス" htmlFor="email">
          <FormInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
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
            placeholder="パスワードを入力"
            required
            disabled={loading}
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </AuthButton>
      </AuthForm>

      <AuthLinks>
        <p>
          アカウントをお持ちでない方は
          <Link href="/auth/register" className="link">
            新規登録
          </Link>
        </p>
        <p>
          <Link href="/auth/reset-password" className="link">
            パスワードを忘れた場合
          </Link>
        </p>
      </AuthLinks>
    </AuthLayout>
  );
}
