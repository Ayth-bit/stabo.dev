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
  SuccessMessage,
} from '../../../components/AuthLayout';
import { supabase } from '../../../lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError('すべての必須項目を入力してください');
      return;
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('表示名は2文字以上で入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Supabase Auth で新規登録
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            display_name: displayName.trim(),
            is_creator: isCreator,
          },
        },
      });

      if (authError) {
        console.error('Auth error:');
        console.error('Full auth error:', JSON.stringify(authError, null, 2));

        // User-friendly error messages
        if (
          authError.message.includes('already registered') ||
          authError.message.includes('already been registered')
        ) {
          setError('このメールアドレスは既に登録されています');
        } else if (authError.message.includes('invalid') || authError.message.includes('Invalid')) {
          setError('メールアドレスの形式が正しくありません');
        } else if (authError.message.includes('weak password')) {
          setError('パスワードが弱すぎます。より複雑なパスワードをお試しください');
        } else if (
          authError.message.includes('rate limit') ||
          authError.message.includes('too many')
        ) {
          setError('登録試行回数が上限に達しました。しばらく時間をおいてから再度お試しください');
        } else {
          setError('登録に失敗しました。しばらく時間をおいてから再度お試しください');
        }
        return;
      }

      if (data.user) {
        // 追加のユーザー情報をusers_extendedテーブルに保存
        const { error: profileError } = await supabase.from('users_extended').insert({
          id: data.user.id,
          display_name: displayName.trim(),
          is_creator: isCreator,
          qr_code: `stabo_${data.user.id.slice(0, 8)}_${Date.now().toString(36)}`,
          points: 100, // 新規登録ボーナス
        });

        if (profileError) {
          console.error('Profile creation error:');
          console.error('Full error object:', JSON.stringify(profileError, null, 2));
          console.error('Error details:', {
            message: profileError.message || 'No message',
            details: profileError.details || 'No details',
            hint: profileError.hint || 'No hint',
            code: profileError.code || 'No code',
          });
          // エラーがあってもメール確認は送信されているため、成功として処理
        }

        setSuccess(true);
      }
    } catch (err) {
      console.error('Registration exception:');
      console.error('Exception details:', JSON.stringify(err, null, 2));
      console.error('Exception object:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SuccessMessage title="登録完了">
        <p>
          確認メールを <strong>{email}</strong> に送信しました。
        </p>
        <p>メール内のリンクをクリックして、アカウントを有効化してください。</p>
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
      title="新規登録"
      subtitle="stabo.devアカウントを作成"
      backLink={{ href: '/', text: 'トップページに戻る' }}
    >
      <AuthForm onSubmit={handleRegister}>
        <FormGroup label="表示名 *" htmlFor="displayName">
          <FormInput
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="あなたの表示名"
            required
            disabled={loading}
            maxLength={20}
          />
        </FormGroup>

        <FormGroup label="メールアドレス *" htmlFor="email">
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

        <FormGroup label="パスワード *" htmlFor="password">
          <FormInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上のパスワード"
            required
            disabled={loading}
            minLength={6}
          />
        </FormGroup>

        <FormGroup label="パスワード確認 *" htmlFor="confirmPassword">
          <FormInput
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="同じパスワードを再入力"
            required
            disabled={loading}
          />
        </FormGroup>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isCreator}
              onChange={(e) => setIsCreator(e.target.checked)}
              disabled={loading}
            />
            <span className="checkbox-text">
              クリエイターとして登録（ステッカーを作成・販売できます）
            </span>
          </label>
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? '登録中...' : 'アカウント作成'}
        </AuthButton>
      </AuthForm>

      <AuthLinks>
        <p>
          既にアカウントをお持ちの方は
          <Link href="/auth/login" className="link">
            ログイン
          </Link>
        </p>
      </AuthLinks>

      <style jsx>{`
        .checkbox-group {
          margin-bottom: 2rem;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          font-weight: normal;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin-right: 0.5rem;
          margin-top: 0.25rem;
          transform: scale(1.2);
        }

        .checkbox-text {
          flex: 1;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </AuthLayout>
  );
}
