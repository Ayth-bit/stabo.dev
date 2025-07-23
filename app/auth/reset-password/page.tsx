'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  AuthLayout, 
  AuthForm, 
  FormGroup, 
  FormInput, 
  ErrorMessage, 
  AuthButton, 
  AuthLinks,
  SuccessMessage 
} from '../../../components/AuthLayout';

const supabase = createClientComponentClient();

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/update-password`,
        }
      );

      if (resetError) {
        setError('パスワードリセットメールの送信に失敗しました');
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
      <SuccessMessage title="メール送信完了">
        <p>
          パスワードリセット用のメールを <strong>{email}</strong> に送信しました。
        </p>
        <p>
          メール内のリンクをクリックして、新しいパスワードを設定してください。
        </p>
        <p className="note">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
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
      title="パスワードリセット"
      subtitle="登録済みのメールアドレスを入力してください"
      backLink={{ href: "/auth/login", text: "ログイン画面に戻る" }}
    >
      <AuthForm onSubmit={handleResetPassword}>
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

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? '送信中...' : 'リセットメールを送信'}
        </AuthButton>
      </AuthForm>

      <AuthLinks>
        <p>
          <Link href="/auth/login" className="link">
            ログイン画面に戻る
          </Link>
        </p>
        <p>
          <Link href="/auth/register" className="link">
            新規登録はこちら
          </Link>
        </p>
      </AuthLinks>
    </AuthLayout>
  );
}