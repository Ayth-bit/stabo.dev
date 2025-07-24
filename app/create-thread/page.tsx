// app/create-thread/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';

const CreateThreadPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLat = Number.parseFloat(searchParams.get('lat') || '0');
  const initialLon = Number.parseFloat(searchParams.get('lon') || '0');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{id: string, display_name: string} | null>(null);
  const [nearestBoard, setNearestBoard] = useState<{id: string, name: string} | null>(null);

  // ユーザー情報と最寄りボードを取得
  useEffect(() => {
    const fetchUserAndBoard = async () => {
      if (!user) return;

      try {
        // ユーザー情報を取得
        const { data: profile, error: profileError } = await supabase
          .from('users_extended')
          .select('id, display_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('Profile not found, creating new profile for user:', user.id);
          // ユーザープロファイルが存在しない場合、作成する
          const displayName = user.user_metadata?.display_name || 
                             user.email?.split('@')[0] || 
                             'ユーザー';
          
          const { data: newProfile, error: createError } = await supabase
            .from('users_extended')
            .insert({
              id: user.id,
              display_name: displayName,
              is_creator: false,
              qr_code: `stabo_${user.id.slice(0, 8)}_${Date.now().toString(36)}`,
              points: 100,
            })
            .select('id, display_name')
            .single();

          if (createError) {
            console.error('Failed to create user profile:', createError);
            setError('ユーザー情報の作成に失敗しました。');
            return;
          }
          setUserProfile(newProfile);
        } else {
          setUserProfile(profile);
        }

        // 最寄りのボードを取得
        const { data: boards } = await supabase
          .from('boards')
          .select('id, name, latitude, longitude');

        if (boards && boards.length > 0) {
          // 距離計算して最寄りのボードを選択
          let nearest = boards[0];
          let minDistance = Number.MAX_VALUE;

          for (const board of boards) {
            const distance = Math.sqrt(
              (board.latitude - initialLat) ** 2 + 
              (board.longitude - initialLon) ** 2
            );
            if (distance < minDistance) {
              minDistance = distance;
              nearest = board;
            }
          }

          setNearestBoard(nearest);
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
      }
    };

    fetchUserAndBoard();
  }, [user, initialLat, initialLon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('ログインが必要です。');
      setSubmitting(false);
      return;
    }

    if (!userProfile) {
      setError('ユーザー情報を取得できませんでした。');
      setSubmitting(false);
      return;
    }

    if (!nearestBoard) {
      setError('投稿先のボードを特定できませんでした。');
      setSubmitting(false);
      return;
    }

    if (!title.trim()) {
      setError('スレッドタイトルは必須です。');
      setSubmitting(false);
      return;
    }

    if (!content.trim()) {
      setError('スレッド内容は必須です。');
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(initialLat) || Number.isNaN(initialLon)) {
      setError('位置情報が不正です。トップページからやり直してください。');
      setSubmitting(false);
      return;
    }

    try {
      // 72時間後の有効期限を設定
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      const { data, error: supabaseError } = await supabase
        .from('threads')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            author_id: user.id,
            author_name: userProfile.display_name,
            board_id: nearestBoard.id,
            latitude: initialLat,
            longitude: initialLon,
            expires_at: expiresAt.toISOString(),
            is_archived: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (supabaseError) {
        console.error('スレッド作成エラー:', supabaseError);
        setError(`スレッドの作成に失敗しました: ${supabaseError.message}`);
      } else {
        setSuccess('スレッドが正常に作成されました！');
        setTitle('');
        setContent('');
        // 作成したスレッドページへ遷移
        router.push(`/thread/${data.id}`);
      }
    } catch (err: unknown) {
      // ★ any -> unknown に変更
      console.error('予期せぬエラー:', err instanceof Error ? err.message : String(err)); // 型ガードを追加
      setError(`予期せぬエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ログインしていない場合の表示
  if (!user) {
    return (
      <div style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '500px',
        margin: 'auto',
        textAlign: 'center'
      }}>
        <h2>ログインが必要です</h2>
        <p>スレッドを作成するにはログインしてください。</p>
        <div style={{ gap: '10px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => router.push('/auth/register')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            新規登録
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '500px',
        margin: 'auto',
        border: '1px solid #eee',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        color: '#333',
      }}
    >
      <h1 style={{ textAlign: 'center', color: '#333' }}>新規スレッド作成</h1>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777' }}>
        作成位置: 緯度 {initialLat.toFixed(6)}, 経度 {initialLon.toFixed(6)}
      </p>
      {nearestBoard && (
        <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#555' }}>
          投稿先: {nearestBoard.name}
        </p>
      )}

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}
      >
        <div>
          <label
            htmlFor="title"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            スレッドタイトル:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              color: '#333',
            }}
            placeholder="スレッドのタイトルを入力してください"
          />
        </div>
        <div>
          <label
            htmlFor="content"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            スレッド内容:
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            rows={5}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              color: '#333',
              resize: 'vertical',
            }}
            placeholder="スレッドの内容を入力してください"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 20px',
            fontSize: '1.1em',
            backgroundColor: submitting ? '#cccccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {submitting ? '作成中...' : 'スレッドを作成'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            fontSize: '0.9em',
            textDecoration: 'underline',
          }}
        >
          トップページに戻る
        </button>
      </div>
    </div>
  );
};

export default CreateThreadPage;
