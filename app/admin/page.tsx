'use client';

import type { Board, BoardThread, Chat, User } from '@/app/types/domain';
import dynamic from 'next/dynamic';
import * as React from 'react';

// Mapboxコンポーネントを動的インポート（SSR回避）
const AdminMapView = dynamic(() => import('@/components/AdminMapView'), {
  ssr: false,
  loading: () => <div>地図を読み込み中...</div>,
});

interface MapData {
  boards: Board[];
  threads: BoardThread[];
  users: User[];
  chats: Chat[];
}

interface MapFilters {
  showBoards: boolean;
  showThreads: boolean;
  showUsers: boolean;
  showChats: boolean;
  boardType: 'all' | 'station' | 'ward' | 'park';
  dateRange: {
    start: Date;
    end: Date;
  };
}

export default function AdminPage() {
  const [mapData, setMapData] = React.useState<MapData>({
    boards: [],
    threads: [],
    users: [],
    chats: [],
  });

  // const [adminSetupStatus, setAdminSetupStatus] = useState<{
  //   exists: boolean;
  //   hasProfile: boolean;
  // } | null>(null);

  const [filters, setFilters] = React.useState<MapFilters>({
    showBoards: true,
    showThreads: true,
    showUsers: false,
    showChats: false,
    boardType: 'all',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
      end: new Date(),
    },
  });

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMapData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        showBoards: filters.showBoards.toString(),
        showThreads: filters.showThreads.toString(),
        showUsers: filters.showUsers.toString(),
        showChats: filters.showChats.toString(),
        boardType: filters.boardType,
        startDate: filters.dateRange.start.toISOString(),
        endDate: filters.dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/admin/map-data?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch map data');
      }

      const data = await response.json();
      setMapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const handleFilterChange = (newFilters: Partial<MapFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex justify-center items-center h-full text-xl">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex justify-center items-center h-full text-xl text-red-600">
          エラー: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="px-8 py-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center">
        <h1 className="m-0 text-2xl">管理画面 - 地図ビュー</h1>
        <div className="flex gap-4">
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
            掲示板: {mapData.boards.length}
          </span>
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
            投稿: {mapData.threads.length}
          </span>
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
            ユーザー: {mapData.users.length}
          </span>
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
            チャット: {mapData.chats.length}
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-75 p-4 bg-gray-50 border-r border-gray-300 overflow-y-auto">
          <h3 className="m-0 mb-4 text-xl">フィルター</h3>

          <div className="mb-6">
            <h4 className="m-0 mb-2 text-base text-gray-700">表示項目</h4>
            <label className="block mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showBoards}
                onChange={(e) => handleFilterChange({ showBoards: e.target.checked })}
                className="mr-2"
              />
              掲示板
            </label>
            <label className="block mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showThreads}
                onChange={(e) => handleFilterChange({ showThreads: e.target.checked })}
                className="mr-2"
              />
              投稿
            </label>
            <label className="block mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showUsers}
                onChange={(e) => handleFilterChange({ showUsers: e.target.checked })}
                className="mr-2"
              />
              ユーザー拠点
            </label>
            <label className="block mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showChats}
                onChange={(e) => handleFilterChange({ showChats: e.target.checked })}
                className="mr-2"
              />
              チャット
            </label>
          </div>

          <div className="mb-6">
            <h4 className="m-0 mb-2 text-base text-gray-700">掲示板タイプ</h4>
            <select
              value={filters.boardType}
              onChange={(e) =>
                handleFilterChange({
                  boardType: e.target.value as MapFilters['boardType'],
                })
              }
              className="w-full p-2 border border-gray-400 rounded mb-2"
            >
              <option value="all">すべて</option>
              <option value="station">駅</option>
              <option value="ward">区</option>
              <option value="park">公園</option>
            </select>
          </div>

          <div className="mb-6">
            <h4 className="m-0 mb-2 text-base text-gray-700">期間</h4>
            <input
              type="date"
              value={filters.dateRange.start.toISOString().split('T')[0]}
              onChange={(e) =>
                handleFilterChange({
                  dateRange: {
                    ...filters.dateRange,
                    start: new Date(e.target.value),
                  },
                })
              }
              className="w-full p-2 border border-gray-400 rounded mb-2"
            />
            <input
              type="date"
              value={filters.dateRange.end.toISOString().split('T')[0]}
              onChange={(e) =>
                handleFilterChange({
                  dateRange: {
                    ...filters.dateRange,
                    end: new Date(e.target.value),
                  },
                })
              }
              className="w-full p-2 border border-gray-400 rounded mb-2"
            />
          </div>
        </aside>

        <main className="flex-1 relative">
          <AdminMapView data={mapData} filters={filters} />
        </main>
      </div>
    </div>
  );
}
