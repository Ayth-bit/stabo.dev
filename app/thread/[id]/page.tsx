// app/thread/[id]/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

// ★ Thread型に is_global を追加
type Thread = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  created_at: string;
  post_count: number;
  is_global: boolean; // この行を追加
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
  const [pageStatus, setPageStatus] = useState({
    loading: true,
    error: null as string | null,
    isAccessAllowed: null as boolean | null
  });

  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  
  const [selectedFont, setSelectedFont] = useState('var(--font-noto-sans-jp)'); 
  
  const postsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!threadId) {
      setPageStatus({ loading: false, error: "スレッドIDが指定されていません。", isAccessAllowed: false });
      return;
    }

    const checkAccessAndFetchData = async () => {
      try {
        // ★ is_globalも取得するように修正
        const { data: threadData, error: threadError } = await supabase
          .from('threads')
          .select('*, is_global')
          .eq('id', threadId)
          .single();

        if (threadError || !threadData) {
          throw new Error(threadError?.message || 'スレッドが見つかりません。');
        }
        setThread(threadData);
        
        // ★ グローバルスレッドなら、距離チェックをスキップ
        if (threadData.is_global) {
            const { data: postsData, error: postsError } = await supabase.from('posts').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
            if (postsError) throw postsError;
            setPosts(postsData);
            setPageStatus({ loading: false, error: null, isAccessAllowed: true });
            return; // チェック処理を終了
        }

        // --- 通常スレッドの場合の距離チェック ---
        if (!navigator.geolocation) {
          throw new Error('お使いのブラウザは位置情報に対応していません。');
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: currentLat, longitude: currentLon } = position.coords;
            const distance = calculateDistance(currentLat, currentLon, threadData.latitude, threadData.longitude);

            if (distance > 1) {
              setPageStatus({ loading: false, error: `このスレッドは範囲外です (距離: ${distance.toFixed(2)}km)。`, isAccessAllowed: false });
            } else {
              const { data: postsData, error: postsError } = await supabase.from('posts').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
              if (postsError) throw postsError;
              setPosts(postsData);
              setPageStatus({ loading: false, error: null, isAccessAllowed: true });
            }
          },
          () => {
            throw new Error('位置情報の取得に失敗しました。アクセス許可を確認してください。');
          }
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setPageStatus({ loading: false, error: errorMessage, isAccessAllowed: false });
      }
    };

    checkAccessAndFetchData();

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
    setPageStatus(prev => ({ ...prev, error: null }));

    if (!content.trim() || !thread) {
      setSubmittingPost(false);
      return;
    }
    
    const postData = async () => {
        try {
            const { error: insertError } = await supabase.from('posts').insert([{
                thread_id: threadId,
                author_name: authorName.trim() || null,
                content: content.trim(),
                font_family: selectedFont,
            }]);
            if (insertError) throw insertError;
            setContent('');
        } catch (err) {
            setPageStatus(prev => ({...prev, error: `投稿エラー: ${err instanceof Error ? err.message : String(err)}`}));
        } finally {
            setSubmittingPost(false);
        }
    };
    
    // ★ グローバルスレッドなら、距離チェックをスキップして投稿
    if (thread.is_global) {
        await postData();
        return;
    }

    // --- 通常スレッドの場合の投稿前距離チェック ---
    if (!navigator.geolocation) {
      setPageStatus(prev => ({...prev, error: '位置情報が利用できません。'}));
      setSubmittingPost(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const distance = calculateDistance(position.coords.latitude, position.coords.longitude, thread.latitude, thread.longitude);
            if (distance > 1) {
                setPageStatus(prev => ({...prev, error: 'スレッドの範囲外です。投稿できません。'}));
                setSubmittingPost(false);
            } else {
                await postData();
            }
        },
        () => {
            setPageStatus(prev => ({...prev, error: '位置情報の取得に失敗しました。'}));
            setSubmittingPost(false);
        }
    );
  };

  if (pageStatus.loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>アクセス確認中...</div>;
  }

  if (!pageStatus.isAccessAllowed || !thread) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2em' }}>{pageStatus.error || 'アクセスできませんでした。'}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '5px' }}>トップページに戻る</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--font-noto-sans-jp)', maxWidth: '800px', margin: 'auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#333', fontFamily: 'var(--font-zen-kaku)' }}>{thread.title}</h1>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777', marginBottom: '20px' }}>
        作成日時: {new Date(thread.created_at).toLocaleString()} | 投稿数: {thread.post_count} / {MAX_POSTS}
      </p>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h2 style={{ color: '#555' }}>投稿一覧</h2>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9', color: '#333' }}>
          {posts.length === 0 ? <p style={{ textAlign: 'center', color: '#999' }}>まだ投稿がありません。</p> : (
            posts.map((post) => (
              <div key={post.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #eee' }}>
                <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '5px' }}>
                  <strong style={{ color: '#333' }}>{post.author_name || '匿名'}</strong>{' '}
                  <span style={{ fontSize: '0.8em', color: '#999' }}>({new Date(post.created_at).toLocaleString()})</span>
                </p>
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
        {thread.post_count >= MAX_POSTS && <p style={{ color: 'orange', fontWeight: 'bold', textAlign: 'center' }}>このスレッドは上限に達しました。</p>}
        {pageStatus.error && <p style={{ color: 'red', textAlign: 'center' }}>{pageStatus.error}</p>}
        
        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="authorName" style={{ display: 'block', marginBottom: '5px' }}>名前 (任意):</label>
            <input type="text" id="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} disabled={submittingPost || thread.post_count >= MAX_POSTS} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label htmlFor="content" style={{ display: 'block', marginBottom: '5px' }}>コメント:</label>
            <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={5} required disabled={submittingPost || thread.post_count >= MAX_POSTS} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          
          <div>
            <label htmlFor="font-select" style={{ display: 'block', marginBottom: '5px' }}>フォント:</label>
            <select id="font-select" value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} disabled={submittingPost || thread.post_count >= MAX_POSTS} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="var(--font-noto-sans-jp)">ゴシック体 (標準)</option>
              <option value="var(--font-yuji-syuku)">手書き風 (Yuji Syuku)</option>
              <option value="var(--font-zen-kaku)">やさしいゴシック (Zen Kaku)</option>
              <option value="var(--font-dot-gothic)">ドット文字 (DotGothic16)</option>
              <option value="serif">明朝体</option>
              <option value="monospace">等幅フォント</option>
            </select>
          </div>
          
          <button type="submit" disabled={submittingPost || thread.post_count >= MAX_POSTS} style={{ padding: '12px 20px', fontSize: '1.1em', backgroundColor: submittingPost ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {submittingPost ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>トップページに戻る</button>
      </div>
    </div>
  );
};

export default ThreadDetailPage;