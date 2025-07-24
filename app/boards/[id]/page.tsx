'use client';

import type { Board, BoardThread } from '@/app/types/domain';
import ThreadLifecycleManager from '@/components/ThreadLifecycleManager';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('このブラウザは位置情報をサポートしていません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setError('位置情報の取得に失敗しました');
      }
    );
  }, []);

  const fetchBoardData = useCallback(async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data.board);
      } else {
        setError('掲示板が見つかりません');
      }
    } catch {
      setError('掲示板データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const fetchThreads = useCallback(async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/threads`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch {
      console.error('スレッド取得エラー');
    }
  }, [boardId]);

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const checkAccess = useCallback(() => {
    if (!board || !userLocation) return;

    const distance = calculateDistance(userLocation.lat, userLocation.lng, board.lat, board.lng);

    setCanAccess(distance <= board.accessRadius);
  }, [board, userLocation, calculateDistance]);

  useEffect(() => {
    getCurrentLocation();
    fetchBoardData();
    fetchThreads();
  }, [fetchBoardData, fetchThreads, getCurrentLocation]);

  useEffect(() => {
    if (board && userLocation) {
      checkAccess();
    }
  }, [board, userLocation, checkAccess]);

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

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return 'たった今';
  };

  if (loading) {
    return (
      <div className="board-detail-page loading">
        <div className="loading-content">
          <div className="spinner" />
          <p>掲示板を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="board-detail-page error">
        <div className="error-content">
          <h2>エラー</h2>
          <p>{error}</p>
          <Link href="/boards" className="button primary">
            掲示板一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, board.lat, board.lng)
    : 0;

  return (
    <div className="board-detail-page">
      <header className="board-header">
        <div className="header-content">
          <Link href="/boards" className="back-link">
            ← 掲示板一覧
          </Link>

          <div className="board-info">
            <div className="board-title">
              <span className="board-icon">{getBoardTypeIcon(board.type)}</span>
              <div>
                <h1>{board.name}</h1>
                <span className="board-type">{getBoardTypeLabel(board.type)}掲示板</span>
              </div>
            </div>

            <div className="access-status">
              {canAccess ? (
                <div className="accessible">
                  <span className="status-icon">[利用可]</span>
                  <span>アクセス可能</span>
                </div>
              ) : (
                <div className="not-accessible">
                  <span className="status-icon">[禁止]</span>
                  <span>範囲外</span>
                </div>
              )}
            </div>
          </div>

          <div className="location-info">
            <p className="description">{board.description}</p>
            <div className="distance-details">
              <span className="distance">現在地から {Math.round(distance)}m</span>
              <span className="radius">📡 アクセス範囲 {board.accessRadius}m</span>
            </div>
          </div>
        </div>
      </header>

      {!canAccess && (
        <div className="access-warning">
          <h3>[アクセス禁止] この掲示板にはアクセスできません</h3>
          <p>
            この掲示板を利用するには、{board.name}から{board.accessRadius}
            m以内にいる必要があります。 現在地からは{Math.round(distance)}m離れています。
          </p>
          <div className="warning-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                const googleMapsUrl = `https://maps.google.com/maps?q=${board.lat},${board.lng}&t=m&z=15`;
                window.open(googleMapsUrl, '_blank');
              }}
            >
              地図で場所を確認
            </button>
            <button
              type="button"
              className="button tertiary"
              onClick={() => {
                getCurrentLocation();
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }}
            >
              位置情報を再取得
            </button>
          </div>
        </div>
      )}

      <main className="board-content">
        <div className="threads-section">
          <div className="threads-header">
            <h2>投稿 ({threads.length})</h2>
            {canAccess && (
              <Link href={`/boards/${boardId}/create`} className="button primary">
                新しい投稿
              </Link>
            )}
          </div>

          {threads.length === 0 ? (
            <div className="empty-threads">
              <p>まだ投稿がありません</p>
              {canAccess && <p className="hint">最初の投稿をしてみませんか？</p>}
            </div>
          ) : (
            <div className="threads-list">
              {threads.map((thread) => (
                <article key={thread.id} className="thread-card">
                  <div className="thread-header">
                    <div className="author-info">
                      <span className="author-name">匿名ユーザー</span>
                      <span className="post-time">{getTimeAgo(thread.createdAt)}</span>
                    </div>
                    <div className="lifecycle-info">
                      <ThreadLifecycleManager
                        threadId={thread.id}
                        expiresAt={thread.expiresAt?.toISOString()}
                        isArchived={thread.isArchived}
                        restoreCount={(thread as BoardThread & { restoreCount?: number }).restoreCount || 0}
                        onRestore={() => {
                          // スレッドが復元されたらリストを更新
                          fetchThreads();
                        }}
                        className="thread-lifecycle-small"
                      />
                    </div>
                  </div>

                  <div className="thread-content">
                    <p>{thread.content}</p>
                    {thread.stickerId && (
                      <div className="sticker-info">
                        <span className="sticker">ステッカー付き</span>
                      </div>
                    )}
                  </div>

                  <div className="thread-actions">
                    {canAccess ? (
                      <Link href={`/thread/${thread.id}`} className="button small">
                        詳細を見る
                      </Link>
                    ) : (
                      <button type="button" className="button small disabled" disabled>
                        アクセス不可
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .board-detail-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .board-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 2rem 1rem;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-block;
          color: #007bff;
          text-decoration: none;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .board-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .board-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .board-icon {
          font-size: 3rem;
        }

        .board-title h1 {
          margin: 0;
          font-size: 2rem;
          color: #333;
        }

        .board-type {
          color: #666;
          font-size: 0.875rem;
        }

        .access-status {
          text-align: right;
        }

        .accessible {
          color: #28a745;
          font-weight: 600;
        }

        .not-accessible {
          color: #ffc107;
          font-weight: 600;
        }

        .status-icon {
          margin-right: 0.5rem;
        }

        .location-info {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .description {
          margin: 0 0 0.5rem 0;
          color: #666;
        }

        .distance-details {
          display: flex;
          gap: 2rem;
          font-size: 0.875rem;
          color: #666;
        }

        .access-warning {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .access-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 2rem;
          margin: 2rem 1rem;
          text-align: center;
        }

        .access-warning h3 {
          color: #856404;
          margin-bottom: 1rem;
        }

        .access-warning p {
          color: #856404;
          margin-bottom: 1.5rem;
        }

        .warning-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .board-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .threads-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .threads-header h2 {
          margin: 0;
          color: #333;
        }

        .empty-threads {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .hint {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #888;
        }

        .threads-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .thread-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;
        }

        .thread-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .thread-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-name {
          font-weight: 600;
          color: #333;
        }

        .post-time {
          color: #666;
          font-size: 0.875rem;
        }

        .lifecycle-info {
          font-size: 0.75rem;
        }
        
        .thread-lifecycle-small {
          font-size: 0.75rem;
        }

        .thread-content {
          margin-bottom: 1rem;
        }

        .thread-content p {
          margin: 0 0 0.5rem 0;
          line-height: 1.6;
          color: #333;
        }

        .sticker-info {
          font-size: 0.875rem;
          color: #17a2b8;
        }

        .thread-actions {
          display: flex;
          justify-content: flex-end;
        }

        .button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          text-align: center;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.2s;
          display: inline-block;
        }

        .button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .button.primary:hover {
          background: #0056b3;
        }

        .button.secondary {
          background: white;
          color: #6c757d;
          border-color: #6c757d;
        }

        .button.secondary:hover {
          background: #6c757d;
          color: white;
        }

        .button.tertiary {
          background: white;
          color: #28a745;
          border-color: #28a745;
        }

        .button.tertiary:hover {
          background: #28a745;
          color: white;
        }

        .button.small {
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          color: #007bff;
          border-color: #007bff;
        }

        .button.small:hover {
          background: #007bff;
          color: white;
        }

        .button.disabled {
          background: #f8f9fa;
          color: #6c757d;
          border-color: #dee2e6;
          cursor: not-allowed;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
        }

        .loading-content {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
        }

        .error-content {
          text-align: center;
          padding: 2rem;
          border: 1px solid #dc3545;
          border-radius: 8px;
          background: #f8d7da;
        }

        @media (max-width: 768px) {
          .board-info {
            flex-direction: column;
            gap: 1rem;
          }
          
          .access-status {
            text-align: left;
          }
          
          .threads-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .warning-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
