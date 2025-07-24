'use client';

import { checkLocationAccess } from '@/utils/locationCheck';
import { useEffect, useState } from 'react';

interface LocationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface LocationState {
  loading: boolean;
  allowed: boolean;
  error?: string;
  latitude?: number;
  longitude?: number;
  nearestWard?: string;
  distanceToNearestWard?: number;
}

const LocationGuard: React.FC<LocationGuardProps> = ({ children, fallback }) => {
  const [locationState, setLocationState] = useState<LocationState>({
    loading: true,
    allowed: false,
  });

  useEffect(() => {
    const checkLocation = async () => {
      try {
        const result = await checkLocationAccess();
        setLocationState({
          loading: false,
          allowed: result.allowed,
          error: result.error,
          latitude: result.latitude,
          longitude: result.longitude,
          nearestWard: result.nearestWard,
          distanceToNearestWard: result.distanceToNearestWard,
        });
      } catch {
        setLocationState({
          loading: false,
          allowed: false,
          error: '位置情報の確認中にエラーが発生しました。',
        });
      }
    };

    checkLocation();
  }, []);

  if (locationState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">位置情報を確認しています...</p>
          <p className="text-sm text-gray-500 mt-2">
            このサービスは東京23区内でのみご利用いただけます
          </p>
        </div>
      </div>
    );
  }

  if (!locationState.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>位置情報アクセス制限</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">サービス利用制限</h2>
          <p className="text-gray-600 mb-4">
            {locationState.error || 'このサービスは東京23区内でのみご利用いただけます。'}
          </p>

          {locationState.nearestWard && locationState.distanceToNearestWard && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                最寄りの対象区域: <strong>{locationState.nearestWard}</strong>
              </p>
              <p className="text-sm text-gray-600">
                距離: 約{locationState.distanceToNearestWard.toFixed(1)}km
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              再度確認する
            </button>
            <p className="text-xs text-gray-500">
              位置情報の利用を許可し、東京23区内でアクセスしてください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LocationGuard;
