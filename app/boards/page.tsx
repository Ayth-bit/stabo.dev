"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Board } from "@/app/types/domain";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [, setBoardStats] = useState({
    station: 0,
    ward: 0,
    park: 0,
    accessible: 0,
  });
  const [allStats, setAllStats] = useState({
    station: 0,
    ward: 0,
    park: 0,
    accessible: 0,
    all: 0,
  });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "accessible" | "station" | "ward" | "park"
  >("accessible");

  const fetchBoards = useCallback(async () => {
    try {
      const locationParam = userLocation
        ? `?lat=${userLocation.lat}&lng=${userLocation.lng}&filter=${filter}`
        : `?filter=${filter}`;

      const response = await fetch(`/api/boards/integrated${locationParam}`);
      if (response.ok) {
        const data = await response.json();
        setBoards(data.boards);
        setBoardStats(data.byType);
        if (data.allStats) {
          setAllStats(data.allStats);
        }
      }
    } catch {
      console.error("掲示板データの取得に失敗");
    }
  }, [userLocation, filter]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const getCurrentLocation = () => {
    setLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("このブラウザは位置情報をサポートしていません");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
        setLoading(false);
      },
      (error) => {
        console.error("位置情報取得エラー:", error);
        let errorMessage = "位置情報の取得に失敗しました";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "位置情報の利用が拒否されています。ブラウザの設定で位置情報を許可してください。";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報が利用できません。";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。";
            break;
        }
        
        setLocationError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const isAccessible = (board: Board & { isAccessible?: boolean }): boolean => {
    return board.isAccessible || false;
  };

  const getFilteredBoards = () => {
    // 統合APIで既にフィルタリングとソートが済んでいるため、そのまま返す
    return boards;
  };

  const getBoardTypeIcon = (type: string) => {
    switch (type) {
      case "station":
        return "[駅]";
      case "ward":
        return "[区]";
      case "park":
        return "[公園]";
      default:
        return "[掲示板]";
    }
  };

  const getBoardTypeLabel = (type: string) => {
    switch (type) {
      case "station":
        return "駅";
      case "ward":
        return "区";
      case "park":
        return "公園";
      default:
        return "掲示板";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>位置情報を取得中...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center p-8 border border-red-500 rounded-lg bg-red-50 max-w-md">
          <h2 className="text-xl font-bold mb-4">位置情報エラー</h2>
          <p className="mb-6">{locationError}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={getCurrentLocation}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              再試行
            </button>
            <button
              onClick={() => {
                setLocationError(null);
                setLoading(false);
                // デフォルト位置（東京駅）を設定
                setUserLocation({ lat: 35.6812, lng: 139.7671 });
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              東京駅で続行
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-600 text-center">
            位置情報なしでも掲示板は閲覧できますが、アクセス可能な掲示板の判定ができません。
          </p>
        </div>
      </div>
    );
  }

  const filteredBoards = getFilteredBoards();

  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">掲示板一覧</h1>
        <p className="text-gray-600 text-sm">
          現在地:{" "}
          {userLocation
            ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
            : "取得中..."}
        </p>
      </header>

      <nav className="mb-8">
        <div className="flex gap-3 flex-wrap justify-center items-center bg-gray-50 p-4 rounded-xl shadow-sm">
          <button
            className={`px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 min-w-[120px] ${
              filter === "accessible" 
                ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                : "bg-white hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setFilter("accessible")}
          >
            アクセス可能 ({allStats.accessible})
          </button>
          <button
            className={`px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 min-w-[100px] ${
              filter === "station" 
                ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                : "bg-white hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setFilter("station")}
          >
            駅 ({allStats.station})
          </button>
          <button
            className={`px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 min-w-[100px] ${
              filter === "ward" 
                ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                : "bg-white hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setFilter("ward")}
          >
            区 ({allStats.ward})
          </button>
          <button
            className={`px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 min-w-[100px] ${
              filter === "park" 
                ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                : "bg-white hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setFilter("park")}
          >
            公園 ({allStats.park})
          </button>
          <button
            className={`px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 min-w-[100px] ${
              filter === "all" 
                ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                : "bg-white hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setFilter("all")}
          >
            全て ({allStats.all})
          </button>
        </div>
      </nav>

      <div className="mt-8">
        {filteredBoards.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>条件に合致する掲示板がありません</p>
            {filter === "accessible" && (
              <p className="mt-2 text-sm text-gray-500">
                近くに移動するか、他のフィルターを試してください
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map((board) => {
              const distance =
                (board as Board & { distance?: number }).distance || 0;
              const accessible = isAccessible(board);

              return (
                <div
                  key={board.id}
                  className={`border rounded-xl p-6 bg-white shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${
                    accessible 
                      ? "border-green-500" 
                      : "border-yellow-400 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl">
                      {getBoardTypeIcon(board.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 m-0">{board.name}</h3>
                      <span className="text-gray-600 text-sm">
                        {getBoardTypeLabel(board.type)}
                      </span>
                    </div>
                    <div className="text-2xl">
                      {accessible ? "[利用可]" : "[範囲外]"}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-600 text-sm mb-4">{board.description}</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>
                        距離: {Math.round(distance)}m
                      </span>
                      <span>
                        範囲: {board.accessRadius}m
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {accessible ? (
                      <>
                        <Link
                          href={`/boards/${board.id}`}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white text-center text-sm rounded-md border border-blue-500 hover:bg-blue-600 transition-all duration-200 no-underline"
                        >
                          掲示板を見る
                        </Link>
                        <Link
                          href={`/boards/${board.id}/create`}
                          className="flex-1 px-4 py-2 bg-white text-blue-500 text-center text-sm rounded-md border border-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 no-underline"
                        >
                          投稿する
                        </Link>
                      </>
                    ) : (
                      <>
                        <button
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-md border border-gray-300 cursor-not-allowed"
                          disabled
                        >
                          範囲外です
                        </button>
                        <Link
                          href={`/map/${board.id}`}
                          className="flex-1 px-4 py-2 bg-white text-green-500 text-center text-sm rounded-md border border-green-500 hover:bg-green-500 hover:text-white transition-all duration-200 no-underline"
                        >
                          地図で見る
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
