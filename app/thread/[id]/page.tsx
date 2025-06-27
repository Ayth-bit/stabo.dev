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

// Postの型にfont_familyを追加
type Post = {
  id: string;
  thread_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
  font_family: string | null; // フォント情報を格納
};

const MAX_POSTS = parseInt(process.env.NEXT_PUBLIC_MAX_POST_COUNT || '1000', 10);

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 距離 (km)
};


const ThreadDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  
  const resolvedParams = React.use(params);
  const threadId = resolvedParams.id;

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  
  // ★ 修正: CSS変数名をStateの初期値に設定
  const [selectedFont, setSelectedFont] = useState('var(--font-noto-sans-jp)'); 
  
  const postsEndRef = useRef<HTMLDivElement>(null);
  
  const fetchThreadAndPosts = useCallback(async () => {
    setError(null);
    try {
      if (!threadId) {
        throw new Error('Thread ID is missing.');
      }

      const { data: threadData, error: threadError } = await supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError) {
        throw threadError;
      }
      setThread(threadData);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (postsError) {
        throw postsError;
      }
      setPosts(postsData);

    } catch (err: unknown) {
      console.error('データ取得エラー:', err instanceof Error ? err.message : String(err));
      setError(`データの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (!threadId) {
        setLoading(false);
        setError("スレッドIDが指定されていません。");
        return;
    }

    fetchThreadAndPosts();

    const postsChannel = supabase
      .channel(`thread_posts:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setPosts((prevPosts) => [...prevPosts, payload.new as Post]);
        }
      )
      .subscribe();

    const threadsChannel = supabase
      .channel(`threads:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'threads', filter: `id=eq.${threadId}` },
        (payload) => {
          setThread(payload.new as Thread);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(threadsChannel);
    };
  }, [threadId, fetchThreadAndPosts]);

  useEffect(() => {
    if (postsEndRef.current) {
      postsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [posts]);


  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPost(true);
    setError(null);

    if (!content.trim()) {
      setError('コメントは必須です。');
      setSubmittingPost(false);
      return;
    }

    if (!thread) {
      setError('スレッド情報がありません。');
      setSubmittingPost(false);
      return;
    }

    if (thread.post_count >= MAX_POSTS) {
      setError(`このスレッドは${MAX_POSTS}レスに到達しました。`);
      setSubmittingPost(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報に対応していません。');
      setSubmittingPost(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: currentLat, longitude: currentLon } = position.coords;
        const distance = calculateDistance(currentLat, currentLon, thread.latitude, thread.longitude);

        if (distance > 1) {
          setError(`スレッドから1km以上離れています（現在地との距離: ${distance.toFixed(2)}km）。投稿するには1km圏内にいる必要があります。`);
          setSubmittingPost(false);
          return;
        }

        try {
          const { error: insertError } = await supabase.from('posts').insert([
            {
              thread_id: threadId,
              author_name: authorName.trim() || null,
              content: content.trim(),
              font_family: selectedFont,
            },
          ]);

          if (insertError) {
            console.error('投稿エラー:', insertError);
            setError(`投稿に失敗しました: ${insertError.message}`);
          } else {
            setContent('');
            await fetchThreadAndPosts(); 
          }
        } catch (err: unknown) {
          console.error('予期せぬ投稿エラー:', err);
          setError(`予期せぬエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setSubmittingPost(false);
        }
      },
      () => {
        setError('位置情報の取得に失敗しました。投稿するには位置情報へのアクセスを許可してください。');
        setSubmittingPost(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };


  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', color: '#333' }}>スレッドを読み込み中...</div>;
  }

  if (error && !thread) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '20px', backgroundColor: '#fff' }}>エラー: {error}</div>;
  }

  if (!thread) {
    return <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', color: '#333' }}>スレッドが見つかりませんでした。</div>;
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'var(--font-noto-sans-jp)', maxWidth: '800px', margin: 'auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>{thread.title}</h1>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777', marginBottom: '20px' }}>
        作成日時: {new Date(thread.created_at).toLocaleString()} | 投稿数: {thread.post_count} / {MAX_POSTS}
      </p>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h2 style={{ color: '#555' }}>投稿一覧</h2>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9', color: '#333' }}>
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>まだ投稿がありません。</p>
          ) : (
            posts.map((post, index) => (
              <div key={post.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: index < posts.length - 1 ? '1px dashed #eee' : 'none' }}>
                <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '5px' }}>
                  <strong style={{ color: '#333' }}>{post.author_name || '匿名'}</strong>{' '}
                  <span style={{ fontSize: '0.8em', color: '#999' }}>({new Date(post.created_at).toLocaleString()})</span>
                </p>
                {/* ★ pタグのstyleを修正 */}
                <p style={{ fontFamily: post.font_family || 'var(--font-noto-sans-jp)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#333' }}>
                  {post.content}
                </p>
              </div>
            ))
          )}
          <div ref={postsEndRef} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
        <h2 style={{ color: '#555' }}>新規投稿</h2>
        {thread.post_count >= MAX_POSTS && (
          <p style={{ color: 'orange', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>
            このスレッドは{MAX_POSTS}レスに到達しました。新しい投稿はできません。
          </p>
        )}
        {error && <p style={{ color: 'red', textAlign: 'center', paddingBottom: '10px' }}>{error}</p>}
        
        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="authorName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>名前 (任意):</label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={submittingPost || thread.post_count >= MAX_POSTS}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#333' }}
              placeholder="匿名"
            />
          </div>
          <div>
            <label htmlFor="content" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>コメント:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              disabled={submittingPost || thread.post_count >= MAX_POSTS}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical', backgroundColor: '#fff', color: '#333' }}
              placeholder="コメントを入力してください"
            ></textarea>
          </div>
          
          {/* ★ ドロップダウンを修正 */}
          <div>
            <label htmlFor="font-select" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>フォント:</label>
            <select
              id="font-select"
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              disabled={submittingPost || thread.post_count >= MAX_POSTS}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', color: '#333' }}
            >
              <option value="var(--font-noto-sans-jp)">ゴシック体 (標準)</option>
              <option value="var(--font-yuji-syuku)">手書き風 (Yuji Syuku)</option>
              <option value="var(--font-zen-kaku)">やさしいゴシック (Zen Kaku)</option>
              <option value="serif">明朝体</option>
              <option value="monospace">等幅フォント</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={submittingPost || thread.post_count >= MAX_POSTS}
            style={{
              padding: '12px 20px',
              fontSize: '1.1em',
              backgroundColor: submittingPost || thread.post_count >= MAX_POSTS ? '#cccccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: submittingPost || thread.post_count >= MAX_POSTS ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {submittingPost ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>

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

export default ThreadDetailPage;