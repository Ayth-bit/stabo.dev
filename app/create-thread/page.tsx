// app/create-thread/page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

const CreateThreadPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLat = parseFloat(searchParams.get('lat') || '0');
  const initialLon = parseFloat(searchParams.get('lon') || '0');

  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('スレッドタイトルは必須です。');
      setSubmitting(false);
      return;
    }

    if (isNaN(initialLat) || isNaN(initialLon)) {
      setError('位置情報が不正です。トップページからやり直してください。');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('threads')
        .insert([
          {
            title: title.trim(),
            latitude: initialLat,
            longitude: initialLon,
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
        // ★修正点1: `data` はここで使われているため、`no-unused-vars` は本来出ないはずですが、
        // VercelのESLint設定によってはトリガーされることがあるため、`alert` を削除し、
        // 直接 `router.push` に変更します。
        router.push(`/thread/${data.id}`); // 作成したスレッドページへ遷移
        // もしトップページに戻るのが要件であれば、以下を使用
        // alert('スレッドが正常に作成されました！トップページに戻ります。');
        // router.push('/');
      }
    } catch (err: unknown) { // ★ any -> unknown に変更
      console.error('予期せぬエラー:', err instanceof Error ? err.message : String(err)); // 型ガードを追加
      setError(`予期せぬエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: 'auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>新規スレッド作成</h1>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777' }}>
        作成位置: 緯度 {initialLat.toFixed(6)}, 経度 {initialLon.toFixed(6)}
      </p>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>スレッドタイトル:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#333' }}
            placeholder="スレッドのタイトルを入力してください"
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
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            fontSize: '0.9em',
            textDecoration: 'underline'
          }}
        >
          トップページに戻る
        </button>
      </div>
    </div>
  );
};

export default CreateThreadPage;