// app/thread/[id]/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react'; // ★ useCallback をインポート
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
};

const ThreadDetailPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const threadId = params.id;
  console.log("Thread ID from params:", threadId);

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const postsEndRef = useRef<HTMLDivElement>(null);

  // ★修正点4: fetchThreadAndPosts を useCallback でメモ化し、依存配列に含める
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

    } catch (err: unknown) { // ★ any -> unknown に変更
      console.error('データ取得エラー:', err instanceof Error ? err.message : String(err));
      setError(`データの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [threadId]); // threadId が変わったときにのみ useCallback を再生成

  // リアルタイム更新の購読と初期読み込み
  useEffect(() => {
    if (!threadId) {
        setLoading(false);
        setError("スレッドIDが指定されていません。");
        return;
    }

    fetchThreadAndPosts(); // 初期読み込み

    const postsChannel = supabase
      .channel(`thread_posts:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          console.log('リアルタイム投稿:', payload.new);
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
          console.log('リアルタイムスレッド更新:', payload.new);
          setThread(payload.new as Thread);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(threadsChannel);
    };
  }, [threadId, fetchThreadAndPosts]); // ★修正点4: fetchThreadAndPosts を依存配列に追加

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

    if (thread.post_count >= 1000) {
      setError('このスレッドは1000レスに到達しました。新しいスレッドを作成してください。');
      setSubmittingPost(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('posts')
        .insert([
          {
            thread_id: threadId,
            author_name: authorName.trim() || null,
            content: content.trim(),
          },
        ]);

      if (insertError) {
        console.error('投稿エラー:', insertError);
        setError(`投稿に失敗しました: ${insertError.message}`);
      } else {
        setContent('');
        await fetchThreadAndPosts(); // 投稿成功後に再フェッチ
      }
    } catch (err: unknown) { // ★ any -> unknown に変更
      console.error('予期せぬ投稿エラー:', err instanceof Error ? err.message : String(err));
      setError(`予期せぬエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmittingPost(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', color: '#333' }}>スレッドを読み込み中...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '20px', backgroundColor: '#fff', color: '#333' }}>エラー: {error}</div>;
  }

  if (!thread) {
    return <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', color: '#333' }}>スレッドが見つかりませんでした。</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: 'auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>{thread.title}</h1>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777', marginBottom: '20px' }}>
        作成日時: {new Date(thread.created_at).toLocaleString()} | 投稿数: {thread.post_count} / 1000
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
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#333' }}>{post.content}</p>
              </div>
            ))
          )}
          <div ref={postsEndRef} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
        <h2 style={{ color: '#555' }}>新規投稿</h2>
        {thread.post_count >= 1000 && (
          <p style={{ color: 'orange', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>
            このスレッドは1000レスに到達しました。新しい投稿はできません。
            <br />
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '0.9em',
                textDecoration: 'underline',
                marginTop: '5px'
              }}
            >
              トップページに戻り、新規スレッドを作成してください
            </button>
          </p>
        )}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="authorName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>名前 (任意):</label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={submittingPost || thread.post_count >= 1000}
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
              disabled={submittingPost || thread.post_count >= 1000}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical', backgroundColor: '#fff', color: '#333' }}
              placeholder="コメントを入力してください"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={submittingPost || thread.post_count >= 1000}
            style={{
              padding: '12px 20px',
              fontSize: '1.1em',
              backgroundColor: submittingPost || thread.post_count >= 1000 ? '#cccccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: submittingPost || thread.post_count >= 1000 ? 'not-allowed' : 'pointer',
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