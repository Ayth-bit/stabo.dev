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

interface UserThread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  restored_at: string | null;
  restore_count: number;
  is_expired: boolean;
  can_restore: boolean;
  boards: {
    name: string;
  } | null;
}

export default function MyPage() {
  const { user } = useAuth();
  const [userExtended, setUserExtended] = useState<UserExtended | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [activeThreads, setActiveThreads] = useState<UserThread[]>([]);
  const [expiredThreads, setExpiredThreads] = useState<UserThread[]>([]);
  const [activeTab, setActiveTab] = useState<'base' | 'friends' | 'posts' | 'threads' | 'dm'>('base');
  const [selectedChatFriend, setSelectedChatFriend] = useState<{id: string, name: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching user data for:', user.id);
      const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Query response - data:', data, 'error:', error);

      if (error) {
        if (error.code === 'PGRST116') {
          // ユーザーレコードが存在しない場合は作成
          console.log('Creating new user record...');
          const displayName = user.user_metadata?.display_name || user.email || 'ユーザー';
          const qrCode = `qr_${user.id.replace(/-/g, '_')}_${Date.now()}`;
          
          const { data: newUser, error: createError } = await supabase
            .from('users_extended')
            .insert({
              id: user.id,
              display_name: displayName,
              qr_code: qrCode,
              points: 0,
              is_creator: false,
              base_radius: 1000,
            })
            .select()
            .single();

          if (createError) {
            console.error('Create user error:', createError);
            console.error('Full error object:', JSON.stringify(createError, null, 2));
            console.error('Error details:', {
              message: createError.message || 'No message',
              details: createError.details || 'No details',
              hint: createError.hint || 'No hint',
              code: createError.code || 'No code',
            });
            return;
          }

          console.log('New user created:', newUser);
          setUserExtended(newUser);
        } else {
          console.error('Fetch user error:', error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
        }
        return;
      }

      console.log('User data found:', data);
      setUserExtended(data);
    } catch (err) {
      console.error('Exception fetching user data:', err);
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
          const { data: userData, error: userError } = await supabase
            .from('users_extended')
            .select('display_name')
            .eq('id', conn.connected_user_id)
            .single();

          if (userError) {
            console.warn('ユーザー情報取得エラー:', userError);
            // users_extendedテーブルが存在しない場合のフォールバック
            formattedConnections.push({
              id: conn.id,
              connected_user_id: conn.connected_user_id,
              created_at: conn.created_at,
              connected_user: {
                display_name: 'ユーザー',
              },
            });
          } else {
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
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error fetching user posts:');
        console.error('Full error object:', JSON.stringify(userError, null, 2));
        setUserPosts([]);
        return;
      }

      console.log('User posts:', userPosts);

      // ボード名を取得
      const postsWithBoards = [];
      if (userPosts) {
        for (const post of userPosts) {
          const { data: boardData } = await supabase
            .from('boards')
            .select('name')
            .eq('id', post.board_id)
            .single();

          postsWithBoards.push({
            ...post,
            boards: {
              name: boardData?.name || '不明',
            },
          });
        }
      }

      setUserPosts(postsWithBoards);
    } catch (err) {
      // テーブルやカラムが存在しない場合のフォールバック
      if (
        err instanceof Error && 
        (err.message.includes('does not exist') || err.message.includes('42703'))
      ) {
        console.warn('threads table structure issue, setting empty posts');
        setUserPosts([]);
      } else {
        console.error('Exception fetching user posts:', err);
        setUserPosts([]);
      }
    }
  }, [user]);

  const fetchUserThreads = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}/threads?include_expired=true`);
      const result = await response.json();

      if (response.ok) {
        setActiveThreads(result.active_threads || []);
        setExpiredThreads(result.expired_threads || []);
      } else {
        console.error('Failed to fetch user threads:', result.error);
        setActiveThreads([]);
        setExpiredThreads([]);
      }
    } catch (err) {
      console.error('Exception fetching user threads:', err);
      setActiveThreads([]);
      setExpiredThreads([]);
    }
  }, [user]);

  const handleRestoreThread = async (threadId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/threads/${threadId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();

      if (response.ok) {
        // スレッドリストを再取得
        await fetchUserThreads();
      } else {
        console.error('Failed to restore thread:', result.error);
        alert(`復元に失敗しました: ${result.error}`);
      }
    } catch (err) {
      console.error('Exception restoring thread:', err);
      alert('復元中にエラーが発生しました');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchConnections();
      fetchUserPosts();
      fetchUserThreads();
    }
  }, [user, fetchUserData, fetchConnections, fetchUserPosts, fetchUserThreads]);

  const handleStartChat = useCallback((friendId: string, friendName: string) => {
    setSelectedChatFriend({ id: friendId, name: friendName });
    setActiveTab('dm');
  }, []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h2>
          <p className="text-gray-600 mb-8">マイページにアクセスするにはログインしてください。</p>
          <Link 
            href="/auth/login" 
            className="inline-block px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-md"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-12">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">マイページ</h1>
            <h2 className="text-xl text-gray-600">{userExtended?.display_name || user.user_metadata?.display_name}</h2>
          </div>
          <div className="text-right">
            <div className="bg-yellow-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">ポイント</p>
              <p className="text-2xl font-bold text-yellow-600">{userExtended?.points || 0}pt</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
        <div className="flex">
          <button
            type="button"
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === 'base' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('base')}
          >
            <div className="text-sm">拠点設定</div>
          </button>
          <button
            type="button"
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === 'friends' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('friends')}
          >
            <div className="text-sm">友達</div>
            <div className="text-xs mt-1">({connections.length})</div>
          </button>
          <button
            type="button"
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === 'dm' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('dm')}
          >
            <div className="text-sm">メッセージ</div>
          </button>
          <button
            type="button"
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === 'posts' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            <div className="text-sm">投稿履歴</div>
            <div className="text-xs mt-1">({userPosts.length})</div>
          </button>
          <button
            type="button"
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === 'threads' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('threads')}
          >
            <div className="text-sm">スレッド管理</div>
            <div className="text-xs mt-1">有効({activeThreads.length}) 期限切れ({expiredThreads.length})</div>
          </button>
        </div>
      </nav>

      <main className="bg-white rounded-lg shadow-md p-8">
        {activeTab === 'base' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">拠点登録</h3>
              <p className="text-gray-600">活動拠点を1つまで登録できます</p>
            </div>
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
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">友達一覧</h3>
              <p className="text-gray-600">QRコードを交換して友達を追加しましょう</p>
            </div>
            {user && userExtended && (
              <FriendsManager
                userId={user.id}
                userQrCode={userExtended.qr_code}
                connections={connections}
                onUpdate={fetchConnections}
                onStartChat={handleStartChat}
              />
            )}
          </div>
        )}

        {activeTab === 'dm' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">ダイレクトメッセージ</h3>
              <p className="text-gray-600">友達とリアルタイムでメッセージのやり取りができます</p>
            </div>
            {user && (
              <DirectMessages 
                userId={user.id} 
                connections={connections} 
                autoStartChatWith={selectedChatFriend}
              />
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">投稿履歴</h3>
              <p className="text-gray-600">あなたの投稿の履歴と復元機能</p>
            </div>
              {user && <UserPosts userId={user.id} posts={userPosts} onUpdate={fetchUserPosts} />}
            </div>
          )}

        {activeTab === 'threads' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">スレッド管理</h3>
              <p className="text-gray-600">作成したスレッドの管理と期限切れスレッドの復元</p>
            </div>

            {/* 有効なスレッド一覧 */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-700 mb-4">有効なスレッド ({activeThreads.length}件)</h4>
              {activeThreads.length > 0 ? (
                <div className="space-y-4">
                  {activeThreads.map((thread) => (
                    <div key={thread.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 mb-2">{thread.title}</h5>
                          <p className="text-gray-600 text-sm mb-2">{thread.content.substring(0, 100)}...</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>作成: {new Date(thread.created_at).toLocaleDateString()}</span>
                            <span>期限: {thread.expires_at ? new Date(thread.expires_at).toLocaleDateString() : '無期限'}</span>
                            <span>ボード: {thread.boards?.name || '不明'}</span>
                          </div>
                        </div>
                        <Link 
                          href={`/thread/${thread.id}`}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          表示
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">有効なスレッドはありません</p>
              )}
            </div>

            {/* 期限切れスレッド一覧 */}
            <div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4">期限切れスレッド ({expiredThreads.length}件)</h4>
              {expiredThreads.length > 0 ? (
                <div className="space-y-4">
                  {expiredThreads.map((thread) => (
                    <div key={thread.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 mb-2">{thread.title}</h5>
                          <p className="text-gray-600 text-sm mb-2">{thread.content.substring(0, 100)}...</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>作成: {new Date(thread.created_at).toLocaleDateString()}</span>
                            <span className="text-red-600">期限切れ: {thread.expires_at ? new Date(thread.expires_at).toLocaleDateString() : ''}</span>
                            <span>ボード: {thread.boards?.name || '不明'}</span>
                            {thread.restore_count > 0 && (
                              <span className="text-orange-600">復元回数: {thread.restore_count}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreThread(thread.id)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          復元
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">期限切れスレッドはありません</p>
              )}
            </div>
          </div>
        )}
        </main>
      </div>
    );
}