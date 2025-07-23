'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Board, BoardThread, User, Chat } from '@/app/types/domain';
import * as L from 'leaflet';

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
          attribution: '© OpenStreetMap contributors'
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

  const addMarkersToMap = useCallback(async (L: typeof import('leaflet'), map: L.Map) => {
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
        case 'station': return '#ff4444';
        case 'ward': return '#44ff44';
        case 'park': return '#4444ff';
        default: return '#888888';
      }
    };
    // 掲示板マーカー
    if (filters.showBoards && data.boards) {
      data.boards.forEach(board => {
        if (shouldShowBoard(board)) {
          const color = getBoardColor(board.type);
          const marker = L.circleMarker([board.lat, board.lng], {
            color: color,
            radius: 8,
            fillOpacity: 0.7
          }).addTo(map);

          marker.bindPopup(`
            <div>
              <strong>${board.name}</strong><br>
              タイプ: ${board.type}<br>
              半径: ${board.accessRadius}m
            </div>
          `);
        }
      });
    }

    // スレッドマーカー
    if (filters.showThreads && data.threads) {
      data.threads.forEach(thread => {
        const board = data.boards.find(b => b.id === thread.boardId);
        if (board && shouldShowThread(thread)) {
          const marker = L.marker([board.lat, board.lng], {
            icon: L.divIcon({
              className: 'thread-marker',
              html: '📝',
              iconSize: [20, 20]
            })
          }).addTo(map);

          marker.bindPopup(`
            <div>
              <strong>スレッド</strong><br>
              内容: ${thread.content.slice(0, 50)}...<br>
              作成日: ${thread.createdAt.toLocaleDateString()}
            </div>
          `);
        }
      });
    }

    // ユーザー拠点マーカー
    if (filters.showUsers && data.users) {
      data.users.forEach(user => {
        if (user.baseLat && user.baseLng && shouldShowUser()) {
          const marker = L.circleMarker([user.baseLat, user.baseLng], {
            color: '#28a745',
            radius: 6,
            fillOpacity: 0.5
          }).addTo(map);

          marker.bindPopup(`
            <div>
              <strong>${user.displayName}</strong><br>
              拠点半径: ${user.baseRadius}m<br>
              ポイント: ${user.points}
            </div>
          `);
        }
      });
    }

    // チャットマーカー（関連する掲示板の位置に表示）
    if (filters.showChats && data.chats) {
      const chatGroups = new Map<string, Chat[]>();
      
      // 掲示板ごとにチャットをグループ化
      data.chats.forEach(chat => {
        if (shouldShowChat(chat)) {
          const key = `${chat.senderId}-${chat.receiverId}`;
          if (!chatGroups.has(key)) {
            chatGroups.set(key, []);
          }
          chatGroups.get(key)!.push(chat);
        }
      });

      // チャットグループごとにマーカーを配置
      chatGroups.forEach((chats) => {
        const latestChat = chats[chats.length - 1];
        // チャットの位置は送信者の拠点位置を使用（簡略化）
        const sender = data.users.find(u => u.id === latestChat.senderId);
        if (sender && sender.baseLat && sender.baseLng) {
          const marker = L.marker([sender.baseLat, sender.baseLng], {
            icon: L.divIcon({
              className: 'chat-marker',
              html: '💬',
              iconSize: [20, 20]
            })
          }).addTo(map);

          marker.bindPopup(`
            <div>
              <strong>チャット</strong><br>
              メッセージ数: ${chats.length}<br>
              最新: ${latestChat.createdAt.toLocaleDateString()}
            </div>
          `);
        }
      });
    }
  }, [data, filters]);

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
  }, [data, filters, updateMapMarkers]);

  return (
    <div className="admin-map-view">
      <div ref={mapRef} className="map-container" />
      
      <div className="map-legend">
        <h4>凡例</h4>
        <div className="legend-item">
          <span className="legend-color station"></span>
          <span>駅 (青)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ward"></span>
          <span>区 (緑)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color park"></span>
          <span>公園 (黄)</span>
        </div>
        <div className="legend-item">
          <span className="legend-emoji">📝</span>
          <span>スレッド</span>
        </div>
        <div className="legend-item">
          <span className="legend-emoji">💬</span>
          <span>チャット</span>
        </div>
      </div>

      <style jsx>{`
        .admin-map-view {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .map-container {
          width: 100%;
          height: 100%;
          min-height: 600px;
        }

        .map-legend {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
        }

        .map-legend h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }

        .legend-color.station {
          background-color: #007bff;
        }

        .legend-color.ward {
          background-color: #28a745;
        }

        .legend-color.park {
          background-color: #ffc107;
        }

        .legend-emoji {
          margin-right: 0.5rem;
          font-size: 12px;
        }

        :global(.thread-marker) {
          background: none !important;
          border: none !important;
        }

        :global(.chat-marker) {
          background: none !important;
          border: none !important;
        }
      `}</style>

      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      `}</style>
    </div>
  );
}