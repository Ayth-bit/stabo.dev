// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

type GeolocationResult = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
};

// ★ ThreadInfo と DistantThreadInfo の型に is_global を追加
type ThreadInfo = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  post_count: number;
  is_global: boolean;
};

type DistantThreadInfo = ThreadInfo & {
  distance: number;
};

type EdgeFunctionResponse = {
  type: 'found_thread' | 'create_new_thread';
  thread?: ThreadInfo;
  message?: string;
  error?: string;
};

// ★★★ DistantThreadsList コンポーネントを大幅に修正 ★★★
const DistantThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  const router = useRouter(); // ナビゲーション用のルーター

  if (threads.length === 0) {
    return null;
  }

  const handleThreadClick = (e: React.MouseEvent, thread: DistantThreadInfo) => {
    e.preventDefault();
    if (thread.is_global) {
      // グローバルスレッドならスレッドページに遷移
      router.push(`/thread/${thread.id}`);
    } else {
      // 通常スレッドならGoogleマップを新しいタブで開く
      window.open(`https://maps.google.com/?q=${thread.latitude},${thread.longitude}`, '_blank');
    }
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#555' }}>近くの他のスレッド</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {threads.map((thread) => (
          <li key={thread.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer' }} onClick={(e) => handleThreadClick(e, thread)}>
              <div style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: 0 }}>
                  {thread.is_global && '★ '}
                  {thread.title}
                </p>
                <p style={{ fontSize: '0.8em', color: '#777', margin: '5px 0 0' }}>
                  投稿数: {thread.post_count}
                  {!thread.is_global && ` | 距離: ${thread.distance.toFixed(2)} km`}
                </p>
              </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const HomePage = () => {
  const router = useRouter();

  const [location, setLocation] = useState<GeolocationResult>({ latitude: null, longitude: null, error: null });
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('位置情報を取得中...');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [foundThread, setFoundThread] = useState<ThreadInfo | null>(null);
  const [distantThreads, setDistantThreads] = useState<DistantThreadInfo[]>([]);

  const handleLocationProcessed = async (lat: number, lon: number) => {
    setCurrentStatus('スレッドを検索中...');
    try {
      const { data: mainData, error: mainError } = await supabase.functions.invoke<EdgeFunctionResponse>('handle-location', {
        body: { latitude: lat, longitude: lon },
      });

      if (mainError) throw mainError;
      if (!mainData) {
        throw new Error('Function did not return data.');
      }
      if (mainData.error) throw new Error(mainData.error);

      if (mainData.type === 'found_thread' && mainData.thread) {
        setActionMessage(`既存のスレッドが見つかりました: "${mainData.thread.title}"`);
        setFoundThread(mainData.thread);
      } else if (mainData.type === 'create_new_thread') {
        setActionMessage(mainData.message || 'この位置にスレッドが見つかりませんでした。');
        setFoundThread(null);
      }
      
      const { data: distantData, error: distantError } = await supabase.functions.invoke<DistantThreadInfo[]>('get-distant-threads', {
        body: { latitude: lat, longitude: lon },
      });
      
      if (distantError) {
          console.warn('Could not fetch distant threads:', distantError.message);
      } else if (distantData) {
          setDistantThreads(distantData);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Function invocation error:', errorMessage);
      setActionMessage(`エラー: ${errorMessage}`);
      setCurrentStatus('エラー');
    } finally {
      setIsLoading(false);
      setCurrentStatus('完了');
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center' }}>stabo.dev</h1>
      
      {isLoading ? (
        <p style={{ textAlign: 'center' }}>{currentStatus}</p>
      ) : (
        <div>
          {location.error ? (
            <p style={{ color: 'red', textAlign: 'center' }}>エラー: {location.error}</p>
          ) : (
            <>
              <p style={{ textAlign: 'center', fontSize: '0.8em', color: '#666' }}>
                緯度: {location.latitude?.toFixed(5)}, 経度: {location.longitude?.toFixed(5)}
              </p>
              {actionMessage && <p style={{ textAlign: 'center' }}>{actionMessage}</p>}

              {foundThread ? (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <h2>見つかったスレッド:</h2>
                  <p><strong>{`"${foundThread.title}"`}</strong></p>
                  <button onClick={() => router.push(`/thread/${foundThread.id}`)}>スレッドを見る</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <p>この位置にスレッドがありません。</p>
                  <button onClick={() => router.push(`/create-thread?lat=${location.latitude}&lon=${location.longitude}`)}>新規スレッドを作成する</button>
                </div>
              )}
              <DistantThreadsList threads={distantThreads} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;