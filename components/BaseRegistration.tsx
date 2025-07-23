'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface BaseRegistrationProps {
  userId: string;
  currentBase?: {
    lat: number;
    lng: number;
    radius: number;
  };
  onUpdate: () => void;
}

export function BaseRegistration({ userId, currentBase, onUpdate }: BaseRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [radius, setRadius] = useState(1000);

  const getCurrentLocation = () => {
    setError(null);
    setIsRegistering(true);

    if (!navigator.geolocation) {
      setError('このブラウザでは位置情報機能がサポートされていません');
      setIsRegistering(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 東京23区内かチェック（簡易的な範囲チェック）
        if (latitude < 35.5 || latitude > 35.9 || longitude < 139.3 || longitude > 139.9) {
          setError('東京23区外では拠点を登録できません');
          setIsRegistering(false);
          return;
        }

        setLocation({
          lat: latitude,
          lng: longitude,
          address: `緯度: ${latitude.toFixed(6)}, 経度: ${longitude.toFixed(6)}`
        });
        setShowForm(true);
        setIsRegistering(false);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('位置情報の使用が拒否されました。ブラウザの設定で位置情報を許可してください。');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('位置情報が取得できませんでした。');
            break;
          case error.TIMEOUT:
            setError('位置情報の取得がタイムアウトしました。');
            break;
          default:
            setError('位置情報の取得に失敗しました。');
            break;
        }
        setIsRegistering(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const registerBase = async () => {
    if (!location) return;

    setIsRegistering(true);
    setError(null);

    try {
      // まずユーザーが存在するかチェック
      const { data: existingUser } = await supabase
        .from('users_extended')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        // ユーザーが存在しない場合、まず作成
        const { error: insertError } = await supabase
          .from('users_extended')
          .insert({
            id: userId,
            display_name: 'ユーザー',
            qr_code: `qr_${userId.slice(0, 8)}_${Date.now()}`,
            home_base_lat: location.lat,
            home_base_lng: location.lng,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }
      } else {
        // ユーザーが存在する場合、更新
        const { error: updateError } = await supabase
          .from('users_extended')
          .update({
            home_base_lat: location.lat,
            home_base_lng: location.lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }
      }

      onUpdate();
      setShowForm(false);
      setLocation(null);
    } catch (err) {
      console.error('拠点登録エラー:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as Error).message 
        : '不明なエラーが発生しました';
      setError('拠点の登録に失敗しました: ' + errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const removeBase = async () => {
    if (!currentBase) return;

    setIsRegistering(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users_extended')
        .update({
          home_base_lat: null,
          home_base_lng: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      onUpdate();
    } catch (err) {
      console.error('拠点削除エラー:', err);
      setError('拠点の削除に失敗しました: ' + (err as Error).message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="base-registration">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {currentBase ? (
        <div className="current-base">
          <h4>登録済み拠点</h4>
          <div className="base-details">
            <p><strong>緯度:</strong> {currentBase.lat.toFixed(6)}</p>
            <p><strong>経度:</strong> {currentBase.lng.toFixed(6)}</p>
            <p><strong>活動半径:</strong> {currentBase.radius}m</p>
          </div>
          <div className="base-actions">
            <button 
              className="change-button"
              onClick={getCurrentLocation}
              disabled={isRegistering}
            >
              {isRegistering ? '位置取得中...' : '拠点を変更'}
            </button>
            <button 
              className="remove-button"
              onClick={removeBase}
              disabled={isRegistering}
            >
              拠点を削除
            </button>
          </div>
        </div>
      ) : (
        <div className="no-base">
          <h4>拠点未登録</h4>
          <p>現在地を活動拠点として登録できます。拠点は通知の配信やコンテンツのフィルタリングに使用されます。</p>
          <button 
            className="register-button"
            onClick={getCurrentLocation}
            disabled={isRegistering}
          >
            {isRegistering ? '位置取得中...' : '現在地を拠点として登録'}
          </button>
        </div>
      )}

      {showForm && location && (
        <div className="registration-form">
          <h4>拠点登録確認</h4>
          <div className="location-info">
            <p><strong>登録予定の拠点:</strong></p>
            <p>{location.address}</p>
          </div>
          
          <div className="radius-setting">
            <label htmlFor="radius">活動半径:</label>
            <select
              id="radius"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              disabled={isRegistering}
            >
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
              <option value={3000}>3km</option>
            </select>
            <p className="radius-note">
              この範囲内の通知や情報を優先的に受け取れます
            </p>
          </div>

          <div className="form-actions">
            <button 
              className="confirm-button"
              onClick={registerBase}
              disabled={isRegistering}
            >
              {isRegistering ? '登録中...' : '拠点を登録'}
            </button>
            <button 
              className="cancel-button"
              onClick={() => {
                setShowForm(false);
                setLocation(null);
                setError(null);
              }}
              disabled={isRegistering}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .base-registration {
          background: rgb(var(--background-rgb));
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          border: 1px solid #fecaca;
        }

        .current-base, .no-base {
          margin-bottom: 1rem;
        }

        .current-base h4, .no-base h4 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .base-details {
          background: rgba(40, 167, 69, 0.1);
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border-left: 4px solid #28a745;
        }

        .base-details p {
          margin: 0.25rem 0;
          color: var(--text-primary);
        }

        .base-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .no-base p {
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .registration-form {
          background: rgba(230, 168, 0, 0.1);
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
          border: 1px solid rgba(230, 168, 0, 0.3);
        }

        .registration-form h4 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .location-info {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .location-info p {
          margin: 0.25rem 0;
          color: var(--text-primary);
        }

        .radius-setting {
          margin-bottom: 1.5rem;
        }

        .radius-setting label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .radius-setting select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: white;
          color: var(--text-primary);
        }

        .radius-note {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .register-button, .change-button, .confirm-button {
          background: rgb(230, 168, 0);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .register-button:hover, .change-button:hover, .confirm-button:hover {
          background: rgba(230, 168, 0, 0.9);
          transform: translateY(-1px);
        }

        .register-button:disabled, .change-button:disabled, .confirm-button:disabled {
          background: var(--border-color);
          color: var(--text-tertiary);
          cursor: not-allowed;
          transform: none;
        }

        .remove-button, .cancel-button {
          background: white;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .remove-button:hover, .cancel-button:hover {
          background: #f8f9fa;
        }

        .remove-button:disabled, .cancel-button:disabled {
          background: var(--border-color);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .base-registration {
            padding: 1rem;
          }

          .base-actions, .form-actions {
            flex-direction: column;
          }

          .register-button, .change-button, .confirm-button, 
          .remove-button, .cancel-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}