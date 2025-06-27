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

type ThreadInfo = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  post_count: number;
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

const DistantThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  if (threads.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#555' }}>近くの他のスレッド</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {threads.map((thread) => (
          <li key={thread.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <a
              href={`https://maps.google.com/?q=${thread.latitude},${thread.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: 0 }}>{thread.title}</p>
              <p style={{ fontSize: '0.8em', color: '#777', margin: '5px 0 0' }}>
                距離: {thread.distance.toFixed(2)} km | 座標: {thread.latitude.toFixed(4)}, {thread.longitude.toFixed(4)}
              </p>
            </a>
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
      // 1km圏内のスレッドを検索
      const { data: mainData, error: mainError } = await supabase.functions.invoke<EdgeFunctionResponse>('handle-location', {
        body: { latitude: lat, longitude: lon },
      });

      // ★★★ ここから修正 ★★★
      if (mainError) throw mainError;
      if (!mainData) { // mainDataがnullでないことを確認
        throw new Error('Function did not return data.');
      }
      if (mainData.error) throw new Error(mainData.error);
      // ★★★ ここまで修正 ★★★

      if (mainData.type === 'found_thread' && mainData.thread) {
        setActionMessage(`既存のスレッドが見つかりました: "${mainData.thread.title}"`);
        setFoundThread(mainData.thread);
      } else if (mainData.type === 'create_new_thread') {
        setActionMessage(mainData.message || 'この位置にスレッドが見つかりませんでした。');
        setFoundThread(null);
      }
      
      // 1km圏外のスレッドを検索
      const { data: distantData, error: distantError } = await supabase.functions.invoke<DistantThreadInfo[]>('get-distant-threads', {
        body: { latitude: lat, longitude: lon },
      });
      
      // ★★★ ここから修正 ★★★
      if (distantError) {
          console.warn('Could not fetch distant threads:', distantError.message);
      } else if (distantData) { // distantDataがnullでないことを確認
          setDistantThreads(distantData);
      }
      // ★★★ ここまで修正 ★★★

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
            default:
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
      <h1 style={{ textAlign: 'center', color: '#333' }}>stabo.dev</h1>
      
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
              <DistantThreadsList threads={distantThreads} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;