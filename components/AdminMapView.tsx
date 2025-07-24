'use client';

import type { Board, BoardThread, Chat, User } from '@/app/types/domain';
import type * as L from 'leaflet';
import { useCallback, useEffect, useRef } from 'react';

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

interface AdminMapViewProps {
  data: MapData;
  filters: MapFilters;
}

export default function AdminMapView({ data, filters }: AdminMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 地図の初期化（Leafletを使用）
    const initializeMap = async () => {
      try {
        // 動的にLeafletをロード
        const L = await import('leaflet');

        // 既存の地図があれば削除
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // 東京を中心とした地図を作成
        if (!mapRef.current) return;
        const map = L.map(mapRef.current).setView([35.6762, 139.6503], 10);

        // OpenStreetMapタイルレイヤーを追加
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('地図の初期化に失敗しました:', error);
      }
    };

    initializeMap();

    // クリーンアップ
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const addMarkersToMap = useCallback(
    async (L: typeof import('leaflet'), map: L.Map) => {
      // Helper functions defined inside useCallback for stability
      const shouldShowBoard = (board: Board): boolean => {
        if (filters.boardType !== 'all' && board.type !== filters.boardType) {
          return false;
        }
        return true;
      };

      const shouldShowThread = (thread: BoardThread): boolean => {
        const threadDate = new Date(thread.createdAt);
        return threadDate >= filters.dateRange.start && threadDate <= filters.dateRange.end;
      };

      const shouldShowUser = (): boolean => {
        return true; // 現在は全ユーザーを表示
      };

      const shouldShowChat = (chat: Chat): boolean => {
        const chatDate = new Date(chat.createdAt);
        return chatDate >= filters.dateRange.start && chatDate <= filters.dateRange.end;
      };

      const getBoardColor = (boardType: string): string => {
        switch (boardType) {
          case 'station':
            return '#ff4444';
          case 'ward':
            return '#44ff44';
          case 'park':
            return '#4444ff';
          default:
            return '#888888';
        }
      };
      // 掲示板マーカー
      if (filters.showBoards && data.boards) {
        for (const board of data.boards) {
          if (shouldShowBoard(board)) {
            const color = getBoardColor(board.type);
            const marker = L.circleMarker([board.lat, board.lng], {
              color: color,
              radius: 8,
              fillOpacity: 0.7,
            }).addTo(map);

            marker.bindPopup(`
            <div>
              <strong>${board.name}</strong><br>
              タイプ: ${board.type}<br>
              半径: ${board.accessRadius}m
            </div>
          `);
          }
        }
      }

      // スレッドマーカー
      if (filters.showThreads && data.threads) {
        for (const thread of data.threads) {
          const board = data.boards.find((b) => b.id === thread.boardId);
          if (board && shouldShowThread(thread)) {
            const marker = L.marker([board.lat, board.lng], {
              icon: L.divIcon({
                className: 'thread-marker',
                html: 'T',
                iconSize: [20, 20],
              }),
            }).addTo(map);

            marker.bindPopup(`
            <div>
              <strong>スレッド</strong><br>
              内容: ${thread.content.slice(0, 50)}...<br>
              作成日: ${thread.createdAt.toLocaleDateString()}
            </div>
          `);
          }
        }
      }

      // ユーザー拠点マーカー
      if (filters.showUsers && data.users) {
        for (const user of data.users) {
          if (user.baseLat && user.baseLng && shouldShowUser()) {
            const marker = L.circleMarker([user.baseLat, user.baseLng], {
              color: '#28a745',
              radius: 6,
              fillOpacity: 0.5,
            }).addTo(map);

            marker.bindPopup(`
            <div>
              <strong>${user.displayName}</strong><br>
              拠点半径: ${user.baseRadius}m<br>
              ポイント: ${user.points}
            </div>
          `);
          }
        }
      }

      // チャットマーカー（関連する掲示板の位置に表示）
      if (filters.showChats && data.chats) {
        const chatGroups = new Map<string, Chat[]>();

        // 掲示板ごとにチャットをグループ化
        for (const chat of data.chats) {
          if (shouldShowChat(chat)) {
            const key = `${chat.senderId}-${chat.receiverId}`;
            if (!chatGroups.has(key)) {
              chatGroups.set(key, []);
            }
            chatGroups.get(key)!.push(chat);
          }
        }

        // チャットグループごとにマーカーを配置
        for (const chats of chatGroups.values()) {
          const latestChat = chats[chats.length - 1];
          // チャットの位置は送信者の拠点位置を使用（簡略化）
          const sender = data.users.find((u) => u.id === latestChat.senderId);
          if (sender?.baseLat && sender.baseLng) {
            const marker = L.marker([sender.baseLat, sender.baseLng], {
              icon: L.divIcon({
                className: 'chat-marker',
                html: 'C',
                iconSize: [20, 20],
              }),
            }).addTo(map);

            marker.bindPopup(`
            <div>
              <strong>チャット</strong><br>
              メッセージ数: ${chats.length}<br>
              最新: ${latestChat.createdAt.toLocaleDateString()}
            </div>
          `);
          }
        }
      }
    },
    [data, filters]
  );

  const updateMapMarkers = useCallback(async () => {
    if (!mapInstanceRef.current) return;

    try {
      const L = await import('leaflet');

      // 既存のマーカーをクリア
      mapInstanceRef.current.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          mapInstanceRef.current!.removeLayer(layer);
        }
      });

      // 新しいマーカーを追加
      addMarkersToMap(L, mapInstanceRef.current);
    } catch (error) {
      console.error('マーカーの更新に失敗しました:', error);
    }
  }, [addMarkersToMap]);

  useEffect(() => {
    // フィルターが変更された時にマーカーを更新
    if (mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [updateMapMarkers]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full min-h-[600px]" />

      <div className="absolute top-2.5 right-2.5 bg-white p-4 rounded-lg shadow-lg z-[1000]">
        <h4 className="m-0 mb-2 text-sm">凡例</h4>
        <div className="flex items-center mb-1 text-xs">
          <span className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
          <span>駅 (青)</span>
        </div>
        <div className="flex items-center mb-1 text-xs">
          <span className="w-3 h-3 rounded-full mr-2 bg-green-600" />
          <span>区 (緑)</span>
        </div>
        <div className="flex items-center mb-1 text-xs">
          <span className="w-3 h-3 rounded-full mr-2 bg-yellow-400" />
          <span>公園 (黄)</span>
        </div>
        <div className="flex items-center mb-1 text-xs">
          <span className="mr-2 text-xs">T</span>
          <span>スレッド</span>
        </div>
        <div className="flex items-center mb-1 text-xs">
          <span className="mr-2 text-xs">C</span>
          <span>チャット</span>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        
        .thread-marker {
          background: none !important;
          border: none !important;
        }

        .chat-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
