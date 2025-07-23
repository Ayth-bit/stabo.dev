'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

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
      format: 'png'
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
          throw new Error('ユーザー管理機能がまだ準備中です。データベースのセットアップが必要です。');
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
          connected_user_id: targetUser.id
        },
        {
          user_id: targetUser.id,
          connected_user_id: userId
        }
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
      const connection = connections.find(c => c.id === connectionId);
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
    <div className="friends-manager">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="qr-section">
        <h4>あなたのQRコード</h4>
        <div className="qr-actions">
          <div className="qr-code-display">
            <code className="qr-text">{userQrCode}</code>
            <button 
              className="show-qr-button"
              onClick={() => setShowQrCode(!showQrCode)}
            >
              {showQrCode ? 'QRコードを隠す' : 'QRコードを表示'}
            </button>
          </div>
          
          {showQrCode && (
            <div className="qr-code-image">
              <Image 
                src={generateQrCodeUrl(userQrCode)} 
                alt="あなたのQRコード"
                width={200}
                height={200}
              />
              <p className="qr-instruction">
                このQRコードを友達に見せて、友達登録してもらいましょう
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="add-friend-section">
        <h4>友達を追加</h4>
        <button 
          className="add-friend-button"
          onClick={() => setShowAddFriend(!showAddFriend)}
        >
          {showAddFriend ? 'キャンセル' : '友達のQRコードを入力'}
        </button>

        {showAddFriend && (
          <div className="add-friend-form">
            <div className="input-group">
              <label htmlFor="qr-input">友達のQRコード:</label>
              <input
                id="qr-input"
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="例: stabo_12345678_abc123"
                disabled={loading}
              />
            </div>
            <button 
              className="confirm-add-button"
              onClick={addFriend}
              disabled={loading || !qrCodeInput.trim()}
            >
              {loading ? '追加中...' : '友達に追加'}
            </button>
          </div>
        )}
      </div>

      <div className="friends-list">
        <h4>友達一覧 ({connections.length}人)</h4>
        {connections.length > 0 ? (
          <div className="friends-grid">
            {connections.map((connection) => (
              <div key={connection.id} className="friend-card">
                <div className="friend-info">
                  <h5>{connection.connected_user.display_name}</h5>
                  <p className="friend-date">
                    {new Date(connection.created_at).toLocaleDateString('ja-JP')} 友達登録
                  </p>
                </div>
                <div className="friend-actions">
                  <button className="message-button">
                    メッセージ
                  </button>
                  <button 
                    className="remove-button"
                    onClick={() => removeFriend(connection.id, connection.connected_user.display_name)}
                    disabled={loading}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-friends">まだ友達がいません。QRコードを交換して友達を追加しましょう！</p>
        )}
      </div>

      <style jsx>{`
        .friends-manager {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          border: 1px solid #fecaca;
        }

        .success-message {
          background: #f0f9f0;
          color: #166534;
          padding: 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          border: 1px solid #bbf7d0;
        }

        .qr-section, .add-friend-section, .friends-list {
          background: rgb(var(--background-rgb));
          padding: 1.5rem;
          border-radius: 8px;
        }

        .qr-section h4, .add-friend-section h4, .friends-list h4 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .qr-code-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .qr-text {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
          border: 1px solid var(--border-color);
          flex: 1;
        }

        .show-qr-button, .add-friend-button {
          background: rgb(230, 168, 0);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .show-qr-button:hover, .add-friend-button:hover {
          background: rgba(230, 168, 0, 0.9);
        }

        .qr-code-image {
          text-align: center;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .qr-code-image img {
          display: block;
          margin: 0 auto 1rem auto;
          border: 1px solid #ddd;
        }

        .qr-instruction {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .add-friend-form {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .input-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .input-group input:focus {
          outline: none;
          border-color: rgb(230, 168, 0);
          box-shadow: 0 0 0 2px rgba(230, 168, 0, 0.2);
        }

        .confirm-add-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .confirm-add-button:hover:not(:disabled) {
          background: #218838;
        }

        .confirm-add-button:disabled {
          background: var(--border-color);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }

        .friends-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .friend-card {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .friend-info h5 {
          margin: 0 0 0.25rem 0;
          color: var(--text-primary);
        }

        .friend-date {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .friend-actions {
          display: flex;
          gap: 0.5rem;
        }

        .message-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .message-button:hover {
          background: #0056b3;
        }

        .remove-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .remove-button:hover:not(:disabled) {
          background: #c82333;
        }

        .remove-button:disabled {
          background: var(--border-color);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }

        .no-friends {
          text-align: center;
          color: var(--text-secondary);
          font-style: italic;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .qr-code-display {
            flex-direction: column;
            align-items: stretch;
          }

          .friends-grid {
            grid-template-columns: 1fr;
          }

          .friend-card {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .friend-actions {
            justify-content: stretch;
          }

          .message-button, .remove-button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}