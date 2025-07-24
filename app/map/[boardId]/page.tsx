'use client';

import type { Board } from '@/app/types/domain';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BoardMapPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        // 統合APIから該当掲示板を取得
        const response = await fetch('/api/boards/integrated');
        if (response.ok) {
          const data = await response.json();
          const foundBoard = data.boards.find((b: Board) => b.id === boardId);
          if (foundBoard) {
            setBoard(foundBoard);
          } else {
            setError('掲示板が見つかりません');
          }
        } else {
          setError('掲示板情報の取得に失敗しました');
        }
      } catch {
        setError('ネットワークエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

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
      <div className="map-page loading">
        <div className="loading-content">
          <div className="spinner" />
          <p>地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="map-page error">
        <div className="error-content">
          <h2>エラー</h2>
          <p>{error || '掲示板が見つかりません'}</p>
          <Link href="/boards" className="button primary">
            掲示板一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  // アクセス範囲に基づいてズームレベルを決定
  let zoom = 15; // デフォルトズーム
  if (board.accessRadius >= 3000)
    zoom = 12; // 3km以上（区レベル）
  else if (board.accessRadius >= 1500)
    zoom = 13; // 1.5km以上（駅レベル）
  else if (board.accessRadius >= 1000)
    zoom = 14; // 1km以上（公園レベル）
  else zoom = 15; // それ以下

  const mapSrc = `https://maps.google.com/maps?q=${board.lat},${board.lng}&t=m&z=${zoom}&output=embed&hl=ja`;

  return (
    <div className="map-page">
      <header className="page-header">
        <Link href="/boards" className="back-link">
          ← 掲示板一覧に戻る
        </Link>
        <div className="board-info">
          <div className="board-icon">{getBoardTypeIcon(board.type)}</div>
          <div className="board-details">
            <h1>{board.name}</h1>
            <span className="board-type">{getBoardTypeLabel(board.type)}</span>
          </div>
        </div>
        <p className="description">{board.description}</p>
      </header>

      <div className="map-container">
        <iframe
          src={mapSrc}
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${board.name}の地図`}
        />
      </div>

      <div className="location-info">
        <h2>位置情報</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">緯度</span>
            <span className="value">{board.lat.toFixed(6)}</span>
          </div>
          <div className="info-item">
            <span className="label">経度</span>
            <span className="value">{board.lng.toFixed(6)}</span>
          </div>
          <div className="info-item">
            <span className="label">アクセス範囲</span>
            <span className="value">{board.accessRadius}m</span>
          </div>
        </div>
      </div>

      <div className="actions">
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            const googleMapsUrl = `https://maps.google.com/maps?q=${board.lat},${board.lng}&t=m&z=15`;
            window.open(googleMapsUrl, '_blank');
          }}
        >
          Googleマップで開く
        </button>
        <button
          type="button"
          className="button tertiary"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: board.name,
                text: `${board.name}の場所をチェック！`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('URLをクリップボードにコピーしました');
            }
          }}
        >
          場所を共有
        </button>
      </div>

      <style jsx>{`
        .map-page {
          min-height: 100vh;
          padding: 1rem;
          max-width: 800px;
          margin: 0 auto;
          background: rgb(var(--background-rgb));
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-block;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--text-primary);
        }

        .board-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .board-icon {
          font-size: 2rem;
        }

        .board-details h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .board-type {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .map-container {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }

        .location-info {
          background: rgb(var(--card-bg-rgb));
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }

        .location-info h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgb(var(--background-rgb));
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .label {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .value {
          color: var(--text-primary);
          font-family: monospace;
        }

        .actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .button {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          text-align: center;
          font-size: 0.875rem;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.2s;
          flex: 1;
          min-width: 140px;
        }

        .button.primary {
          background: rgb(230, 168, 0);
          color: white;
          border-color: rgb(230, 168, 0);
        }

        .button.primary:hover {
          background: rgba(230, 168, 0, 0.9);
          transform: translateY(-1px);
        }

        .button.secondary {
          background: rgb(var(--card-bg-rgb));
          color: rgb(230, 168, 0);
          border-color: rgb(230, 168, 0);
        }

        .button.secondary:hover {
          background: rgb(230, 168, 0);
          color: white;
        }

        .button.tertiary {
          background: rgb(var(--card-bg-rgb));
          color: var(--text-primary);
          border-color: var(--border-color);
        }

        .button.tertiary:hover {
          background: var(--border-color);
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
        }

        .loading-content {
          text-align: center;
          color: var(--text-secondary);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top: 4px solid rgb(230, 168, 0);
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
          color: #721c24;
        }

        .error-content h2 {
          margin: 0 0 1rem 0;
          color: #721c24;
        }

        .error-content p {
          margin: 0 0 1.5rem 0;
        }

        @media (max-width: 768px) {
          .map-page {
            padding: 0.5rem;
          }

          .board-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }

          .button {
            flex: none;
          }
        }
      `}</style>
    </div>
  );
}
