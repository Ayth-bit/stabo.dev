// app/thread/[id]/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import ThreadLifecycleManager from '@/components/ThreadLifecycleManager';

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
  is_global: boolean;
  expires_at?: string;
  is_archived?: boolean;
  restore_count?: number;
};

type Post = {
  id: string;
  thread_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
  font_family: string | null;
  link: string | null;
  color: string | null;
};

const MAX_POSTS = parseInt(process.env.NEXT_PUBLIC_MAX_POST_COUNT || '1000', 10);
const WRITE_RADIUS_KM = 0.3;
const READ_RADIUS_KM = 1.5;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ThreadDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const threadId = resolvedParams.id;

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pageStatus, setPageStatus] = useState({ loading: true, error: null as string | null, isAccessAllowed: false, canWrite: false });
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [selectedFont, setSelectedFont] = useState('var(--font-noto-sans-jp)');
  const [postLink, setPostLink] = useState('');
  const [postColor, setPostColor] = useState('#333333');

  const postsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId) {
      setPageStatus({ loading: false, error: "スレッドIDが指定されていません。", isAccessAllowed: false, canWrite: false });
      return;
    }

    const checkAccessAndFetchData = async () => {
      try {
        const { data: threadData, error: threadError } = await supabase.from('threads').select('*, is_global, expires_at, is_archived, restore_count').eq('id', threadId).single();
        if (threadError || !threadData) throw new Error('スレッドが見つかりません。');
        setThread(threadData);

        const fetchPosts = async () => {
          const { data: postsData, error: postsError } = await supabase.from('posts').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
          if (postsError) throw postsError;
          setPosts(postsData);
        };

        if (threadData.is_global) {
          await fetchPosts();
          setPageStatus({ loading: false, error: null, isAccessAllowed: true, canWrite: true });
          return;
        }

        if (!navigator.geolocation) {
          throw new Error('お使いのブラウザは位置情報に対応していません。');
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: currentLat, longitude: currentLon } = position.coords;
            const distance = calculateDistance(currentLat, currentLon, threadData.latitude, threadData.longitude);

            if (distance > READ_RADIUS_KM) {
              setPageStatus({ loading: false, error: `このスレッドは範囲外です (距離: ${distance.toFixed(2)}km)。`, isAccessAllowed: false, canWrite: false });
            } else {
              await fetchPosts();
              const canWrite = distance <= WRITE_RADIUS_KM;
              const errorMsg = canWrite ? null : `読み取り専用モード (書き込みするには${WRITE_RADIUS_KM * 1000}m以内に近づいてください)`;
              setPageStatus({ loading: false, error: errorMsg, isAccessAllowed: true, canWrite });
            }
          },
          () => { throw new Error('位置情報の取得に失敗しました。アクセス許可を確認してください。'); }
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setPageStatus({ loading: false, error: errorMessage, isAccessAllowed: false, canWrite: false });
      }
    };

    checkAccessAndFetchData();

    const postsChannel = supabase
      .channel(`thread_posts:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setPosts((currentPosts) => [...currentPosts, payload.new as Post]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [threadId]);

  useEffect(() => {
    if (postsEndRef.current) postsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageStatus.canWrite || !content.trim() || !thread) return;
    setSubmittingPost(true);
    setPageStatus(prev => ({ ...prev, error: null }));

    try {
      const { error: insertError } = await supabase.from('posts').insert([{
        thread_id: threadId,
        author_name: authorName.trim() || null,
        content: content.trim(),
        font_family: selectedFont,
        link: postLink.trim() || null,
        color: postColor,
      }]);

      if (insertError) throw insertError;

      setContent('');
      setPostLink('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPageStatus(prev => ({ ...prev, error: `投稿エラー: ${errorMessage}` }));
    } finally {
      setSubmittingPost(false);
    }
  };

  if (pageStatus.loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>アクセス確認中...</div>;
  }

  if (!pageStatus.isAccessAllowed || !thread) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p style={{ color: 'red', fontWeight: 'bold' }}>{pageStatus.error || 'アクセスできませんでした。'}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px' }}>トップページに戻る</button>
      </div>
    );
  }

  const handleThreadRestore = (_threadId: string) => {
    // スレッドが復元されたらデータを再取得
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{thread.title}</h1>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: 'var(--text-tertiary)' }}>投稿数: {thread.post_count} / {MAX_POSTS}</p>
      
      {/* Thread Lifecycle Status */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <ThreadLifecycleManager
          threadId={thread.id}
          expiresAt={thread.expires_at}
          isArchived={thread.is_archived}
          restoreCount={thread.restore_count}
          onRestore={handleThreadRestore}
        />
      </div>

      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>投稿一覧</h2>
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
          {posts.map(post => (
            <div key={post.id} style={{ borderBottom: '1px dashed var(--border-color)', marginBottom: '15px', paddingBottom: '15px' }}>
              <p style={{ fontFamily: post.font_family || 'inherit', color: 'var(--text-secondary)', margin: '0 0 5px 0' }}>
                <strong style={{ color: post.color || 'var(--text-primary)' }}>{post.author_name || '匿名'}</strong>
                <span style={{ fontSize: '0.8em' }}> ({new Date(post.created_at).toLocaleString()})</span>
              </p>
              <p style={{ fontFamily: post.font_family || 'inherit', color: post.color || 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {post.content}
              </p>
              {post.link && (
                <a href={post.link} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline', fontSize: '0.9em', display: 'block', marginTop: '5px' }}>
                  {post.link}
                </a>
              )}
            </div>
          ))}
          <div ref={postsEndRef} />
        </div>
      </div>

      <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>新規投稿</h2>
        {pageStatus.error && <p style={{ color: pageStatus.canWrite ? 'red' : 'orange', textAlign: 'center' }}>{pageStatus.error}</p>}
        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: pageStatus.canWrite ? 1 : 0.6, pointerEvents: pageStatus.canWrite ? 'auto' : 'none' }}>
          <input type="text" placeholder="名前 (任意)" value={authorName} onChange={e => setAuthorName(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}/>
          <textarea placeholder="コメント" value={content} onChange={e => setContent(e.target.value)} required rows={5} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: selectedFont, color: postColor, transition: 'all 0.2s' }}/>
          <input type="url" placeholder="https://example.com (任意)" value={postLink} onChange={e => setPostLink(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}/>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedFont}
              onChange={e => setSelectedFont(e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              disabled={!pageStatus.canWrite}
            >
              <option value="var(--font-noto-sans-jp)">ゴシック体</option>
              <option value="'Nico Moji'">ニコモジ</option>
              <option value="var(--font-yuji-syuku)">手書き風</option>
              <option value="var(--font-zen-kaku)">やさしいゴシック</option>
              <option value="var(--font-dot-gothic)">ドット文字</option>
              <option value="serif">明朝体</option>
              <option value="monospace">等幅フォント</option>
            </select>
            <input
              type="color"
              value={postColor}
              onChange={e => setPostColor(e.target.value)}
              style={{ padding: '2px', height: '40px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              disabled={!pageStatus.canWrite}
            />
          </div>
          <button
            type="submit"
            disabled={!pageStatus.canWrite || submittingPost}
            style={{ padding: '12px', fontSize: '1.1em', backgroundColor: `rgb(var(--primary-rgb))`, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {submittingPost ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: `rgb(var(--primary-rgb))`, cursor: 'pointer', fontSize: '1em', textDecoration: 'underline' }}
        >
          トップページに戻る
        </button>
      </div>
    </div>
  );
};

export default ThreadDetailPage;