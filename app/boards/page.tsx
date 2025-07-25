'use client';

import type { Board } from '@/app/types/domain';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [, setBoardStats] = useState({
    station: 0,
    ward: 0,
    park: 0,
    accessible: 0,
  });
  const [allStats, setAllStats] = useState({
    station: 0,
    ward: 0,
    park: 0,
    accessible: 0,
    all: 0,
  });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [filter, setFilter] = useState<'all' | 'accessible' | 'station' | 'ward' | 'park'>(
    'all'
  );

  const fetchBoards = useCallback(async () => {
    try {
      const locationParam = userLocation
        ? `?lat=${userLocation.lat}&lng=${userLocation.lng}&filter=${filter}`
        : `?lat=0&lng=0&filter=${filter}`;

      console.log('Fetching boards with params:', locationParam);
      const response = await fetch(`/api/boards/integrated${locationParam}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Boards data received:', data);
        
        // 位置情報があるのに掲示板が0件の場合は範囲外と判定
        if (userLocation && data.boards.length === 0 && data.allStats.all > 0) {
          console.log('User location is out of range, using fallback');
          setIsOutOfRange(true);
          // 東京駅の座標で再取得
          const fallbackResponse = await fetch(`/api/boards/integrated?lat=35.6812&lng=139.7671&filter=${filter}`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setBoards(fallbackData.boards || []);
            setBoardStats(fallbackData.byType || { station: 0, ward: 0, park: 0, accessible: 0 });
            return;
          }
        } else {
          setIsOutOfRange(false);
        }
        
        setBoards(data.boards || []);
        setBoardStats(data.byType || { station: 0, ward: 0, park: 0, accessible: 0 });
        if (data.allStats) {
          setAllStats(data.allStats);
        }
      } else {
        console.error('Failed to fetch boards:', response.status, await response.text());
      }
    } catch (error) {
      console.error('掲示板データの取得に失敗', error);
    }
  }, [userLocation, filter]);

  // 初期データ取得を位置情報なしでも実行
  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch('/api/boards/integrated?lat=0&lng=0&filter=all');
      if (response.ok) {
        const data = await response.json();
        console.log('Initial data received:', data);
        // 初期表示時にもボードデータを設定
        setBoards(data.boards || []);
        if (data.allStats) {
          setAllStats(data.allStats);
        }
      }
    } catch (error) {
      console.error('初期データの取得に失敗', error);
    }
  }, []);

  useEffect(() => {
    fetchInitialData(); // 位置情報に関係なく統計とボードデータを取得
    getCurrentLocation();
  }, [fetchInitialData]);

  useEffect(() => {
    // 位置情報が取得された場合、またはフィルターが変更された場合にfetchBoardsを実行
    // ただし、位置情報がなくaccessibleフィルターの場合は除く
    if (userLocation && !locationError) {
      fetchBoards();
    } else if (!userLocation && filter !== 'accessible') {
      fetchBoards();
    }
  }, [fetchBoards, userLocation, locationError, filter]);

  const getCurrentLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('このブラウザは位置情報をサポートしていません');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
        setLoading(false);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        let errorMessage = '位置情報の取得に失敗しました';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              '位置情報の利用が拒否されています。ブラウザの設定で位置情報を許可してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません。';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。';
            break;
        }

        setLocationError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const isAccessible = (board: Board & { isAccessible?: boolean }): boolean => {
    return board.isAccessible || false;
  };

  const getFilteredBoards = () => {
    // 統合APIで既にフィルタリングとソートが済んでいるため、そのまま返す
    return boards;
  };

  const getBoardTypeIcon = (type: string) => {
    switch (type) {
      case 'station':
        return '[駅]';
      case 'ward':
        return '[区]';
      case 'park':
        return '[公園]';
      default:
        return '[掲示板]';
    }
  };

  const getBoardTypeLabel = (type: string) => {
    switch (type) {
      case 'station':
        return '駅';
      case 'ward':
        return '区';
      case 'park':
        return '公園';
      default:
        return '掲示板';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center card p-8" style={{ borderRadius: 'var(--border-radius-md)' }}>
          <div className="w-12 h-12 border-4 border-gray-300 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">位置情報を取得中...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="card p-8 max-w-md" style={{ borderRadius: 'var(--border-radius-md)' }}>
          <div className="message-error mb-6">
            <h2 className="text-xl font-bold mb-2">位置情報エラー</h2>
            <p>{locationError}</p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap mb-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="btn-secondary"
            >
              再試行
            </button>
            <button
              type="button"
              onClick={() => {
                setLocationError(null);
                setLoading(false);
                // デフォルト位置（東京駅）を設定
                setUserLocation({ lat: 35.6812, lng: 139.7671 });
              }}
              className="btn-primary"
            >
              東京駅で続行
            </button>
          </div>
          <p className="text-sm text-tertiary text-center">
            位置情報なしでも掲示板は閲覧できますが、アクセス可能な掲示板の判定ができません。
          </p>
        </div>
      </div>
    );
  }

  const filteredBoards = getFilteredBoards();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 text-primary">掲示板一覧</h1>
          <p className="text-secondary text-sm">
            現在地:{' '}
            {userLocation
              ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
              : '取得中...'}
          </p>
          {isOutOfRange && (
            <div className="message-warning mt-2 text-sm">
              現在地は対象エリア外です。東京駅周辺の掲示板を表示しています。
            </div>
          )}
        </header>

        <nav className="mb-8">
          <div className="card p-6" style={{ borderRadius: 'var(--border-radius-md)' }}>
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                type="button"
                className={`text-sm font-medium transition-all duration-200 min-w-[120px] ${
                  filter === 'accessible'
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ borderRadius: 'var(--border-radius)', border: 'none', padding: '12px 24px', margin: '4px' }}
                onClick={() => setFilter('accessible')}
              >
                アクセス可能 ({allStats.accessible})
              </button>
              <button
                type="button"
                className={`text-sm font-medium transition-all duration-200 min-w-[100px] ${
                  filter === 'station'
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ borderRadius: 'var(--border-radius)', border: 'none', padding: '12px 24px', margin: '4px' }}
                onClick={() => setFilter('station')}
              >
                駅 ({allStats.station})
              </button>
              <button
                type="button"
                className={`text-sm font-medium transition-all duration-200 min-w-[100px] ${
                  filter === 'ward'
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ borderRadius: 'var(--border-radius)', border: 'none', padding: '12px 24px', margin: '4px' }}
                onClick={() => setFilter('ward')}
              >
                区 ({allStats.ward})
              </button>
              <button
                type="button"
                className={`text-sm font-medium transition-all duration-200 min-w-[100px] ${
                  filter === 'park'
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ borderRadius: 'var(--border-radius)', border: 'none', padding: '12px 24px', margin: '4px' }}
                onClick={() => setFilter('park')}
              >
                公園 ({allStats.park})
              </button>
              <button
                type="button"
                className={`text-sm font-medium transition-all duration-200 min-w-[100px] ${
                  filter === 'all'
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ borderRadius: 'var(--border-radius)', border: 'none', padding: '12px 24px', margin: '4px' }}
                onClick={() => setFilter('all')}
              >
                全て ({allStats.all})
              </button>
            </div>
          </div>
        </nav>

        <div className="mt-8">
          {filteredBoards.length === 0 ? (
            <div className="card p-12 text-center" style={{ borderRadius: 'var(--border-radius-md)' }}>
              <p className="text-secondary mb-2">条件に合致する掲示板がありません</p>
              {filter === 'accessible' && (
                <p className="text-sm text-tertiary">
                  近くに移動するか、他のフィルターを試してください
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBoards.map((board) => {
                const distance = (board as Board & { distance?: number }).distance || 0;
                const accessible = isAccessible(board);

                return (
                  <div
                    key={board.id}
                    className={`card p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${
                      accessible ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500 bg-yellow-50'
                    }`}
                    style={{ borderRadius: 'var(--border-radius-md)' }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-2xl">{getBoardTypeIcon(board.type)}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-primary m-0 mb-1">{board.name}</h3>
                        <span className="text-secondary text-sm">{getBoardTypeLabel(board.type)}</span>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-semibold ${
                        accessible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {accessible ? '利用可' : '範囲外'}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-secondary text-sm mb-3">{board.description}</p>
                      <div className="flex gap-4 text-xs text-tertiary">
                        <span>距離: {Math.round(distance)}m</span>
                        <span>範囲: {board.accessRadius}m</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {accessible ? (
                        <>
                          <Link
                            href={`/boards/${board.id}`}
                            className="flex-1 btn-primary text-center text-sm no-underline"
                          >
                            掲示板を見る
                          </Link>
                          <Link
                            href={`/boards/${board.id}/create`}
                            className="flex-1 btn-outline text-center text-sm no-underline"
                          >
                            投稿する
                          </Link>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="flex-1 btn-secondary text-sm opacity-50 cursor-not-allowed"
                            disabled
                          >
                            範囲外です
                          </button>
                          <Link
                            href={`/map/${board.id}`}
                            className="flex-1 text-center text-sm no-underline bg-green-100 text-green-700 px-4 py-2 border border-green-300 hover:bg-green-200 transition-colors"
                            style={{ borderRadius: 'var(--border-radius)' }}
                          >
                            地図で見る
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
