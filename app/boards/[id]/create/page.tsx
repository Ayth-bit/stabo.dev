'use client';

import type { Board } from '@/app/types/domain';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function CreateThreadPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState(false);

  // フォームの状態
  const [content, setContent] = useState('');
  const [useSticker, setUseSticker] = useState(false);
  const [expiryDays, setExpiryDays] = useState(3);

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
  }, [fetchBoardData, getCurrentLocation]);

  useEffect(() => {
    if (board && userLocation) {
      checkAccess();
    }
  }, [board, userLocation, checkAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    if (!canAccess) {
      setError('この掲示板にアクセスできません');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/boards/${boardId}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          useSticker,
          expiryDays,
          userLocation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 作成されたスレッドの詳細ページに遷移
        router.push(`/thread/${data.thread.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '投稿に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
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
      <div className="create-thread-page loading">
        <div className="loading-content">
          <div className="spinner" />
          <p>掲示板情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="create-thread-page error">
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

  if (!canAccess && board && userLocation) {
    const distance = calculateDistance(userLocation.lat, userLocation.lng, board.lat, board.lng);

    return (
      <div className="create-thread-page">
        <div className="access-denied">
          <h2>[投稿禁止] 投稿できません</h2>
          <div className="board-info">
            <span className="board-icon">{getBoardTypeIcon(board.type)}</span>
            <h3>{board.name}</h3>
          </div>
          <p>
            この掲示板に投稿するには、{board.name}から{board.accessRadius}
            m以内にいる必要があります。
          </p>
          <p>
            現在地からは <strong>{Math.round(distance)}m</strong> 離れています。
          </p>
          <div className="actions">
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
            <Link href={`/boards/${boardId}`} className="button primary">
              掲示板に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-thread-page">
      <header className="page-header">
        <Link href={`/boards/${boardId}`} className="back-link">
          ← {board?.name}掲示板に戻る
        </Link>

        <div className="board-info">
          <div className="board-title">
            <span className="board-icon">{board && getBoardTypeIcon(board.type)}</span>
            <div>
              <h1>新しい投稿</h1>
              <span className="board-type">
                {board && getBoardTypeLabel(board.type)}掲示板: {board?.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="form-container">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="content" className="form-label">
              投稿内容 *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="あなたの投稿内容を入力してください..."
              className="form-textarea"
              rows={6}
              maxLength={500}
              required
            />
            <div className="char-count">{content.length} / 500文字</div>
          </div>

          <div className="form-options">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useSticker}
                  onChange={(e) => setUseSticker(e.target.checked)}
                />
                <span className="checkmark" />
                ステッカーを使用する (投稿を目立たせる)
              </label>
              <p className="form-hint">
                ステッカーを使用すると、投稿がより目立ち、長期間表示されます
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="expiryDays" className="form-label">
                投稿の有効期限
              </label>
              <select
                id="expiryDays"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number.parseInt(e.target.value))}
                className="form-select"
              >
                <option value={1}>1日</option>
                <option value={3}>3日（推奨）</option>
                <option value={7}>7日</option>
                <option value={14}>14日</option>
              </select>
              <p className="form-hint">期限が過ぎると投稿は自動的に削除されます</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <Link href={`/boards/${boardId}`} className="button secondary">
              キャンセル
            </Link>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || !content.trim()}
            >
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>

        <div className="posting-guide">
          <h3>投稿ガイドライン</h3>
          <ul>
            <li>他の利用者に配慮した内容を投稿してください</li>
            <li>個人情報や連絡先の公開は避けてください</li>
            <li>商業的な宣伝は禁止されています</li>
            <li>不適切な内容は運営により削除される場合があります</li>
          </ul>
        </div>
      </main>

      <style jsx>{`
        .create-thread-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 2rem 1rem;
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

        .board-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .board-icon {
          font-size: 2.5rem;
        }

        .board-title h1 {
          margin: 0;
          font-size: 1.75rem;
          color: #333;
        }

        .board-type {
          color: #666;
          font-size: 0.875rem;
        }

        .form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .create-form {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          line-height: 1.5;
          resize: vertical;
          font-family: inherit;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .char-count {
          text-align: right;
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .form-options {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
        }

        .checkbox-label input[type="checkbox"] {
          margin-right: 0.5rem;
          transform: scale(1.2);
        }

        .form-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .form-hint {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: #666;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #f5c6cb;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          text-align: center;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .button.primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .button.primary:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
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

        .posting-guide {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .posting-guide h3 {
          margin-top: 0;
          color: #333;
        }

        .posting-guide ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .posting-guide li {
          margin-bottom: 0.5rem;
          color: #666;
        }

        .access-denied {
          max-width: 600px;
          margin: 2rem auto;
          background: white;
          border-radius: 8px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .access-denied h2 {
          color: #dc3545;
          margin-bottom: 2rem;
        }

        .access-denied .board-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .access-denied .board-icon {
          font-size: 3rem;
        }

        .access-denied h3 {
          margin: 0;
          color: #333;
        }

        .access-denied p {
          color: #666;
          margin-bottom: 1rem;
        }

        .access-denied .actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
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
          .form-actions {
            flex-direction: column;
          }
          
          .access-denied .actions {
            flex-direction: column;
          }
          
          .create-form, .posting-guide {
            margin: 0 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
