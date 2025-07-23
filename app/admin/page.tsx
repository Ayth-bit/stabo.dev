'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Board, BoardThread, User, Chat } from '@/app/types/domain';

// Mapboxコンポーネントを動的インポート（SSR回避）
const AdminMapView = dynamic(() => import('@/components/AdminMapView'), { 
  ssr: false,
  loading: () => <div>地図を読み込み中...</div>
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
  const [mapData, setMapData] = useState<MapData>({
    boards: [],
    threads: [],
    users: [],
    chats: []
  });
  
  const [adminSetupStatus, setAdminSetupStatus] = useState<{
    exists: boolean;
    hasProfile: boolean;
  } | null>(null);
  
  const [filters, setFilters] = useState<MapFilters>({
    showBoards: true,
    showThreads: true,
    showUsers: false,
    showChats: false,
    boardType: 'all',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
      end: new Date()
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        showBoards: filters.showBoards.toString(),
        showThreads: filters.showThreads.toString(),
        showUsers: filters.showUsers.toString(),
        showChats: filters.showChats.toString(),
        boardType: filters.boardType,
        startDate: filters.dateRange.start.toISOString(),
        endDate: filters.dateRange.end.toISOString()
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

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const handleFilterChange = (newFilters: Partial<MapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="error">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>管理画面 - 地図ビュー</h1>
        <div className="stats">
          <span>掲示板: {mapData.boards.length}</span>
          <span>投稿: {mapData.threads.length}</span>
          <span>ユーザー: {mapData.users.length}</span>
          <span>チャット: {mapData.chats.length}</span>
        </div>
      </header>

      <div className="admin-content">
        <aside className="filter-panel">
          <h3>フィルター</h3>
          
          <div className="filter-group">
            <h4>表示項目</h4>
            <label>
              <input
                type="checkbox"
                checked={filters.showBoards}
                onChange={(e) => handleFilterChange({ showBoards: e.target.checked })}
              />
              掲示板
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.showThreads}
                onChange={(e) => handleFilterChange({ showThreads: e.target.checked })}
              />
              投稿
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.showUsers}
                onChange={(e) => handleFilterChange({ showUsers: e.target.checked })}
              />
              ユーザー拠点
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.showChats}
                onChange={(e) => handleFilterChange({ showChats: e.target.checked })}
              />
              チャット
            </label>
          </div>

          <div className="filter-group">
            <h4>掲示板タイプ</h4>
            <select
              value={filters.boardType}
              onChange={(e) => handleFilterChange({ 
                boardType: e.target.value as MapFilters['boardType'] 
              })}
            >
              <option value="all">すべて</option>
              <option value="station">駅</option>
              <option value="ward">区</option>
              <option value="park">公園</option>
            </select>
          </div>

          <div className="filter-group">
            <h4>期間</h4>
            <input
              type="date"
              value={filters.dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange({
                dateRange: {
                  ...filters.dateRange,
                  start: new Date(e.target.value)
                }
              })}
            />
            <input
              type="date"
              value={filters.dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange({
                dateRange: {
                  ...filters.dateRange,
                  end: new Date(e.target.value)
                }
              })}
            />
          </div>
        </aside>

        <main className="map-container">
          <AdminMapView 
            data={mapData}
            filters={filters}
          />
        </main>
      </div>

      <style jsx>{`
        .admin-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .admin-header {
          padding: 1rem 2rem;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }

        .stats {
          display: flex;
          gap: 1rem;
        }

        .stats span {
          padding: 0.25rem 0.5rem;
          background: #007bff;
          color: white;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .admin-content {
          flex: 1;
          display: flex;
        }

        .filter-panel {
          width: 300px;
          padding: 1rem;
          background: #fafafa;
          border-right: 1px solid #ddd;
          overflow-y: auto;
        }

        .filter-panel h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }

        .filter-group {
          margin-bottom: 1.5rem;
        }

        .filter-group h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #333;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        .filter-group input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        .filter-group select,
        .filter-group input[type="date"] {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .map-container {
          flex: 1;
          position: relative;
        }

        .loading,
        .error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.25rem;
        }

        .error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
}