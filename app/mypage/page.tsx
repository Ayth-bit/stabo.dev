'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { BaseRegistration } from '../../components/BaseRegistration';
import { DirectMessages } from '../../components/DirectMessages';
import { FriendsManager } from '../../components/FriendsManager';
import { UserPosts } from '../../components/UserPosts';


interface UserExtended {
  id: string;
  display_name: string;
  home_base_lat?: number;
  home_base_lng?: number;
  base_radius?: number;
  points: number;
  qr_code: string;
}

interface Connection {
  id: string;
  connected_user_id: string;
  connected_user: {
    display_name: string;
  };
  created_at: string;
}

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  board_id: string;
  is_archived: boolean;
  boards: {
    name: string;
  };
}

export default function MyPage() {
  const { user } = useAuth();
  const [userExtended, setUserExtended] = useState<UserExtended | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [activeTab, setActiveTab] = useState<'base' | 'friends' | 'posts' | 'dm'>('base');
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    console.log('Fetching user data for user:', user.id);
    console.log('User object:', user);

    try {
      console.log('Attempting to query users_extended table...');
      const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Query response - data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching user data:');
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('Error details:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          table: 'users_extended',
          user_id: user.id,
        });

        // エラーコードに応じた処理
        if (error.code === 'PGRST116') {
          console.log('User not found in users_extended, creating new user record');

          // ユーザーが存在しない場合、新しいレコードを作成
          try {
            const { error: insertError } = await supabase.from('users_extended').insert({
              id: user.id,
              display_name: user.user_metadata?.display_name || user.email || 'ユーザー',
              qr_code: `qr_${user.id.slice(0, 8)}_${Date.now()}`,
              points: 100,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error('Failed to create user record:', insertError);
              setUserExtended({
                id: user.id,
                display_name: user.user_metadata?.display_name || user.email || 'ユーザー',
                home_base_lat: undefined,
                home_base_lng: undefined,
                points: 0,
                qr_code: `fallback_${user.id.slice(0, 8)}`,
              });
            } else {
              // 作成成功したら再度取得
              const { data: newData } = await supabase
                .from('users_extended')
                .select('*')
                .eq('id', user.id)
                .single();

              if (newData) {
                setUserExtended(newData);
              }
            }
          } catch (createError) {
            console.error('Exception creating user record:', createError);
            setUserExtended({
              id: user.id,
              display_name: user.user_metadata?.display_name || user.email || 'ユーザー',
              home_base_lat: undefined,
              home_base_lng: undefined,
              points: 0,
              qr_code: `fallback_${user.id.slice(0, 8)}`,
            });
          }
        } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn(
            'users_extended table does not exist - creating basic user profile'
          );
          // テーブルが存在しない場合の対応
          console.log('Attempting to handle missing table by creating basic user profile');
          setUserExtended({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email || 'ユーザー',
            home_base_lat: undefined,
            home_base_lng: undefined,
            points: 0,
            qr_code: `fallback_${user.id.slice(0, 8)}`,
          });
        } else {
          console.error('Unknown database error occurred');
        }
      } else {
        setUserExtended(data);
      }
    } catch (err) {
      console.error('Exception fetching user data:');
      console.error('Exception details:', JSON.stringify(err, null, 2));
      console.error('Exception object:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          connected_user_id,
          created_at
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching connections:');
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('Error details:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          table: 'connections',
          user_id: user.id,
        });
        setConnections([]);
        return;
      }

      // 各接続ユーザーの詳細情報を取得
      const formattedConnections = [];
      if (data) {
        for (const conn of data) {
          const { data: userData } = await supabase
            .from('users_extended')
            .select('display_name')
            .eq('id', conn.connected_user_id)
            .single();

          formattedConnections.push({
            id: conn.id,
            connected_user_id: conn.connected_user_id,
            created_at: conn.created_at,
            connected_user: {
              display_name: userData?.display_name || '未設定',
            },
          });
        }
      }
      setConnections(formattedConnections);
    } catch (err) {
      console.error('Exception fetching connections:', err);
      setConnections([]);
    }
  }, [user]);

  const fetchUserPosts = useCallback(async () => {
    if (!user) return;

    try {
      // テーブル構造を確認してからクエリを実行
      console.log('Attempting to fetch user posts for user:', user.id);

      // まずはthreadsテーブルの存在を確認
      const { error } = await supabase
        .from('threads')
        .select('id, content, created_at, board_id')
        .limit(1);

      if (error) {
        console.error('Error checking threads table:');
        console.error('Full error object:', JSON.stringify(error, null, 2));

        // テーブルが存在しない、またはuser_idカラムがない場合
        if (
          error.code === 'PGRST106' ||
          error.code === '42703' ||
          error.message.includes('does not exist')
        ) {
          console.warn('threads table or user_id column issue, setting empty posts');
          setUserPosts([]);
          return;
        }

        setUserPosts([]);
        return;
      }

      // テーブルが存在する場合、user_idでフィルタリングを試す
      console.log('threads table exists, now filtering by user_id');
      const { data: userPosts, error: userError } = await supabase
        .from('threads')
        .select('id, content, created_at, board_id, is_archived, restore_count')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (userError) {
        console.error('Error fetching user-specific posts:');
        console.error('User error object:', JSON.stringify(userError, null, 2));

        if (userError.code === '42703') {
          console.warn('user_id column does not exist in threads table');
          // user_idカラムがない場合は空の結果を返す
          setUserPosts([]);
          return;
        }

        setUserPosts([]);
        return;
      }

      // データが取得できた場合、boardsとのJOINを試す
      if (userPosts && userPosts.length > 0) {
        const { data: postsWithBoards, error: joinError } = await supabase
          .from('threads')
          .select(`
            id,
            content,
            created_at,
            board_id,
            is_archived,
            restore_count,
            boards (
              name
            )
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (joinError) {
          console.warn('Error joining with boards table:');
          console.warn('Join error details:', JSON.stringify(joinError, null, 2));
          // boardsテーブルとのJOINに失敗した場合、boards情報なしで表示
          const postsWithoutBoards = userPosts.map((post) => ({
            ...post,
            boards: { name: '不明な掲示板' },
            is_archived: post.is_archived || false,
          }));
          setUserPosts(postsWithoutBoards);
        } else {
          setUserPosts((postsWithBoards || []) as unknown as UserPost[]);
        }
      } else {
        setUserPosts([]);
      }
    } catch (err) {
      console.error('Exception fetching user posts:', err);
      setUserPosts([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchConnections();
      fetchUserPosts();
    }
  }, [user, fetchUserData, fetchConnections, fetchUserPosts]);

  if (!user) {
    return (
      <div className="auth-required">
        <h2>ログインが必要です</h2>
        <p>マイページにアクセスするにはログインしてください。</p>
        <Link href="/auth/login" className="login-link">
          ログインページへ
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mypage">
      <div className="mypage-container">
        <header className="mypage-header">
          <h1>マイページ</h1>
          <div className="user-info">
            <h2>{userExtended?.display_name || user.user_metadata?.display_name}</h2>
            <p className="points">ポイント: {userExtended?.points || 0}pt</p>
          </div>
        </header>

        <nav className="tab-nav">
          <button
            type="button"
            className={`tab-button ${activeTab === 'base' ? 'active' : ''}`}
            onClick={() => setActiveTab('base')}
          >
            拠点設定
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            友達 ({connections.length})
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'dm' ? 'active' : ''}`}
            onClick={() => setActiveTab('dm')}
          >
            メッセージ
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            投稿履歴 ({userPosts.length})
          </button>
        </nav>

        <main className="tab-content">
          {activeTab === 'base' && (
            <div className="base-section">
              <h3>拠点登録</h3>
              <p>活動拠点を1つまで登録できます</p>
              {user && (
                <BaseRegistration
                  userId={user.id}
                  currentBase={
                    userExtended?.home_base_lat && userExtended?.home_base_lng
                      ? {
                          lat: userExtended.home_base_lat,
                          lng: userExtended.home_base_lng,
                          radius: userExtended.base_radius || 1000,
                        }
                      : undefined
                  }
                  onUpdate={fetchUserData}
                />
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="friends-section">
              <h3>友達一覧</h3>
              {user && userExtended && (
                <FriendsManager
                  userId={user.id}
                  userQrCode={userExtended.qr_code}
                  connections={connections}
                  onUpdate={fetchConnections}
                />
              )}
            </div>
          )}

          {activeTab === 'dm' && (
            <div className="dm-section">
              <h3>ダイレクトメッセージ</h3>
              {user && <DirectMessages userId={user.id} connections={connections} />}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="posts-section">
              <h3>投稿履歴</h3>
              {user && <UserPosts userId={user.id} posts={userPosts} onUpdate={fetchUserPosts} />}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .mypage {
          min-height: 100vh;
          background: rgb(var(--background-rgb));
          padding: 2rem 1rem;
        }

        .mypage-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .mypage-header {
          background: rgb(var(--card-bg-rgb));
          border-radius: var(--border-radius-md);
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }

        .mypage-header h1 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
          font-size: 2rem;
        }

        .user-info h2 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
          font-size: 1.25rem;
        }

        .points {
          color: rgb(230, 168, 0);
          font-weight: 600;
          margin: 0;
        }

        .tab-nav {
          display: flex;
          background: rgb(var(--card-bg-rgb));
          border-radius: var(--border-radius-md);
          padding: 0.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
          gap: 0.5rem;
        }

        .tab-button {
          flex: 1;
          padding: 1rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--border-radius);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background: rgba(230, 168, 0, 0.1);
          color: var(--text-primary);
        }

        .tab-button.active {
          background: rgb(230, 168, 0);
          color: white;
        }

        .tab-content {
          background: rgb(var(--card-bg-rgb));
          border-radius: var(--border-radius-md);
          padding: 2rem;
          border: 1px solid var(--border-color);
        }

        .tab-content h3 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }





        .auth-required, .loading {
          min-height: 50vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .login-link {
          color: rgb(230, 168, 0);
          text-decoration: none;
          font-weight: 600;
          margin-top: 1rem;
        }

        .login-link:hover {
          text-decoration: underline;
        }


        @media (max-width: 768px) {
          .mypage {
            padding: 1rem;
          }

          .mypage-header, .tab-content {
            padding: 1.5rem;
          }

          .tab-nav {
            flex-wrap: wrap;
          }

          .tab-button {
            min-width: calc(50% - 0.25rem);
          }

        }
      `}</style>
    </div>
  );
}
