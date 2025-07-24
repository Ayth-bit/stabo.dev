// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

// Google Maps API types
interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      Map: new (element: HTMLElement, options: unknown) => unknown;
      Marker?: new (options: unknown) => unknown;
      InfoWindow: new (options: unknown) => unknown;
      LatLngBounds: new () => unknown;
      MapTypeId: { ROADMAP: unknown };
      Size: new (width: number, height: number) => unknown;
      event: {
        addListener: (instance: unknown, eventName: string, handler: () => void) => unknown;
        removeListener: (listener: unknown) => void;
      };
      marker?: {
        AdvancedMarkerElement: new (options: unknown) => unknown;
        PinElement: new (options?: unknown) => { element: HTMLElement };
      };
    };
  };
  [key: string]: unknown;
}

import { supabase } from '../lib/supabase';

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

const UniqueThreadsList = ({ threads }: { threads: ThreadInfo[] }) => {
  const router = useRouter();
  if (threads.length === 0) return null;

  return (
    <div className="mt-8 border-t-2 border-accent pt-5">
      <h2 className="text-center text-primary text-xl font-bold mb-4">注目のユニークスレッド</h2>
      <ul className="list-none p-0 space-y-4">
        {threads.map((thread) => (
          <li
            key={thread.id}
            className="card p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => router.push(`/thread/${thread.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(`/thread/${thread.id}`);
              }
            }}
          >
            <p className="font-bold m-0 text-blue-600 mb-2">{thread.title}</p>
            <p className="text-sm text-tertiary m-0">
              投稿数: {thread.post_count}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ReadOnlyThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  const router = useRouter();
  if (threads.length === 0) return null;

  return (
    <div className="mt-8 border-t-2 border-yellow-400 pt-5">
      <h2 className="text-center text-orange-600 text-xl font-bold mb-4">近くの読み取り専用スレッド</h2>
      <ul className="list-none p-0 space-y-4">
        {threads.map((thread) => (
          <li
            key={thread.id}
            className="card p-4 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-200"
            onClick={() => router.push(`/thread/${thread.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(`/thread/${thread.id}`);
              }
            }}
            tabIndex={0}
          >
            <p className="font-bold m-0 mb-2">{thread.title}</p>
            <p className="text-sm text-tertiary m-0">
              投稿数: {thread.post_count} | 距離: {thread.distance.toFixed(2)} km
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 地図設定（コンポーネント外で定義）
const MAP_CONFIG = {
  // 基軸となる中心点（東京駅を基準点として使用）
  centerLat: 35.6762,
  centerLng: 139.6503,
  // 固定ズームレベル
  zoom: 12,
  // マーカーの色
  markerColor: 'red',
};

const DistantThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  const mapContainerIdRef = React.useRef(`map-${Date.now()}`);

  // マーカーデータ配列を作成
  const markerData = threads.map((thread, index) => ({
    lat: thread.latitude,
    lng: thread.longitude,
    label: index + 1,
    title: thread.title,
    color: index === 0 ? 'red' : 'blue',
    description: `投稿数: ${thread.post_count} | 距離: ${thread.distance.toFixed(1)}km`,
  }));

  React.useEffect(() => {
    let isMounted = true;
    
    console.log('DistantThreadsList useEffect triggered');
    console.log('Threads data:', threads);
    console.log('Number of threads:', threads.length);

    // Google Maps APIが読み込まれているかチェック
    if (typeof window !== 'undefined' && (window as unknown as GoogleMapsWindow).google?.maps) {
      console.log('Google Maps API already loaded');
      if (isMounted) {
        initializeMap();
      }
    } else {
      console.log('Loading Google Maps API...');
      // Google Maps APIを動的に読み込み（重複チェック付き）
      loadGoogleMapsAPI().then(() => {
        console.log('Google Maps API loaded successfully');
        if (isMounted) {
          initializeMap();
        }
      }).catch(error => {
        console.error('Failed to load Google Maps API:', error);
      });
    }

    function loadGoogleMapsAPI() {
      return new Promise((resolve, reject) => {
        // 既に読み込まれている場合
        const gmapsWindow = window as unknown as GoogleMapsWindow;
        if (gmapsWindow.google?.maps) {
          resolve(gmapsWindow.google.maps);
          return;
        }

        // 既にスクリプトが存在するかチェック
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          // 既存のスクリプトの読み込み完了を待つ
          const checkGoogleMaps = () => {
            const gmapsWindow = window as unknown as GoogleMapsWindow;
            if (gmapsWindow.google?.maps) {
              resolve(gmapsWindow.google.maps);
            } else {
              setTimeout(checkGoogleMaps, 100);
            }
          };
          checkGoogleMaps();
          return;
        }

        // 新しいスクリプトを追加
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo';
        console.log('Loading Google Maps with API key:', `${apiKey?.slice(0, 10)}...`);
        const callbackName = `initMap_${Date.now()}`;

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        (window as unknown as GoogleMapsWindow)[callbackName] = () => {
          delete (window as unknown as GoogleMapsWindow)[callbackName]; // コールバックをクリーンアップ
          const gmapsWindow = window as unknown as GoogleMapsWindow;
          resolve(gmapsWindow.google?.maps);
        };

        script.onerror = () => {
          delete (window as unknown as GoogleMapsWindow)[callbackName];
          reject(new Error('Google Maps API failed to load'));
        };

        document.head.appendChild(script);
      });
    }

    function initializeMap() {
      console.log('Initializing map with container ID:', mapContainerIdRef.current);
      const mapElement = document.getElementById(mapContainerIdRef.current);
      if (!mapElement) {
        console.error('Map element not found:', mapContainerIdRef.current);
        return;
      }
      console.log('Map element found:', mapElement);

      // 地図を初期化
      const gmapsWindow = window as unknown as GoogleMapsWindow;
      const googleMaps = gmapsWindow.google?.maps;
      if (!googleMaps) {
        console.error('Google Maps API not available');
        return;
      }
      console.log('Google Maps API available, initializing map...');

      // ローディング表示をクリア
      mapElement.innerHTML = '';
      mapElement.style.display = 'block';

      const map = new googleMaps.Map(mapElement, {
        zoom: MAP_CONFIG.zoom,
        center: { lat: MAP_CONFIG.centerLat, lng: MAP_CONFIG.centerLng },
        mapTypeId: googleMaps.MapTypeId.ROADMAP,
        mapId: 'STABO_MAP_STYLE', // AdvancedMarkerElement用のマップID
      }) as {
        fitBounds: (bounds: unknown) => void;
        getZoom: () => number;
        setZoom: (zoom: number) => void;
      };

      console.log('Map initialized successfully');

      // マーカーを追加
      const bounds = new googleMaps.LatLngBounds() as {
        extend: (position: unknown) => void;
      };

      for (const markerInfo of markerData) {
        let marker: {
          addListener: (event: string, handler: () => void) => void;
          position?: unknown;
          getPosition?: () => unknown;
        } | null = null;

        // AdvancedMarkerElementを試す
        if (googleMaps.marker) {
          try {
            // PinElementを作成してカスタマイズ
            const pinElement = new googleMaps.marker.PinElement({
              glyph: markerInfo.label.toString(),
              scale: 1.2,
              background: markerInfo.color === 'red' ? '#EA4335' : 
                         markerInfo.color === 'blue' ? '#4285F4' : 
                         markerInfo.color === 'green' ? '#34A853' : '#FBBC04',
              borderColor: '#FFFFFF',
              glyphColor: '#FFFFFF',
            });

            marker = new googleMaps.marker.AdvancedMarkerElement({
              position: { lat: markerInfo.lat, lng: markerInfo.lng },
              map: map,
              title: markerInfo.title,
              content: pinElement.element,
            }) as {
              addListener: (event: string, handler: () => void) => void;
              position: unknown;
            };
          } catch (error) {
            console.warn('AdvancedMarkerElement failed, falling back to classic Marker:', error);
          }
        }

        // フォールバック: 従来のMarkerを使用
        if (!marker && (googleMaps as unknown as { Marker?: new (options: unknown) => unknown }).Marker) {
          marker = new ((googleMaps as unknown as { Marker: new (options: unknown) => unknown }).Marker)({
            position: { lat: markerInfo.lat, lng: markerInfo.lng },
            map: map,
            title: markerInfo.title,
            label: markerInfo.label.toString(),
            icon: {
              url: `https://maps.google.com/mapfiles/ms/icons/${markerInfo.color}-dot.png`,
              scaledSize: new googleMaps.Size(32, 32),
            },
          }) as {
            addListener: (event: string, handler: () => void) => void;
            getPosition: () => unknown;
          };
        }

        if (!marker) {
          console.warn('No marker implementation available, skipping marker creation');
          continue;
        }

        // 情報ウィンドウを追加
        const infoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">${markerInfo.title}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${markerInfo.description}</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">座標: ${markerInfo.lat.toFixed(
                4
              )}, ${markerInfo.lng.toFixed(4)}</p>
            </div>
          `,
        }) as { open: (map: unknown, marker: unknown) => void };

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // 位置情報を境界に追加
        const position = marker.position || marker.getPosition?.() || { lat: markerInfo.lat, lng: markerInfo.lng };
        bounds.extend(position);
      }

      // 全てのマーカーが見えるように地図を調整
      if (markerData.length > 1) {
        map.fitBounds(bounds);

        // ズームレベルが高すぎる場合は制限
        const listener = googleMaps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          googleMaps.event.removeListener(listener);
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [threads, markerData]);

  if (threads.length === 0) {
    return (
      <div className="mt-8 text-center text-tertiary">
        <p>遠くのスレッドはありません</p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-5">
      <h2 className="text-center text-secondary text-xl font-bold mb-5">
        遠くのスレッド (マップで表示)
      </h2>

      <div className="border border-gray-300 rounded-lg overflow-hidden mb-5 shadow-md">
        <div
          id={mapContainerIdRef.current}
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div>地図を読み込み中...</div>
          <div className="text-xs text-gray-400">
            マップID: {mapContainerIdRef.current}
          </div>
          {threads.length > 0 && (
            <div className="text-xs text-gray-400">
              {threads.length}件のスレッド
            </div>
          )}
        </div>
      </div>

      {/* スレッド一覧（地図の下に簡潔に表示） */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="m-0 mb-4 text-base text-primary font-semibold">
          スレッド一覧 ({threads.length}件)
        </h3>
        <div className="grid gap-2">
          {threads.slice(0, 5).map((thread, index) => (
            <div
              key={thread.id}
              className="flex justify-between items-center p-3 bg-white rounded border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {
                const mapUrl = `https://www.google.com/maps?q=${thread.latitude},${thread.longitude}&z=15`;
                try {
                  const newWindow = window.open(mapUrl, '_blank', 'noopener,noreferrer');
                  if (!newWindow) {
                    throw new Error('ポップアップがブロックされました');
                  }
                } catch {
                  window.location.href = mapUrl;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const mapUrl = `https://www.google.com/maps?q=${thread.latitude},${thread.longitude}&z=15`;
                  try {
                    const newWindow = window.open(mapUrl, '_blank', 'noopener,noreferrer');
                    if (!newWindow) {
                      throw new Error('ポップアップがブロックされました');
                    }
                  } catch {
                    window.location.href = mapUrl;
                  }
                }
              }}
              tabIndex={0}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-primary">
                    {thread.title}
                  </div>
                  <div className="text-xs text-tertiary mt-0.5">
                    投稿数: {thread.post_count} | 座標: {thread.latitude.toFixed(4)},{' '}
                    {thread.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs text-tertiary">
                  {thread.distance.toFixed(1)}km
                </div>
                <button
                  type="button"
                  className="text-xs px-1.5 py-0.5 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${thread.latitude},${thread.longitude}`;
                    window.open(mapUrl, '_blank');
                  }}
                >
                  地図
                </button>
              </div>
            </div>
          ))}
          {threads.length > 5 && (
            <div className="text-center mt-2">
              <span className="text-sm text-tertiary">
                他 {threads.length - 5} 件のスレッドがあります
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const router = useRouter();

  const [location, setLocation] = useState<GeolocationResult>({
    latitude: null,
    longitude: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('位置情報を取得中...');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [foundThread, setFoundThread] = useState<ThreadInfo | null>(null);
  const [distantThreads, setDistantThreads] = useState<DistantThreadInfo[]>([]);
  const [uniqueThreads, setUniqueThreads] = useState<ThreadInfo[]>([]);
  const [readOnlyThreads, setReadOnlyThreads] = useState<DistantThreadInfo[]>([]);

  const handleLocationProcessed = useCallback(async (lat: number, lon: number) => {
    setCurrentStatus('スレッドを検索中...');
    try {
      const [mainResult, distantResult, uniqueResult, readOnlyResult] = await Promise.all([
        supabase.functions.invoke<EdgeFunctionResponse>('handle-location', {
          body: { latitude: lat, longitude: lon },
        }),
        supabase.functions.invoke<DistantThreadInfo[]>('get-distant-threads', {
          body: { latitude: lat, longitude: lon },
        }),
        supabase.functions.invoke<ThreadInfo[]>('get-global-threads'),
        supabase.functions.invoke<DistantThreadInfo[]>('get-readonly-threads', {
          body: { latitude: lat, longitude: lon },
        }),
      ]);

      const { data: mainData, error: mainError } = mainResult;
      if (mainError) throw mainError;
      if (!mainData) throw new Error('Function "handle-location" did not return data.');
      if (mainData.error) throw new Error(mainData.error);

      if (mainData.type === 'found_thread' && mainData.thread) {
        setActionMessage('既存のスレッドが見つかりました:');
        setFoundThread(mainData.thread);
      } else if (mainData.type === 'create_new_thread') {
        setActionMessage(mainData.message || 'この位置にスレッドが見つかりませんでした。');
        setFoundThread(null);
      }

      const { data: distantData, error: distantError } = distantResult;
      if (distantError) console.warn('Could not fetch distant threads:', distantError.message);
      else if (distantData) setDistantThreads(distantData);

      const { data: uniqueData, error: uniqueError } = uniqueResult;
      if (uniqueError) console.warn('Could not fetch unique threads:', uniqueError.message);
      else if (uniqueData) setUniqueThreads(uniqueData);

      const { data: readOnlyData, error: readOnlyError } = readOnlyResult;
      if (readOnlyError) console.warn('Could not fetch readonly threads:', readOnlyError.message);
      else if (readOnlyData) setReadOnlyThreads(readOnlyData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setActionMessage(`エラー: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setCurrentStatus('完了');
    }
  }, []);

  useEffect(() => {
    console.log('Attempting to get geolocation...');
    console.log('Navigator available:', !!navigator);
    console.log('Geolocation available:', !!navigator.geolocation);
    console.log('HTTPS context:', window.location.protocol === 'https:');
    console.log('Localhost context:', window.location.hostname === 'localhost');

    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: 'このブラウザは位置情報をサポートしていません。',
      });
      handleLocationProcessed(0, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, error: null });
        handleLocationProcessed(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = '位置情報の取得に失敗しました。';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              '位置情報へのアクセスが拒否されました。ブラウザの設定で位置情報を許可してください。';
            console.warn('User denied geolocation permission');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              '位置情報が取得できませんでした。\n\n確認事項:\n1. macOS: システム設定 → プライバシーとセキュリティ → 位置情報サービス\n2. Chrome: 設定 → プライバシーとセキュリティ → サイトの設定 → 位置情報';
            console.warn('Position unavailable - system settings may be disabled');
            console.warn('CoreLocation error detected on macOS');

            // 開発用フォールバック: 東京駅の座標を使用（より確実に）
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              console.warn('Development fallback: Using Tokyo Station coordinates (auto-fallback)');
              setLocation({
                latitude: 35.6812,
                longitude: 139.7671,
                error: null,
              });
              handleLocationProcessed(35.6812, 139.7671);
              return;
            }
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。再試行してください。';
            console.warn('Geolocation timeout');
            break;
          default:
            errorMessage = `位置情報の取得に失敗しました: ${error.message}`;
            console.error('Unknown geolocation error:', error);
        }

        setLocation({
          latitude: null,
          longitude: null,
          error: errorMessage,
        });
        handleLocationProcessed(0, 0);
      }
    );
  }, [handleLocationProcessed]);

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: 'auto',
        border: '1px solid #eee',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        color: '#333',
      }}
    >
      <header
        style={{
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '1px solid #eee',
        }}
      >
        <h1
          style={{
            color: '#333',
            margin: 0,
            fontSize: '1.5em',
            textAlign: 'center',
          }}
        >
          stabo.dev
        </h1>
      </header>

      {isLoading ? (
        <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#555' }}>{currentStatus}</p>
      ) : (
        <div>
          {location.error && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: 'red', whiteSpace: 'pre-line' }}>{location.error}</p>
              <div style={{ marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Using manual fallback coordinates');
                    setLocation({
                      latitude: 35.6812,
                      longitude: 139.7671,
                      error: null,
                    });
                    handleLocationProcessed(35.6812, 139.7671);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '10px',
                  }}
                >
                  東京駅でテストする
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.reload();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  再試行
                </button>
              </div>
            </div>
          )}

          {!location.error && (
            <>
              <p className="text-center text-sm text-tertiary">
                緯度: {location.latitude?.toFixed(5)}, 経度: {location.longitude?.toFixed(5)}
              </p>

              {foundThread ? (
                <div className="border-t border-gray-200 pt-5 text-center mt-5">
                  <p className="m-0 mb-2 text-secondary">{actionMessage}</p>
                  <p className="text-lg font-bold text-primary mb-3">
                    &ldquo;{foundThread.title}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/thread/${foundThread.id}`)}
                    className="btn-primary px-5 py-2 mt-2"
                  >
                    スレッドを見る
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-5 text-center mt-5">
                  <p className="m-0 mb-2 text-secondary">{actionMessage}</p>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/create-thread?lat=${location.latitude}&lon=${location.longitude}`
                      )
                    }
                    className="btn-primary px-5 py-2"
                  >
                    新規スレッドを作成する
                  </button>
                </div>
              )}
            </>
          )}

          {/* デバッグ情報 */}
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '5px',
            fontSize: '12px',
            color: '#666'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>デバッグ情報:</h4>
            <p>ユニークスレッド: {uniqueThreads.length}件</p>
            <p>読み取り専用スレッド: {readOnlyThreads.length}件</p>
            <p>遠くのスレッド: {distantThreads.length}件</p>
            {distantThreads.length > 0 && (
              <details>
                <summary>遠くのスレッド詳細</summary>
                <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                  {JSON.stringify(distantThreads, null, 2)}
                </pre>
              </details>
            )}
          </div>

          <UniqueThreadsList threads={uniqueThreads} />
          <ReadOnlyThreadsList threads={readOnlyThreads} />
          <DistantThreadsList threads={distantThreads} />

          {/* Admin Setup Link */}
          <div
            style={{
              marginTop: '40px',
              padding: '20px',
              borderTop: '1px solid #eee',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.8rem',
                color: '#666',
                margin: '0 0 10px 0',
              }}
            >
              開発者・管理者向け
            </p>
            <button
              type="button"
              onClick={() => router.push('/admin-setup')}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                color: '#666',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              管理者セットアップ
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                color: '#666',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              管理画面
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
