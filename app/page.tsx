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

const DistantThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  const router = useRouter();

  if (threads.length === 0) {
    return null;
  }
  
  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#555' }}>近くの他のスレッド</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {threads.map((thread) => (
          <li
            key={thread.id}
            style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onClick={(e) => {
              e.preventDefault();
              if (thread.is_global) {
                router.push(`/thread/${thread.id}`);
              } else {
                window.open(`https://maps.google.com/?q=${thread.latitude},${thread.longitude}`, '_blank');
              }
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: 0, color: thread.is_global ? '#007bff' : '#333' }}>
              {thread.is_global && '★ '}
              {thread.title}
            </p>
            <p style={{ fontSize: '0.8em', color: '#6c757d', margin: '5px 0 0' }}>
              投稿数: {thread.post_count}
              {!thread.is_global && ` | 距離: ${thread.distance.toFixed(2)} km`}
            </p>
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
      if (!mainData) throw new Error('Function did not return data.');
      if (mainData.error) throw new Error(mainData.error);

      if (mainData.type === 'found_thread' && mainData.thread) {
        setActionMessage(`既存のスレッドが見つかりました:`);
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
      setActionMessage(`エラー: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setCurrentStatus('完了');
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, error: null });
        handleLocationProcessed(latitude, longitude);
      },
      () => {
        setLocation({ latitude: null, longitude: null, error: '位置情報へのアクセスが拒否されました。設定を確認してください。' });
        setIsLoading(false);
      }
    );
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Stabo_α版</h1>
      
      {isLoading ? (
        <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#555' }}>{currentStatus}</p>
      ) : (
        <div>
          {location.error ? (
            <p style={{ color: 'red', textAlign: 'center' }}>{location.error}</p>
          ) : (
            <>
              <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#777' }}>
                緯度: {location.latitude?.toFixed(5)}, 経度: {location.longitude?.toFixed(5)}
              </p>
              
              {foundThread ? (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center', marginTop: '20px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '1em', color: '#444' }}>{actionMessage}</p>
                  <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#333' }}>{`"${foundThread.title}"`}</p>
                  <button
                    onClick={() => router.push(`/thread/${foundThread.id}`)}
                    style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', marginTop: '10px' }}
                  >
                    スレッドを見る
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center', marginTop: '20px' }}>
                   <p style={{ margin: '0 0 10px 0', fontSize: '1.1em', color: '#444' }}>{actionMessage}</p>
                  <button
                    onClick={() => router.push(`/create-thread?lat=${location.latitude}&lon=${location.longitude}`)}
                    style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
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