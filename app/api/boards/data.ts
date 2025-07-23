// 掲示板データ定義ファイル
// APIルートから共通で使用される掲示板データ

import { Board } from '@/app/types/domain';

// 山手線駅データ (閲覧1.5km、投稿300m)
export const YAMANOTE_STATIONS: Board[] = [
  { id: 'station-shibuya', name: '渋谷駅', type: 'station', lat: 35.6580, lng: 139.7016, accessRadius: 300, viewRadius: 1500, description: '渋谷駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-shinjuku', name: '新宿駅', type: 'station', lat: 35.6896, lng: 139.7006, accessRadius: 300, viewRadius: 1500, description: '新宿駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-ikebukuro', name: '池袋駅', type: 'station', lat: 35.7295, lng: 139.7109, accessRadius: 300, viewRadius: 1500, description: '池袋駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-tokyo', name: '東京駅', type: 'station', lat: 35.6812, lng: 139.7671, accessRadius: 300, viewRadius: 1500, description: '東京駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-ueno', name: '上野駅', type: 'station', lat: 35.7138, lng: 139.7774, accessRadius: 300, viewRadius: 1500, description: '上野駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-osaki', name: '大崎駅', type: 'station', lat: 35.6197, lng: 139.7286, accessRadius: 300, viewRadius: 1500, description: '大崎駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-gotanda', name: '五反田駅', type: 'station', lat: 35.6258, lng: 139.7238, accessRadius: 300, viewRadius: 1500, description: '五反田駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-meguro', name: '目黒駅', type: 'station', lat: 35.6333, lng: 139.7156, accessRadius: 300, viewRadius: 1500, description: '目黒駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-ebisu', name: '恵比寿駅', type: 'station', lat: 35.6465, lng: 139.7100, accessRadius: 300, viewRadius: 1500, description: '恵比寿駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-harajuku', name: '原宿駅', type: 'station', lat: 35.6702, lng: 139.7026, accessRadius: 300, viewRadius: 1500, description: '原宿駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-yoyogi', name: '代々木駅', type: 'station', lat: 35.6837, lng: 139.7020, accessRadius: 300, viewRadius: 1500, description: '代々木駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-shimbashi', name: '新橋駅', type: 'station', lat: 35.6657, lng: 139.7584, accessRadius: 300, viewRadius: 1500, description: '新橋駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-yurakucho', name: '有楽町駅', type: 'station', lat: 35.6751, lng: 139.7631, accessRadius: 300, viewRadius: 1500, description: '有楽町駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-kanda', name: '神田駅', type: 'station', lat: 35.6916, lng: 139.7708, accessRadius: 300, viewRadius: 1500, description: '神田駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-akihabara', name: '秋葉原駅', type: 'station', lat: 35.6984, lng: 139.7731, accessRadius: 300, viewRadius: 1500, description: '秋葉原駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-okachimachi', name: '御徒町駅', type: 'station', lat: 35.7077, lng: 139.7742, accessRadius: 300, viewRadius: 1500, description: '御徒町駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-nippori', name: '日暮里駅', type: 'station', lat: 35.7277, lng: 139.7710, accessRadius: 300, viewRadius: 1500, description: '日暮里駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-nishi-nippori', name: '西日暮里駅', type: 'station', lat: 35.7323, lng: 139.7663, accessRadius: 300, viewRadius: 1500, description: '西日暮里駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-tabata', name: '田端駅', type: 'station', lat: 35.7378, lng: 139.7607, accessRadius: 300, viewRadius: 1500, description: '田端駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-komagome', name: '駒込駅', type: 'station', lat: 35.7364, lng: 139.7468, accessRadius: 300, viewRadius: 1500, description: '駒込駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-sugamo', name: '巣鴨駅', type: 'station', lat: 35.7334, lng: 139.7391, accessRadius: 300, viewRadius: 1500, description: '巣鴨駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-otsuka', name: '大塚駅', type: 'station', lat: 35.7316, lng: 139.7289, accessRadius: 300, viewRadius: 1500, description: '大塚駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-mejiro', name: '目白駅', type: 'station', lat: 35.7219, lng: 139.7062, accessRadius: 300, viewRadius: 1500, description: '目白駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-takadanobaba', name: '高田馬場駅', type: 'station', lat: 35.7127, lng: 139.7038, accessRadius: 300, viewRadius: 1500, description: '高田馬場駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-shin-okubo', name: '新大久保駅', type: 'station', lat: 35.7008, lng: 139.7003, accessRadius: 300, viewRadius: 1500, description: '新大久保駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-hamamatsucho', name: '浜松町駅', type: 'station', lat: 35.6555, lng: 139.7572, accessRadius: 300, viewRadius: 1500, description: '浜松町駅周辺の情報交換', createdAt: new Date() },
  { id: 'station-tamachi', name: '田町駅', type: 'station', lat: 35.6456, lng: 139.7477, accessRadius: 300, viewRadius: 1500, description: '田町駅周辺の情報交換', createdAt: new Date() }
];

// 東京23区データ (閲覧1.5km、投稿300m)
export const TOKYO_WARDS: Board[] = [
  { id: 'ward-shibuya', name: '渋谷区', type: 'ward', lat: 35.6614, lng: 139.7044, accessRadius: 300, viewRadius: 1500, description: '渋谷区内の地域情報', createdAt: new Date() },
  { id: 'ward-shinjuku', name: '新宿区', type: 'ward', lat: 35.6938, lng: 139.7036, accessRadius: 300, viewRadius: 1500, description: '新宿区内の地域情報', createdAt: new Date() },
  { id: 'ward-minato', name: '港区', type: 'ward', lat: 35.6587, lng: 139.7515, accessRadius: 300, viewRadius: 1500, description: '港区内の地域情報', createdAt: new Date() },
  { id: 'ward-chiyoda', name: '千代田区', type: 'ward', lat: 35.6938, lng: 139.7536, accessRadius: 300, viewRadius: 1500, description: '千代田区内の地域情報', createdAt: new Date() },
  { id: 'ward-chuo', name: '中央区', type: 'ward', lat: 35.6704, lng: 139.7706, accessRadius: 300, viewRadius: 1500, description: '中央区内の地域情報', createdAt: new Date() },
  { id: 'ward-taito', name: '台東区', type: 'ward', lat: 35.7070, lng: 139.7787, accessRadius: 300, viewRadius: 1500, description: '台東区内の地域情報', createdAt: new Date() },
  { id: 'ward-sumida', name: '墨田区', type: 'ward', lat: 35.7100, lng: 139.8017, accessRadius: 300, viewRadius: 1500, description: '墨田区内の地域情報', createdAt: new Date() },
  { id: 'ward-koto', name: '江東区', type: 'ward', lat: 35.6731, lng: 139.8170, accessRadius: 300, viewRadius: 1500, description: '江東区内の地域情報', createdAt: new Date() },
  { id: 'ward-shinagawa', name: '品川区', type: 'ward', lat: 35.6092, lng: 139.7301, accessRadius: 300, viewRadius: 1500, description: '品川区内の地域情報', createdAt: new Date() },
  { id: 'ward-meguro', name: '目黒区', type: 'ward', lat: 35.6333, lng: 139.7156, accessRadius: 300, viewRadius: 1500, description: '目黒区内の地域情報', createdAt: new Date() },
  { id: 'ward-ota', name: '大田区', type: 'ward', lat: 35.5614, lng: 139.7164, accessRadius: 300, viewRadius: 1500, description: '大田区内の地域情報', createdAt: new Date() },
  { id: 'ward-setagaya', name: '世田谷区', type: 'ward', lat: 35.6464, lng: 139.6533, accessRadius: 300, viewRadius: 1500, description: '世田谷区内の地域情報', createdAt: new Date() },
  { id: 'ward-nakano', name: '中野区', type: 'ward', lat: 35.7092, lng: 139.6658, accessRadius: 300, viewRadius: 1500, description: '中野区内の地域情報', createdAt: new Date() },
  { id: 'ward-suginami', name: '杉並区', type: 'ward', lat: 35.6995, lng: 139.6366, accessRadius: 300, viewRadius: 1500, description: '杉並区内の地域情報', createdAt: new Date() },
  { id: 'ward-toshima', name: '豊島区', type: 'ward', lat: 35.7295, lng: 139.7171, accessRadius: 300, viewRadius: 1500, description: '豊島区内の地域情報', createdAt: new Date() },
  { id: 'ward-kita', name: '北区', type: 'ward', lat: 35.7539, lng: 139.7366, accessRadius: 300, viewRadius: 1500, description: '北区内の地域情報', createdAt: new Date() },
  { id: 'ward-arakawa', name: '荒川区', type: 'ward', lat: 35.7362, lng: 139.7831, accessRadius: 300, viewRadius: 1500, description: '荒川区内の地域情報', createdAt: new Date() },
  { id: 'ward-itabashi', name: '板橋区', type: 'ward', lat: 35.7510, lng: 139.7084, accessRadius: 300, viewRadius: 1500, description: '板橋区内の地域情報', createdAt: new Date() },
  { id: 'ward-nerima', name: '練馬区', type: 'ward', lat: 35.7353, lng: 139.6533, accessRadius: 300, viewRadius: 1500, description: '練馬区内の地域情報', createdAt: new Date() },
  { id: 'ward-adachi', name: '足立区', type: 'ward', lat: 35.7756, lng: 139.8045, accessRadius: 300, viewRadius: 1500, description: '足立区内の地域情報', createdAt: new Date() },
  { id: 'ward-katsushika', name: '葛飾区', type: 'ward', lat: 35.7441, lng: 139.8482, accessRadius: 300, viewRadius: 1500, description: '葛飾区内の地域情報', createdAt: new Date() },
  { id: 'ward-edogawa', name: '江戸川区', type: 'ward', lat: 35.7067, lng: 139.8681, accessRadius: 300, viewRadius: 1500, description: '江戸川区内の地域情報', createdAt: new Date() }
];

// 都立公園データ (閲覧1.5km、投稿300m) - 指定の20箇所
export const TOKYO_PARKS: Board[] = [
  { id: 'park-ueno', name: '上野恩賜公園', type: 'park', lat: 35.7146, lng: 139.7740, accessRadius: 300, viewRadius: 1500, description: '上野恩賜公園内の情報交換', createdAt: new Date() },
  { id: 'park-yoyogi', name: '代々木公園', type: 'park', lat: 35.6732, lng: 139.6958, accessRadius: 300, viewRadius: 1500, description: '代々木公園内の情報交換', createdAt: new Date() },
  { id: 'park-inokashira', name: '井の頭恩賜公園', type: 'park', lat: 35.7008, lng: 139.5797, accessRadius: 300, viewRadius: 1500, description: '井の頭恩賜公園内の情報交換', createdAt: new Date() },
  { id: 'park-kasai', name: '葛西臨海公園', type: 'park', lat: 35.6450, lng: 139.8585, accessRadius: 300, viewRadius: 1500, description: '葛西臨海公園内の情報交換', createdAt: new Date() },
  { id: 'park-komazawa', name: '駒沢オリンピック公園', type: 'park', lat: 35.6281, lng: 139.6658, accessRadius: 300, viewRadius: 1500, description: '駒沢オリンピック公園内の情報交換', createdAt: new Date() },
  { id: 'park-toneri', name: '舎人公園', type: 'park', lat: 35.7890, lng: 139.7779, accessRadius: 300, viewRadius: 1500, description: '舎人公園内の情報交換', createdAt: new Date() },
  { id: 'park-koganei', name: '小金井公園', type: 'park', lat: 35.7069, lng: 139.5065, accessRadius: 300, viewRadius: 1500, description: '小金井公園内の情報交換', createdAt: new Date() },
  { id: 'park-shakujii', name: '石神井公園', type: 'park', lat: 35.7406, lng: 139.6065, accessRadius: 300, viewRadius: 1500, description: '石神井公園内の情報交換', createdAt: new Date() },
  { id: 'park-kinuta', name: '砧公園', type: 'park', lat: 35.6311, lng: 139.6281, accessRadius: 300, viewRadius: 1500, description: '砧公園内の情報交換', createdAt: new Date() },
  { id: 'park-kiba', name: '木場公園', type: 'park', lat: 35.6732, lng: 139.8070, accessRadius: 300, viewRadius: 1500, description: '木場公園内の情報交換', createdAt: new Date() },
  { id: 'park-shinozaki', name: '篠崎公園', type: 'park', lat: 35.6776, lng: 139.8778, accessRadius: 300, viewRadius: 1500, description: '篠崎公園内の情報交換', createdAt: new Date() },
  { id: 'park-yumenoshima', name: '夢の島公園', type: 'park', lat: 35.6458, lng: 139.8283, accessRadius: 300, viewRadius: 1500, description: '夢の島公園内の情報交換', createdAt: new Date() },
  { id: 'park-mizumoto', name: '水元公園', type: 'park', lat: 35.7694, lng: 139.8439, accessRadius: 300, viewRadius: 1500, description: '水元公園内の情報交換', createdAt: new Date() },
  { id: 'park-musashino', name: '武蔵野公園', type: 'park', lat: 35.6685, lng: 139.5248, accessRadius: 300, viewRadius: 1500, description: '武蔵野公園内の情報交換', createdAt: new Date() },
  { id: 'park-musashikokubunji', name: '武蔵国分寺公園', type: 'park', lat: 35.7019, lng: 139.4598, accessRadius: 300, viewRadius: 1500, description: '武蔵国分寺公園内の情報交換', createdAt: new Date() },
  { id: 'park-nogawa', name: '野川公園', type: 'park', lat: 35.6658, lng: 139.5316, accessRadius: 300, viewRadius: 1500, description: '野川公園内の情報交換', createdAt: new Date() },
  { id: 'park-hikarigaoka', name: '光が丘公園', type: 'park', lat: 35.7617, lng: 139.6333, accessRadius: 300, viewRadius: 1500, description: '光が丘公園内の情報交換', createdAt: new Date() },
  { id: 'park-johoku', name: '城北中央公園', type: 'park', lat: 35.7542, lng: 139.7069, accessRadius: 300, viewRadius: 1500, description: '城北中央公園内の情報交換', createdAt: new Date() },
  { id: 'park-zenpukuji', name: '善福寺公園', type: 'park', lat: 35.7081, lng: 139.5945, accessRadius: 300, viewRadius: 1500, description: '善福寺公園内の情報交換', createdAt: new Date() },
  { id: 'park-zenpukujigawa', name: '善福寺川緑地', type: 'park', lat: 35.7056, lng: 139.6033, accessRadius: 300, viewRadius: 1500, description: '善福寺川緑地内の情報交換', createdAt: new Date() }
];

// 全掲示板データの統合
export const ALL_BOARDS = [...YAMANOTE_STATIONS, ...TOKYO_WARDS, ...TOKYO_PARKS];