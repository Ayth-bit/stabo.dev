const TOKYO_23_WARDS = [
  { name: '千代田区', lat: 35.6941, lng: 139.7534, radius: 2.5 },
  { name: '中央区', lat: 35.6702, lng: 139.7705, radius: 3.0 },
  { name: '港区', lat: 35.6584, lng: 139.7519, radius: 4.0 },
  { name: '新宿区', lat: 35.694, lng: 139.7036, radius: 3.5 },
  { name: '文京区', lat: 35.7081, lng: 139.7514, radius: 3.0 },
  { name: '台東区', lat: 35.7108, lng: 139.7794, radius: 3.0 },
  { name: '墨田区', lat: 35.71, lng: 139.8014, radius: 3.5 },
  { name: '江東区', lat: 35.673, lng: 139.8176, radius: 4.5 },
  { name: '品川区', lat: 35.6092, lng: 139.7301, radius: 4.0 },
  { name: '目黒区', lat: 35.6417, lng: 139.6984, radius: 3.5 },
  { name: '大田区', lat: 35.5616, lng: 139.7163, radius: 5.5 },
  { name: '世田谷区', lat: 35.6464, lng: 139.6537, radius: 6.0 },
  { name: '渋谷区', lat: 35.658, lng: 139.7016, radius: 3.5 },
  { name: '中野区', lat: 35.7094, lng: 139.665, radius: 4.0 },
  { name: '杉並区', lat: 35.7002, lng: 139.6363, radius: 5.0 },
  { name: '豊島区', lat: 35.7295, lng: 139.7157, radius: 3.5 },
  { name: '北区', lat: 35.7537, lng: 139.7384, radius: 4.5 },
  { name: '荒川区', lat: 35.7362, lng: 139.7832, radius: 3.0 },
  { name: '板橋区', lat: 35.7516, lng: 139.7085, radius: 5.0 },
  { name: '練馬区', lat: 35.7358, lng: 139.6519, radius: 6.5 },
  { name: '足立区', lat: 35.7751, lng: 139.8048, radius: 7.0 },
  { name: '葛飾区', lat: 35.7448, lng: 139.8484, radius: 5.5 },
  { name: '江戸川区', lat: 35.7068, lng: 139.8683, radius: 6.0 },
];

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
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
};

export const isWithinTokyo23 = (latitude: number, longitude: number): boolean => {
  return TOKYO_23_WARDS.some((ward) => {
    const distance = calculateDistance(latitude, longitude, ward.lat, ward.lng);
    return distance <= ward.radius;
  });
};

export const checkLocationAccess = (): Promise<{
  latitude: number;
  longitude: number;
  allowed: boolean;
  error?: string;
  nearestWard?: string;
  distanceToNearestWard?: number;
}> => {
  return new Promise((resolve) => {
    console.log('[LOCATION] 位置情報の取得を開始');
    console.log('[LOCATION] 利用可能な位置情報ソース:', {
      geolocation: !!navigator.geolocation,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      online: navigator.onLine,
    });

    if (!navigator.geolocation) {
      console.error('[LOCATION] ブラウザが位置情報に対応していません');
      resolve({
        latitude: 0,
        longitude: 0,
        allowed: false,
        error: 'お使いのブラウザは位置情報に対応していません。',
      });
      return;
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 0,
    };

    console.log('[LOCATION] 位置情報取得オプション:', options);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('[LOCATION] 位置情報取得成功:');
        console.log(`  緯度: ${latitude}`);
        console.log(`  経度: ${longitude}`);
        console.log(`  精度: ${accuracy}m`);
        console.log(`  取得時刻: ${new Date(position.timestamp).toLocaleString()}`);

        let nearestWard = '';
        let shortestDistance = Number.POSITIVE_INFINITY;
        const wardDistances = TOKYO_23_WARDS.map((ward) => {
          const distance = calculateDistance(latitude, longitude, ward.lat, ward.lng);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestWard = ward.name;
          }
          return {
            ward: ward.name,
            distance: distance,
            radius: ward.radius,
            inRange: distance <= ward.radius,
          };
        });

        console.log('[LOCATION] 各区からの距離:');
        for (const w of wardDistances) {
          const status = w.inRange ? 'OK' : 'NG';
          console.log(`  ${w.ward}: ${w.distance.toFixed(3)}km (範囲: ${w.radius}km) [${status}]`);
        }

        const allowed = isWithinTokyo23(latitude, longitude);
        console.log(`[LOCATION] アクセス判定: ${allowed ? '許可' : '拒否'}`);
        console.log(`[LOCATION] 最寄り区: ${nearestWard} (${shortestDistance.toFixed(3)}km)`);

        resolve({
          latitude,
          longitude,
          allowed,
          nearestWard,
          distanceToNearestWard: shortestDistance,
          error: allowed ? undefined : 'このサービスは対象地域内でのみご利用いただけます。',
        });
      },
      (error) => {
        console.error('[LOCATION] 位置情報取得エラー:');
        console.error('  エラーコード:', error.code);
        console.error('  エラーメッセージ:', error.message);
        console.error('  エラー種別:', {
          PERMISSION_DENIED: error.code === 1,
          POSITION_UNAVAILABLE: error.code === 2,
          TIMEOUT: error.code === 3,
        });

        let errorMessage = '位置情報の取得に失敗しました。';
        
        if (error.code === 1) {
          errorMessage = '位置情報の利用が拒否されました。ブラウザの設定を確認してください。';
        } else if (error.code === 2) {
          // macOSのCoreLocationエラーの場合の詳細メッセージ
          console.warn('[LOCATION] macOSの位置情報サービス問題を検出');
          errorMessage = `位置情報を取得できませんでした。
          
macOSの設定を確認してください：
1. システム設定 → プライバシーとセキュリティ → 位置情報サービス
2. 位置情報サービスを有効にする
3. ブラウザ（Chrome/Safari等）の位置情報アクセスを許可

開発用フォールバック座標（東京駅）を使用します。`;
          
          // 開発環境では自動的に東京駅の座標を使用
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('[LOCATION] 開発環境フォールバック: 東京駅座標を使用');
            resolve({
              latitude: 35.6812,
              longitude: 139.7671,
              allowed: true,
              nearestWard: '東京駅周辺',
              distanceToNearestWard: 0,
              error: undefined,
            });
            return;
          }
        } else if (error.code === 3) {
          errorMessage =
            '位置情報の取得がタイムアウトしました。しばらくしてから再試行してください。';
        }

        resolve({
          latitude: 0,
          longitude: 0,
          allowed: false,
          error: errorMessage,
        });
      },
      options
    );
  });
};
