'use client';

import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Connection {
  id: string;
  connected_user_id: string;
  connected_user: {
    display_name: string;
  };
  created_at: string;
}

interface FriendsManagerProps {
  userId: string;
  userQrCode: string;
  connections: Connection[];
  onUpdate: () => void;
}

export function FriendsManager({ userId, userQrCode, connections, onUpdate }: FriendsManagerProps) {
  const [showQrCode, setShowQrCode] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateQrCodeUrl = (qrCode: string) => {
    // QRコードを生成するサービス（例：qr-server.com）を使用
    const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';
    const params = new URLSearchParams({
      size: '200x200',
      data: qrCode,
      format: 'png',
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const addFriend = async () => {
    if (!qrCodeInput.trim()) {
      setError('QRコードを入力してください');
      return;
    }

    if (qrCodeInput.trim() === userQrCode) {
      setError('自分のQRコードは追加できません');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // QRコードから相手のユーザーIDを取得
      const { data: targetUser, error: userError } = await supabase
        .from('users_extended')
        .select('id, display_name')
        .eq('qr_code', qrCodeInput.trim())
        .single();

      if (userError) {
        console.error('QRコードユーザー検索エラー:', userError);
        console.error('Full error object:', JSON.stringify(userError, null, 2));

        if (userError.code === '42P01' || userError.message?.includes('does not exist')) {
          throw new Error(
            'ユーザー管理機能がまだ準備中です。データベースのセットアップが必要です。'
          );
        }
        throw new Error('有効なQRコードではありません');
      }

      if (!targetUser) {
        throw new Error('該当するユーザーが見つかりません');
      }

      // 既に友達かチェック
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', userId)
        .eq('connected_user_id', targetUser.id)
        .single();

      if (existingConnection) {
        throw new Error('既に友達登録済みです');
      }

      // 双方向で友達関係を作成
      const connections_to_insert = [
        {
          user_id: userId,
          connected_user_id: targetUser.id,
        },
        {
          user_id: targetUser.id,
          connected_user_id: userId,
        },
      ];

      const { error: insertError } = await supabase
        .from('connections')
        .insert(connections_to_insert);

      if (insertError) {
        console.error('友達関係作成エラー:', insertError);
        console.error('Full error object:', JSON.stringify(insertError, null, 2));

        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          throw new Error('友達管理機能がまだ準備中です。データベースのセットアップが必要です。');
        }
        throw insertError;
      }

      setSuccess(`${targetUser.display_name}さんを友達に追加しました！`);
      setQrCodeInput('');
      setShowAddFriend(false);
      onUpdate();
    } catch (err) {
      console.error('友達追加エラー:', err);
      setError((err as Error).message || '友達の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (connectionId: string, friendName: string) => {
    if (!confirm(`${friendName}さんを友達から削除しますか？`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 双方向で削除
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) {
        throw new Error('友達関係が見つかりません');
      }

      // 自分からの関係を削除
      const { error: deleteError1 } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', userId)
        .eq('connected_user_id', connection.connected_user_id);

      if (deleteError1) {
        throw deleteError1;
      }

      // 相手からの関係を削除
      const { error: deleteError2 } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', connection.connected_user_id)
        .eq('connected_user_id', userId);

      if (deleteError2) {
        throw deleteError2;
      }

      setSuccess(`${friendName}さんを友達から削除しました`);
      onUpdate();
    } catch (err) {
      console.error('友達削除エラー:', err);
      setError((err as Error).message || '友達の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {error && <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200 text-sm">{error}</div>}

      {success && <div className="bg-green-50 text-green-700 p-4 rounded border border-green-200 text-sm">{success}</div>}

      <div className="bg-white p-6 rounded-lg">
        <h4 className="m-0 mb-4 text-gray-800">あなたのQRコード</h4>
        <div>
          <div className="flex items-center gap-4 mb-4 flex-col md:flex-row">
            <code className="bg-gray-100 p-2 rounded font-mono text-sm border border-gray-300 flex-1">{userQrCode}</code>
            <button 
              type="button" 
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-none px-4 py-2 rounded cursor-pointer font-medium transition-colors"
              onClick={() => setShowQrCode(!showQrCode)}
            >
              {showQrCode ? 'QRコードを隠す' : 'QRコードを表示'}
            </button>
          </div>

          {showQrCode && (
            <div className="text-center p-4 bg-white rounded-lg border border-gray-300">
              <Image
                src={generateQrCodeUrl(userQrCode)}
                alt="あなたのQRコード"
                width={200}
                height={200}
                className="mx-auto mb-4 border border-gray-300"
              />
              <p className="m-0 text-gray-600 text-sm">
                このQRコードを友達に見せて、友達登録してもらいましょう
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg">
        <h4 className="m-0 mb-4 text-gray-800">友達を追加</h4>
        <button 
          type="button" 
          className="bg-yellow-500 hover:bg-yellow-600 text-white border-none px-4 py-2 rounded cursor-pointer font-medium transition-colors"
          onClick={() => setShowAddFriend(!showAddFriend)}
        >
          {showAddFriend ? 'キャンセル' : '友達のQRコードを入力'}
        </button>

        {showAddFriend && (
          <div className="mt-4 p-4 bg-white rounded border border-gray-300">
            <div className="mb-4">
              <label htmlFor="qr-input" className="block mb-2 font-semibold text-gray-800">友達のQRコード:</label>
              <input
                id="qr-input"
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="例: stabo_12345678_abc123"
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </div>
            <button
              type="button"
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white border-none px-6 py-3 rounded cursor-pointer font-semibold transition-colors"
              onClick={addFriend}
              disabled={loading || !qrCodeInput.trim()}
            >
              {loading ? '追加中...' : '友達に追加'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg">
        <h4 className="m-0 mb-4 text-gray-800">友達一覧 ({connections.length}人)</h4>
        {connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <div key={connection.id} className="bg-white p-4 rounded border border-gray-300 flex flex-col md:flex-row justify-between items-center">
                <div className="flex-1">
                  <h5 className="m-0 mb-1 text-gray-800">{connection.connected_user.display_name}</h5>
                  <p className="m-0 text-gray-600 text-xs">
                    {new Date(connection.created_at).toLocaleDateString('ja-JP')} 友達登録
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <button 
                    type="button" 
                    className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-2 rounded cursor-pointer text-xs font-medium transition-colors"
                  >
                    メッセージ
                  </button>
                  <button
                    type="button"
                    className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white border-none px-3 py-2 rounded cursor-pointer text-xs font-medium transition-colors"
                    onClick={() =>
                      removeFriend(connection.id, connection.connected_user.display_name)
                    }
                    disabled={loading}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 italic p-8">まだ友達がいません。QRコードを交換して友達を追加しましょう！</p>
        )}
      </div>
    </div>
  );
}
