// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// ESLint: 'supabase' is assigned a value but never used. を無視するために、
// 実際には useSupaClient のようなカスタムフックとして定義するか、
// このファイルのコンテキスト内で直接 useClientComponentClient を使うのが一般的です。
// 今回は一時的に eslint-disable-next-line で対応します。
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

type GeolocationResult = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
};

type ThreadInfo = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  post_count: number;
};

type EdgeFunctionResponse = {
  type: 'found_thread' | 'create_new_thread';
  thread?: ThreadInfo;
  message?: string;
  error?: string;
};

const HomePage = () => {
  const router = useRouter(); // useRouter フックを初期化

  const [location, setLocation] = useState<GeolocationResult>({
    latitude: null,
    longitude: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('位置情報を取得中...');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [foundThread, setFoundThread] = useState<ThreadInfo | null>(null);

  const handleLocationProcessed = async (lat: number, lon: number) => {
    setCurrentStatus('スレッドを検索中...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/handle-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
        }),
      });

      const data: EdgeFunctionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Edge Functionの呼び出しに失敗しました。');
      }

      console.log('Edge Functionからの応答:', data);

      if (data.type === 'found_thread' && data.thread) {
        setActionMessage(`既存のスレッドが見つかりました: "${data.thread.title}"`);
        setFoundThread(data.thread);
        setCurrentStatus('完了');
      } else if (data.type === 'create_new_thread') {
        setActionMessage(data.message || 'この位置にスレッドが見つかりませんでした。新しいスレッドを作成できます。');
        setFoundThread(null);
        setCurrentStatus('完了');
      }
    } catch (error: unknown) {
      console.error('Edge Function呼び出しエラー:', error instanceof Error ? error.message : String(error));
      setActionMessage(`エラー: ${error instanceof Error ? error.message : String(error)}`);
      setCurrentStatus('エラー');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude, error: null });
          handleLocationProcessed(latitude, longitude);
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
          let errorMessage = '位置情報の取得に失敗しました。';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '位置情報へのアクセスが拒否されました。設定を確認してください。';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置情報が利用できません。';
              break;
            case error.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました。';
              break;
            // ★修正点: UNKNOWN_ERROR は GeolocationPositionError に存在しないため削除し、default に統合
            // case error.UNKNOWN_ERROR: // この行を削除
            //   errorMessage = '不明なエラーが発生しました。'; // この行も削除
            //   break; // この行も削除
            default: // 代わりに default ケースを追加
              errorMessage = '不明なエラーが発生しました。';
              break;
          }
          setLocation({ latitude: null, longitude: null, error: errorMessage });
          setIsLoading(false);
          setCurrentStatus('エラー');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocation({ latitude: null, longitude: null, error: 'お使いのブラウザは位置情報に対応していません。' });
      setIsLoading(false);
      setCurrentStatus('エラー');
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Stabo.dev(Classic)</h1>
      
      {isLoading ? (
        <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#555' }}>{currentStatus}</p>
      ) : (
        <div>
          {location.error ? (
            <p style={{ color: 'red', textAlign: 'center' }}>エラー: {location.error}</p>
          ) : (
            <>
              <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777' }}>
                緯度: {location.latitude?.toFixed(6)}, 経度: {location.longitude?.toFixed(6)}
              </p>
              {actionMessage && <p style={{ textAlign: 'center', fontSize: '1.1em', color: '#444', marginBottom: '20px' }}>{actionMessage}</p>}

              {foundThread ? (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
                  <h2 style={{ color: '#333' }}>見つかったスレッド:</h2>
                  <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#333' }}>{`"${foundThread.title}"`}</p>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>現在の投稿数: {foundThread.post_count} / 1000</p>
                  <button
                    onClick={() => router.push(`/thread/${foundThread.id}`)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '1em',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginTop: '15px',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    スレッドを見る
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.1em', color: '#444' }}>この位置にスレッドがありません。</p>
                  <button
                    onClick={() => router.push(`/create-thread?lat=${location.latitude}&lon=${location.longitude}`)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '1em',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginTop: '15px',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    新規スレッドを作成する
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;