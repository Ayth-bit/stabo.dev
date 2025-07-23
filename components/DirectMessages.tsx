'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface Connection {
  id: string;
  connected_user_id: string;
  connected_user: {
    display_name: string;
  };
}

interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  other_user: {
    id: string;
    display_name: string;
  };
}

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender: {
    display_name: string;
  };
}

interface DirectMessagesProps {
  userId: string;
  connections: Connection[];
}

export function DirectMessages({ userId, connections }: DirectMessagesProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('チャット一覧取得エラー:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // chatsテーブルが存在しない場合のフォールバック
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('chats table does not exist - setting empty chats');
          setChats([]);
          return;
        }
        throw error;
      }

      // 相手のユーザー情報を付加
      const chatsWithUserInfo: Chat[] = [];
      for (const chat of data || []) {
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        
        const { data: userData, error: userError } = await supabase
          .from('users_extended')
          .select('id, display_name')
          .eq('id', otherUserId)
          .single();

        if (userError) {
          console.warn('ユーザー情報取得エラー:', userError);
          // users_extendedテーブルが存在しない場合のフォールバック
          chatsWithUserInfo.push({
            ...chat,
            other_user: {
              id: otherUserId,
              display_name: '不明なユーザー'
            }
          });
        } else if (userData) {
          chatsWithUserInfo.push({
            ...chat,
            other_user: userData
          });
        }
      }

      setChats(chatsWithUserInfo);
    } catch (err) {
      console.error('チャット一覧取得エラー:', err);
      setError('チャット一覧の取得に失敗しました');
    }
  }, [userId]);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message,
          created_at,
          is_read
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('メッセージ取得エラー:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // chat_messagesテーブルが存在しない場合のフォールバック
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('chat_messages table does not exist - setting empty messages');
          setMessages([]);
          return;
        }
        throw error;
      }

      // 送信者情報を付加
      const messagesWithSender = (data || []).map(msg => ({
        ...msg,
        sender: {
          display_name: msg.sender_id === userId ? 'あなた' : selectedChat?.other_user.display_name || '不明'
        }
      }));

      setMessages(messagesWithSender);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('メッセージ取得エラー:', err);
      setError('メッセージの取得に失敗しました');
    }
  }, [userId, selectedChat]);

  const markMessagesAsRead = useCallback(async (chatId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('is_read', false);
    } catch (err) {
      console.error('既読更新エラー:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      markMessagesAsRead(selectedChat.id);
    }
  }, [selectedChat, fetchMessages, markMessagesAsRead]);

  useEffect(() => {
    // メッセージのリアルタイム購読
    if (selectedChat) {
      const subscription = supabase
        .channel(`chat_messages:${selectedChat.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_id=eq.${selectedChat.id}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, {
              ...newMessage,
              sender: {
                display_name: newMessage.sender_id === userId ? 'あなた' : selectedChat.other_user.display_name
              }
            }]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedChat, userId]);

  const createChat = async (friendId: string) => {
    try {
      // 既存のチャットをチェック
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
        .single();

      if (existingChat) {
        // 既存のチャットを選択
        const friend = connections.find(c => c.connected_user_id === friendId);
        if (friend) {
          setSelectedChat({
            id: existingChat.id,
            user1_id: userId,
            user2_id: friendId,
            last_message: null,
            last_message_at: null,
            other_user: {
              id: friendId,
              display_name: friend.connected_user.display_name
            }
          });
        }
        return;
      }

      // 新しいチャットを作成
      const user1_id = userId < friendId ? userId : friendId;
      const user2_id = userId < friendId ? friendId : userId;

      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user1_id,
          user2_id
        })
        .select()
        .single();

      if (createError) throw createError;

      const friend = connections.find(c => c.connected_user_id === friendId);
      if (friend && newChat) {
        setSelectedChat({
          ...newChat,
          other_user: {
            id: friendId,
            display_name: friend.connected_user.display_name
          }
        });
      }

      fetchChats();
    } catch (err) {
      console.error('チャット作成エラー:', err);
      setError('チャットの作成に失敗しました');
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: userId,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      fetchChats(); // チャット一覧の最終メッセージを更新
    } catch (err) {
      console.error('メッセージ送信エラー:', err);
      setError('メッセージの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="direct-messages">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dm-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h4>メッセージ</h4>
          </div>
          
          <div className="friends-to-chat">
            <h5>友達にメッセージを送る</h5>
            {connections.length > 0 ? (
              <div className="friends-list">
                {connections.map((friend) => (
                  <button
                    key={friend.id}
                    className="friend-chat-button"
                    onClick={() => createChat(friend.connected_user_id)}
                  >
                    {friend.connected_user.display_name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="no-friends">友達がいません</p>
            )}
          </div>

          <div className="chat-list">
            <h5>チャット履歴</h5>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-info">
                    <span className="chat-name">{chat.other_user.display_name}</span>
                    {chat.last_message && (
                      <span className="last-message">{chat.last_message}</span>
                    )}
                  </div>
                  {chat.last_message_at && (
                    <span className="chat-time">
                      {new Date(chat.last_message_at).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="no-chats">チャット履歴がありません</p>
            )}
          </div>
        </div>

        <div className="chat-main">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <h4>{selectedChat.other_user.display_name}</h4>
              </div>
              
              <div className="messages-container">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender_id === userId ? 'own' : 'other'}`}
                  >
                    <div className="message-content">
                      {message.message}
                    </div>
                    <div className="message-info">
                      <span className="message-time">
                        {new Date(message.created_at).toLocaleString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  disabled={loading}
                  rows={3}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="send-button"
                >
                  {loading ? '送信中...' : '送信'}
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>チャットを選択してください</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .direct-messages {
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          border: 1px solid #fecaca;
        }

        .dm-container {
          display: flex;
          height: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .chat-sidebar {
          width: 300px;
          background: #f8f9fa;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h4 {
          margin: 0;
          color: var(--text-primary);
        }

        .friends-to-chat, .chat-list {
          padding: 1rem;
        }

        .friends-to-chat h5, .chat-list h5 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .friends-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .friend-chat-button {
          background: none;
          border: 1px solid var(--border-color);
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          font-size: 0.875rem;
          color: var(--text-primary);
          transition: all 0.2s;
        }

        .friend-chat-button:hover {
          background: white;
          border-color: rgb(230, 168, 0);
        }

        .chat-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.75rem;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          margin-bottom: 0.25rem;
        }

        .chat-item:hover {
          background: rgba(230, 168, 0, 0.1);
        }

        .chat-item.active {
          background: rgb(230, 168, 0);
          color: white;
        }

        .chat-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .chat-name {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .last-message {
          font-size: 0.75rem;
          opacity: 0.8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .chat-time {
          font-size: 0.75rem;
          opacity: 0.6;
          white-space: nowrap;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          background: #f8f9fa;
        }

        .chat-header h4 {
          margin: 0;
          color: var(--text-primary);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 70%;
        }

        .message.own {
          align-self: flex-end;
          align-items: flex-end;
        }

        .message.other {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-content {
          padding: 0.75rem;
          border-radius: 12px;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .message.own .message-content {
          background: rgb(230, 168, 0);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.other .message-content {
          background: #e9ecef;
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }

        .message-info {
          padding: 0.25rem 0.5rem;
        }

        .message-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .message-input {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 0.5rem;
        }

        .message-input textarea {
          flex: 1;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.75rem;
          resize: none;
          font-family: inherit;
        }

        .message-input textarea:focus {
          outline: none;
          border-color: rgb(230, 168, 0);
          box-shadow: 0 0 0 2px rgba(230, 168, 0, 0.2);
        }

        .send-button {
          background: rgb(230, 168, 0);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: rgba(230, 168, 0, 0.9);
        }

        .send-button:disabled {
          background: var(--border-color);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }

        .no-chat-selected {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .no-chat-selected p {
          color: var(--text-secondary);
          font-style: italic;
        }

        .no-friends, .no-chats {
          color: var(--text-secondary);
          font-style: italic;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }

        @media (max-width: 768px) {
          .dm-container {
            flex-direction: column;
            height: auto;
          }

          .chat-sidebar {
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
          }

          .chat-main {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
}