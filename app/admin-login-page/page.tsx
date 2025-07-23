'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  AuthLayout, 
  AuthForm, 
  FormGroup, 
  FormInput, 
  ErrorMessage, 
  AuthButton
} from '../../components/AuthLayout';

const supabase = createClientComponentClient();

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    // 管理者専用アカウントチェック（メールドメインベース）
    const adminEmails = ['admin@stabo.dev', 'admin@example.com'];
    const isAdminEmail = adminEmails.some(adminEmail => 
      email.trim().toLowerCase() === adminEmail.toLowerCase()
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
      backLink={{ href: "/", text: "トップページに戻る" }}
    >
      <div className="admin-notice">
        <p>⚠️ 管理者専用ログインページです</p>
        <p>一般ユーザーの方は<a href="/auth/login">こちら</a>からログインしてください</p>
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

      <style jsx>{`
        .admin-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .admin-notice p {
          margin: 0.25rem 0;
          color: #856404;
          font-size: 0.875rem;
        }

        .admin-notice a {
          color: rgb(230, 168, 0);
          text-decoration: underline;
          font-weight: 600;
        }

        .admin-notice a:hover {
          color: rgba(230, 168, 0, 0.8);
        }
      `}</style>
    </AuthLayout>
  );
}