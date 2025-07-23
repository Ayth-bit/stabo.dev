'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  board_id: string;
  is_archived: boolean;
  expires_at?: string;
  boards: {
    name: string;
  };
}

interface UserPostsProps {
  userId: string;
  posts: UserPost[];
  onUpdate: () => void;
}

export function UserPosts({ userId, posts, onUpdate }: UserPostsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const restorePost = async (postId: string) => {
    if (!confirm('この投稿を復元しますか？復元後は再び72時間有効になります。')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 投稿を復元（アーカイブ解除し、有効期限を72時間後に設定）
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 72);

      const { error: updateError } = await supabase
        .from('threads')
        .update({
          is_archived: false,
          expires_at: newExpiresAt.toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId); // セキュリティのため自分の投稿のみ

      if (updateError) {
        throw updateError;
      }

      setSuccess('投稿を復元しました！72時間後に再び非表示になります。');
      onUpdate();
    } catch (err) {
      console.error('投稿復元エラー:', err);
      setError('投稿の復元に失敗しました: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('この投稿を完全に削除しますか？この操作は取り消せません。')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 投稿履歴に移動してから削除
      const post = posts.find(p => p.id === postId);
      if (post) {
        // 履歴テーブルに移動
        const { error: historyError } = await supabase
          .from('thread_history')
          .insert({
            thread_id: post.id,
            board_id: post.board_id,
            user_id: userId,
            content: post.content,
            created_at: post.created_at,
            archive_reason: 'user_deleted'
          });

        if (historyError) {
          console.warn('履歴保存エラー:', historyError);
        }
      }

      // 投稿を削除
      const { error: deleteError } = await supabase
        .from('threads')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId); // セキュリティのため自分の投稿のみ

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('投稿を削除しました');
      onUpdate();
    } catch (err) {
      console.error('投稿削除エラー:', err);
      setError('投稿の削除に失敗しました: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getPostStatus = (post: UserPost) => {
    if (post.is_archived) {
      return { text: '非表示', color: '#ffc107', bgColor: '#fff3cd' };
    }
    
    if (post.expires_at) {
      const expiresAt = new Date(post.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        return { text: '期限切れ', color: '#dc3545', bgColor: '#f8d7da' };
      }
      
      const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      if (hoursLeft <= 24) {
        return { text: `${hoursLeft}時間後に非表示`, color: '#fd7e14', bgColor: '#fff3cd' };
      }
    }
    
    return { text: '表示中', color: '#28a745', bgColor: '#d4edda' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activePosts = posts.filter(post => !post.is_archived);
  const archivedPosts = posts.filter(post => post.is_archived);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-200">
          {success}
        </div>
      )}

      <div className="flex gap-4 bg-white p-6 rounded-lg md:flex-row flex-col">
        <div className="flex-1 text-center flex flex-col gap-1 md:gap-1 md:flex-col">
          <span className="text-3xl font-bold text-yellow-500 md:text-2xl">{activePosts.length}</span>
          <span className="text-sm text-gray-600">表示中の投稿</span>
        </div>
        <div className="flex-1 text-center flex flex-col gap-1 md:gap-1 md:flex-col">
          <span className="text-3xl font-bold text-yellow-500 md:text-2xl">{archivedPosts.length}</span>
          <span className="text-sm text-gray-600">非表示の投稿</span>
        </div>
        <div className="flex-1 text-center flex flex-col gap-1 md:gap-1 md:flex-col">
          <span className="text-3xl font-bold text-yellow-500 md:text-2xl">{posts.length}</span>
          <span className="text-sm text-gray-600">総投稿数</span>
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="flex flex-col gap-8">
          {activePosts.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="m-0 text-gray-800 pb-2 border-b-2 border-gray-200">表示中の投稿 ({activePosts.length})</h4>
              <div className="flex flex-col gap-4">
                {activePosts.map((post) => {
                  const status = getPostStatus(post);
                  return (
                    <div key={post.id} className="bg-white p-6 rounded-lg border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h5 className="m-0 mb-2 text-gray-800 text-base">{post.boards?.name || '不明な掲示板'}</h5>
                          <span 
                            className="text-xs px-2 py-1 rounded font-semibold"
                            style={{ 
                              color: status.color,
                              backgroundColor: status.bgColor 
                            }}
                          >
                            {status.text}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer text-sm font-medium transition-all hover:bg-red-600 hover:-translate-y-0.5 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                            onClick={() => deletePost(post.id)}
                            disabled={loading}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      <p className="m-0 mb-4 text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                      <div className="flex justify-between items-center flex-wrap gap-2 border-t border-gray-200 pt-4">
                        <span className="text-gray-600 text-sm">
                          投稿日時: {formatDate(post.created_at)}
                        </span>
                        {post.expires_at && (
                          <span className="text-gray-600 text-sm font-medium">
                            期限: {formatDate(post.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {archivedPosts.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="m-0 text-gray-800 pb-2 border-b-2 border-gray-200">非表示の投稿 ({archivedPosts.length})</h4>
              <div className="flex flex-col gap-4">
                {archivedPosts.map((post) => {
                  const status = getPostStatus(post);
                  return (
                    <div key={post.id} className="bg-white p-6 rounded-lg border-l-4 border-yellow-500 opacity-80">
                      <div className="flex justify-between items-start mb-4 md:flex-row flex-col gap-4">
                        <div className="flex-1">
                          <h5 className="m-0 mb-2 text-gray-800 text-base">{post.boards?.name || '不明な掲示板'}</h5>
                          <span 
                            className="text-xs px-2 py-1 rounded font-semibold"
                            style={{ 
                              color: status.color,
                              backgroundColor: status.bgColor 
                            }}
                          >
                            {status.text}
                          </span>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button 
                            className="bg-yellow-500 text-gray-800 border-none px-4 py-2 rounded cursor-pointer text-sm font-medium transition-all hover:bg-yellow-600 hover:-translate-y-0.5 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none flex-1 md:flex-none"
                            onClick={() => restorePost(post.id)}
                            disabled={loading}
                          >
                            {loading ? '復元中...' : '復元'}
                          </button>
                          <button 
                            className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer text-sm font-medium transition-all hover:bg-red-600 hover:-translate-y-0.5 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none flex-1 md:flex-none"
                            onClick={() => deletePost(post.id)}
                            disabled={loading}
                          >
                            完全削除
                          </button>
                        </div>
                      </div>
                      <p className="m-0 mb-4 text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                      <div className="flex justify-between items-start border-t border-gray-200 pt-4 md:flex-row flex-col gap-2">
                        <span className="text-gray-600 text-sm">
                          投稿日時: {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 italic py-12 px-4 bg-white rounded-lg">
          <p className="my-2">まだ投稿がありません</p>
          <p className="my-2">掲示板で投稿してみましょう！</p>
        </div>
      )}

    </div>
  );
}