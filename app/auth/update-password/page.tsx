'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  AuthButton,
  AuthForm,
  AuthLayout,
  AuthLinks,
  ErrorMessage,
  FormGroup,
  FormInput,
  SuccessMessage,
} from '../../../components/AuthLayout';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // URLからトークンを確認
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // トークンを使ってセッションを設定
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('新しいパスワードを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (updateError) {
        setError(`パスワードの更新に失敗しました: ${updateError.message}`);
        return;
      }

      setSuccess(true);
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SuccessMessage title="パスワード更新完了">
        <p>パスワードが正常に更新されました。</p>
        <p>新しいパスワードでログインしてください。</p>
        <div className="success-actions">
          <Link href="/auth/login" className="auth-button primary">
            ログイン画面へ
          </Link>
          <Link href="/" className="link">
            トップページに戻る
          </Link>
        </div>
      </SuccessMessage>
    );
  }

  return (
    <AuthLayout
      title="パスワード更新"
      subtitle="新しいパスワードを入力してください"
      backLink={{ href: '/auth/login', text: 'ログイン画面に戻る' }}
    >
      <AuthForm onSubmit={handleUpdatePassword}>
        <FormGroup label="新しいパスワード" htmlFor="password">
          <FormInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新しいパスワード（6文字以上）"
            required
            disabled={loading}
            minLength={6}
          />
        </FormGroup>

        <FormGroup label="パスワード確認" htmlFor="confirmPassword">
          <FormInput
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="パスワードを再入力"
            required
            disabled={loading}
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? '更新中...' : 'パスワードを更新'}
        </AuthButton>
      </AuthForm>

      <AuthLinks>
        <p>
          <Link href="/auth/login" className="link">
            ログイン画面に戻る
          </Link>
        </p>
      </AuthLinks>
    </AuthLayout>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  );
}
