// app/thread/[id]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

type Thread = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  created_at: string;
  post_count: number;
};

type Post = {
  id: string;
  thread_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
  font_family: string | null;
};

const MAX_POSTS = parseInt(process.env.NEXT_PUBLIC_MAX_POST_COUNT || '1000', 10);

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


const ThreadDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  
  const resolvedParams = React.use(params);
  const threadId = resolvedParams.id;

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  // ★ 状態管理を修正: loadingをオブジェクトに変更
  const [pageStatus, setPageStatus] = useState({
    loading: true,
    error: null as string | null,
    isAccessAllowed: null as boolean | null // null: 確認中, true: 許可, false: 拒否
  });

  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  
  const [selectedFont, setSelectedFont] = useState('var(--font-noto-sans-jp)'); 
  
  const postsEndRef = useRef<HTMLDivElement>(null);
  
  // ★ useEffectをアクセス制御ロジックに大幅変更
  useEffect(() => {
    if (!threadId) {
      setPageStatus({ loading: false, error: "スレッドIDが指定されていません。", isAccessAllowed: false });
      return;
    }

    const checkAccessAndFetchData = async () => {
      try {
        // 1. スレッド情報を先に取得
        const { data: threadData, error: threadError } = await supabase
          .from('threads')
          .select('*')
          .eq('id', threadId)
          .single();

        if (threadError || !threadData) {
          throw new Error(threadError?.message || 'スレッドが見つかりません。');
        }
        setThread(threadData);

        // 2. ユーザーの現在地を取得
        if (!navigator.geolocation) {
          throw new Error('お使いのブラウザは位置情報に対応していません。');
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: currentLat, longitude: currentLon } = position.coords;
            const distance = calculateDistance(currentLat, currentLon, threadData.latitude, threadData.longitude);

            // 3. 距離を判定してアクセスを制御
            if (distance > 1) {
              setPageStatus({ loading: false, error: 'このスレッドは範囲外です。', isAccessAllowed: false });
            } else {
              // 4. 許可された場合のみ投稿を取得
              const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true });

              if (postsError) throw postsError;
              
              setPosts(postsData);
              setPageStatus({ loading: false, error: null, isAccessAllowed: true });
            }
          },
          (geoError) => {
            // 位置情報取得失敗時
            throw new Error('位置情報の取得に失敗しました。アクセス許可を確認してください。');
          }
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setPageStatus({ loading: false, error: errorMessage, isAccessAllowed: false });
      }
    };

    checkAccessAndFetchData();

    // リアルタイムリスナー (アクセスが許可された後も有効)
    const postsChannel = supabase.channel(`thread_posts:${threadId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: `thread_id=eq.${threadId}` }, (payload) => { setPosts((prev) => [...prev, payload.new as Post]); }).subscribe();
    const threadsChannel = supabase.channel(`threads:${threadId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads', filter: `id=eq.${threadId}` }, (payload) => { setThread(payload.new as Thread); }).subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(threadsChannel);
    };
  }, [threadId]);

  useEffect(() => {
    if (postsEndRef.current) {
      postsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [posts]);


  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPost(true);
    setPageStatus(prev => ({ ...prev, error: null })); // エラーをリセット

    if (!content.trim() || !thread) return setSubmittingPost(false);

    try {
      const { error: insertError } = await supabase.from('posts').insert([{
        thread_id: threadId,
        author_name: authorName.trim() || null,
        content: content.trim(),
        font_family: selectedFont,
      }]);
      if (insertError) throw insertError;
      setContent('');
    } catch (err: unknown) {
      setPageStatus(prev => ({...prev, error: `投稿エラー: ${err instanceof Error ? err.message : String(err)}`}));
    } finally {
      setSubmittingPost(false);
    }
  };

  // ★★★ レンダリング部分を状態に応じて変更 ★★★
  if (pageStatus.loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>アクセス確認中...</div>;
  }

  if (!pageStatus.isAccessAllowed || !thread) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: 'red', fontWeight: 'bold' }}>{pageStatus.error || 'アクセスできませんでした。'}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px' }}>トップページに戻る</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--font-noto-sans-jp)', maxWidth: '800px', margin: 'auto' }}>
      <h1>{thread.title}</h1>
      <p>投稿数: {thread.post_count} / {MAX_POSTS}</p>

      <div>
        <h2>投稿一覧</h2>
        <div>
          {posts.map(post => (
            <div key={post.id}>
              <p><strong>{post.author_name || '匿名'}</strong><span> ({new Date(post.created_at).toLocaleString()})</span></p>
              <p style={{ fontFamily: post.font_family || 'var(--font-noto-sans-jp)' }}>{post.content}</p>
            </div>
          ))}
          <div ref={postsEndRef} />
        </div>
      </div>

      <div>
        <h2>新規投稿</h2>
        {pageStatus.error && <p style={{ color: 'red' }}>{pageStatus.error}</p>}
        <form onSubmit={handlePostSubmit}>
          <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="名前 (任意)" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="コメント" />
          
          {/* ★ ドロップダウンにドット文字を追加 */}
          <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)}>
            <option value="var(--font-noto-sans-jp)">ゴシック体 (標準)</option>
            <option value="var(--font-yuji-syuku)">手書き風 (Yuji Syuku)</option>
            <option value="var(--font-zen-kaku)">やさしいゴシック (Zen Kaku)</option>
            <option value="var(--font-dot-gothic)">ドット文字 (DotGothic16)</option>
            <option value="serif">明朝体</option>
            <option value="monospace">等幅フォント</option>
          </select>
          
          <button type="submit" disabled={submittingPost || thread.post_count >= MAX_POSTS}>
            {submittingPost ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>

      <button onClick={() => router.push('/')}>トップページに戻る</button>
    </div>
  );
};

export default ThreadDetailPage;