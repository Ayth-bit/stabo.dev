'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

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
  autoStartChatWith?: {id: string, name: string} | null;
}

export function DirectMessages({ userId, connections, autoStartChatWith }: DirectMessagesProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
              display_name: '不明なユーザー',
            },
          });
        } else if (userData) {
          chatsWithUserInfo.push({
            ...chat,
            other_user: userData,
          });
        }
      }

      setChats(chatsWithUserInfo);
    } catch (err) {
      console.error('チャット一覧取得エラー:', err);
      setError('チャット一覧の取得に失敗しました');
    }
  }, [userId]);

  const fetchMessages = useCallback(
    async (chatId: string) => {
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
        const messagesWithSender = (data || []).map((msg) => ({
          ...msg,
          sender: {
            display_name:
              msg.sender_id === userId ? 'あなた' : selectedChat?.other_user.display_name || '不明',
          },
        }));

        setMessages(messagesWithSender);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('メッセージ取得エラー:', err);
        setError('メッセージの取得に失敗しました');
      }
    },
    [userId, selectedChat, scrollToBottom]
  );

  const markMessagesAsRead = useCallback(
    async (chatId: string) => {
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
    },
    [userId]
  );

  const createChat = useCallback(async (friendId: string) => {
    console.log('Creating chat with friend:', friendId);
    console.log('Current userId:', userId);
    
    try {
      // 現在のユーザー認証状態を確認
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current auth user:', user, 'Auth error:', authError);
      
      if (!user || user.id !== userId) {
        console.error('Authentication mismatch:', { authUserId: user?.id, componentUserId: userId });
        throw new Error('認証エラー: ユーザー情報が一致しません');
      }
      
      // 既存のチャットをチェック
      console.log('Checking for existing chat...');
      const { data: existingChat, error: checkError } = await supabase
        .from('chats')
        .select('id')
        .or(
          `and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`
        )
        .single();

      console.log('Existing chat check result:', { existingChat, checkError });

      if (existingChat) {
        console.log('Found existing chat:', existingChat.id);
        // 既存のチャットを選択
        const friend = connections.find((c) => c.connected_user_id === friendId);
        if (friend) {
          console.log('Setting selected chat...');
          setSelectedChat({
            id: existingChat.id,
            user1_id: userId,
            user2_id: friendId,
            last_message: null,
            last_message_at: null,
            other_user: {
              id: friendId,
              display_name: friend.connected_user.display_name,
            },
          });
        }
        return;
      }

      // 新しいチャットを作成
      console.log('Creating new chat...');
      const user1_id = userId < friendId ? userId : friendId;
      const user2_id = userId < friendId ? friendId : userId;
      console.log('Chat participants:', { user1_id, user2_id, currentAuthUserId: user.id });

      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user1_id,
          user2_id,
        })
        .select()
        .single();

      console.log('New chat creation result:', { newChat, createError });

      if (createError) throw createError;

      const friend = connections.find((c) => c.connected_user_id === friendId);
      console.log('Found friend for new chat:', friend);
      if (friend && newChat) {
        console.log('Setting new chat as selected...');
        setSelectedChat({
          ...newChat,
          other_user: {
            id: friendId,
            display_name: friend.connected_user.display_name,
          },
        });
      }

      fetchChats();
    } catch (err) {
      console.error('チャット作成エラー:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      setError(`チャットの作成に失敗しました: ${(err as Error).message}`);
    }
  }, [userId, connections, fetchChats]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // 自動チャット開始機能
  useEffect(() => {
    if (autoStartChatWith && connections.length > 0) {
      createChat(autoStartChatWith.id);
    }
  }, [autoStartChatWith, connections, createChat]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      markMessagesAsRead(selectedChat.id);
    }
  }, [selectedChat, fetchMessages, markMessagesAsRead]);

  useEffect(() => {
    // メッセージのリアルタイム購読
    if (selectedChat) {
      console.log('Setting up realtime subscription for chat:', selectedChat.id);
      
      let subscription: ReturnType<typeof supabase.channel> | null = null;
      let intervalId: NodeJS.Timeout | null = null;
      
      try {
        subscription = supabase
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
              console.log('Realtime message received:', payload);
              const newMessage = payload.new as ChatMessage;
              setMessages((prev) => [
                ...prev,
                {
                  ...newMessage,
                  sender: {
                    display_name:
                      newMessage.sender_id === userId
                        ? 'あなた'
                        : selectedChat.other_user.display_name,
                  },
                },
              ]);
              scrollToBottom();
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status);
            
            // If subscription fails, use polling
            if (status === 'CHANNEL_ERROR') {
              console.warn('Realtime subscription failed, using polling fallback');
              if (!intervalId) {
                intervalId = setInterval(() => {
                  fetchMessages(selectedChat.id);
                }, 3000);
              }
            }
          });

        // Always set up polling as a backup
        intervalId = setInterval(() => {
          fetchMessages(selectedChat.id);
        }, 5000); // 5秒ごと

      } catch (error) {
        console.warn('Realtime setup failed, using polling only:', error);
        intervalId = setInterval(() => {
          fetchMessages(selectedChat.id);
        }, 3000);
      }

      return () => {
        console.log('Cleaning up realtime subscription and polling');
        if (subscription) {
          try {
            supabase.removeChannel(subscription);
          } catch (error) {
            console.warn('Error removing subscription:', error);
          }
        }
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [selectedChat, userId, scrollToBottom, fetchMessages]);

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        chat_id: selectedChat.id,
        sender_id: userId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      // メッセージ送信後、メッセージ一覧とチャット一覧を更新
      await fetchMessages(selectedChat.id);
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
    <div className="h-96 flex flex-col">
      {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-4 text-sm border border-red-200">{error}</div>}

      <div className="flex h-full bg-white rounded-lg border border-gray-300 overflow-hidden flex-col md:flex-row">
        <div className="w-full md:w-80 bg-gray-50 border-r border-gray-300 flex flex-col md:max-h-52 max-h-48 overflow-y-auto">
          <div className="p-4 border-b border-gray-300">
            <h4 className="m-0 text-gray-800">メッセージ</h4>
          </div>

          <div className="p-4">
            <h5 className="m-0 mb-2 text-gray-800 text-sm font-semibold">友達にメッセージを送る</h5>
            {connections.length > 0 ? (
              <div className="flex flex-col gap-1 mb-4">
                {connections.map((friend) => (
                  <button
                    type="button"
                    key={friend.id}
                    className="bg-transparent hover:bg-white hover:border-yellow-500 border border-gray-300 p-2 rounded cursor-pointer text-left text-sm text-gray-800 transition-all"
                    onClick={() => createChat(friend.connected_user_id)}
                  >
                    {friend.connected_user.display_name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic text-sm text-center p-4">友達がいません</p>
            )}
          </div>

          <div className="p-4">
            <h5 className="m-0 mb-2 text-gray-800 text-sm font-semibold">チャット履歴</h5>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  type="button"
                  key={chat.id}
                  className={`flex justify-between items-start p-3 bg-transparent border-none rounded cursor-pointer text-left transition-all mb-1 w-full ${
                    selectedChat?.id === chat.id ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-100'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="font-semibold text-sm">{chat.other_user.display_name}</span>
                    {chat.last_message && (
                      <span className="text-xs opacity-80 whitespace-nowrap overflow-hidden text-ellipsis max-w-36">
                        {chat.last_message}
                      </span>
                    )}
                  </div>
                  {chat.last_message_at && (
                    <span className="text-xs opacity-60 whitespace-nowrap">
                      {new Date(chat.last_message_at).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="text-gray-600 italic text-sm text-center p-4">チャット履歴がありません</p>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-300 bg-gray-50">
                <h4 className="m-0 text-gray-800">{selectedChat.other_user.display_name}</h4>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col max-w-[70%] ${
                      message.sender_id === userId ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl break-words whitespace-pre-wrap ${
                        message.sender_id === userId
                          ? 'bg-yellow-500 text-white rounded-br-md'
                          : 'bg-gray-200 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {message.message}
                    </div>
                    <div className="p-1">
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-300 flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  disabled={loading}
                  rows={3}
                  className="flex-1 border border-gray-300 rounded p-3 resize-none font-sans focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white border-none px-6 py-3 rounded cursor-pointer font-semibold transition-all"
                >
                  {loading ? '送信中...' : '送信'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex justify-center items-center">
              <p className="text-gray-600 italic">チャットを選択してください</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
