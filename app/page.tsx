// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

// Google Maps API types
interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      Map: new (element: HTMLElement, options: unknown) => unknown;
      Marker: new (options: unknown) => unknown;
      InfoWindow: new (options: unknown) => unknown;
      LatLngBounds: new () => unknown;
      MapTypeId: { ROADMAP: unknown };
      Size: new (width: number, height: number) => unknown;
      event: {
        addListener: (
          instance: unknown,
          eventName: string,
          handler: () => void
        ) => unknown;
        removeListener: (listener: unknown) => void;
      };
    };
  };
  [key: string]: unknown;
}

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

type GeolocationResult = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
};

type ThreadInfo = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  post_count: number;
  is_global: boolean;
};

type DistantThreadInfo = ThreadInfo & {
  distance: number;
};

type EdgeFunctionResponse = {
  type: "found_thread" | "create_new_thread";
  thread?: ThreadInfo;
  message?: string;
  error?: string;
};

const UniqueThreadsList = ({ threads }: { threads: ThreadInfo[] }) => {
  const router = useRouter();
  if (threads.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "30px",
        borderTop: "2px solid #ffd700",
        paddingTop: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#e6a800" }}>
        ★ 注目のユニークスレッド
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {threads.map((thread) => (
          <li
            key={thread.id}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => router.push(`/thread/${thread.id}`)}
          >
            <p style={{ fontWeight: "bold", margin: 0, color: "#007bff" }}>
              {thread.title}
            </p>
            <p
              style={{ fontSize: "0.8em", color: "#6c757d", margin: "5px 0 0" }}
            >
              投稿数: {thread.post_count}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ReadOnlyThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  const router = useRouter();
  if (threads.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "30px",
        borderTop: "2px solid #ffc107",
        paddingTop: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#ff9800" }}>
        近くの読み取り専用スレッド
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {threads.map((thread) => (
          <li
            key={thread.id}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid var(--border-color, #ddd)",
              borderRadius: "5px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onClick={() => router.push(`/thread/${thread.id}`)}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#f8f9fa")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <p style={{ fontWeight: "bold", margin: 0 }}>{thread.title}</p>
            <p
              style={{ fontSize: "0.8em", color: "#6c757d", margin: "5px 0 0" }}
            >
              投稿数: {thread.post_count} | 距離: {thread.distance.toFixed(2)}{" "}
              km
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DistantThreadsList = ({ threads }: { threads: DistantThreadInfo[] }) => {
  const mapContainerIdRef = React.useRef(`map-${Date.now()}`);

  // 地図設定
  const MAP_CONFIG = {
    // 基軸となる中心点（東京駅を基準点として使用）
    centerLat: 35.6762,
    centerLng: 139.6503,
    // 固定ズームレベル
    zoom: 12,
    // マーカーの色
    markerColor: "red",
  };

  // マーカーデータ配列を作成
  const markerData = threads.map((thread, index) => ({
    lat: thread.latitude,
    lng: thread.longitude,
    label: index + 1,
    title: thread.title,
    color: index === 0 ? "red" : "blue",
    description: `投稿数: ${
      thread.post_count
    } | 距離: ${thread.distance.toFixed(1)}km`,
  }));

  React.useEffect(() => {
    let isMounted = true;

    // Google Maps APIが読み込まれているかチェック
    if (
      typeof window !== "undefined" &&
      (window as unknown as GoogleMapsWindow).google?.maps
    ) {
      if (isMounted) {
        initializeMap();
      }
    } else {
      // Google Maps APIを動的に読み込み（重複チェック付き）
      loadGoogleMapsAPI().then(() => {
        if (isMounted) {
          initializeMap();
        }
      });
    }

    function loadGoogleMapsAPI() {
      return new Promise((resolve, reject) => {
        // 既に読み込まれている場合
        const gmapsWindow = window as unknown as GoogleMapsWindow;
        if (gmapsWindow.google?.maps) {
          resolve(gmapsWindow.google.maps);
          return;
        }

        // 既にスクリプトが存在するかチェック
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          // 既存のスクリプトの読み込み完了を待つ
          const checkGoogleMaps = () => {
            const gmapsWindow = window as unknown as GoogleMapsWindow;
            if (gmapsWindow.google?.maps) {
              resolve(gmapsWindow.google.maps);
            } else {
              setTimeout(checkGoogleMaps, 100);
            }
          };
          checkGoogleMaps();
          return;
        }

        // 新しいスクリプトを追加
        const script = document.createElement("script");
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "demo";
        const callbackName = `initMap_${Date.now()}`;

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        (window as unknown as GoogleMapsWindow)[callbackName] = () => {
          delete (window as unknown as GoogleMapsWindow)[callbackName]; // コールバックをクリーンアップ
          const gmapsWindow = window as unknown as GoogleMapsWindow;
          resolve(gmapsWindow.google?.maps);
        };

        script.onerror = () => {
          delete (window as unknown as GoogleMapsWindow)[callbackName];
          reject(new Error("Google Maps API failed to load"));
        };

        document.head.appendChild(script);
      });
    }

    function initializeMap() {
      const mapElement = document.getElementById(mapContainerIdRef.current);
      if (!mapElement) return;

      // 地図を初期化
      const gmapsWindow = window as unknown as GoogleMapsWindow;
      const googleMaps = gmapsWindow.google?.maps;
      if (!googleMaps) return;

      const map = new googleMaps.Map(mapElement, {
        zoom: MAP_CONFIG.zoom,
        center: { lat: MAP_CONFIG.centerLat, lng: MAP_CONFIG.centerLng },
        mapTypeId: googleMaps.MapTypeId.ROADMAP,
      }) as {
        fitBounds: (bounds: unknown) => void;
        getZoom: () => number;
        setZoom: (zoom: number) => void;
      };

      // マーカーを追加
      const bounds = new googleMaps.LatLngBounds() as {
        extend: (position: unknown) => void;
      };

      markerData.forEach((markerInfo) => {
        const marker = new googleMaps.Marker({
          position: { lat: markerInfo.lat, lng: markerInfo.lng },
          map: map,
          title: markerInfo.title,
          label: markerInfo.label.toString(),
          icon: {
            url: `https://maps.google.com/mapfiles/ms/icons/${markerInfo.color}-dot.png`,
            scaledSize: new googleMaps.Size(32, 32),
          },
        }) as {
          addListener: (event: string, handler: () => void) => void;
          getPosition: () => unknown;
        };

        // 情報ウィンドウを追加
        const infoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">${
                markerInfo.title
              }</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${
                markerInfo.description
              }</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">座標: ${markerInfo.lat.toFixed(
                4
              )}, ${markerInfo.lng.toFixed(4)}</p>
            </div>
          `,
        }) as { open: (map: unknown, marker: unknown) => void };

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(marker.getPosition());
      });

      // 全てのマーカーが見えるように地図を調整
      if (markerData.length > 1) {
        map.fitBounds(bounds);

        // ズームレベルが高すぎる場合は制限
        const listener = googleMaps.event.addListener(map, "idle", function () {
          if (map.getZoom() > 15) map.setZoom(15);
          googleMaps.event.removeListener(listener);
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [markerData, MAP_CONFIG.centerLat, MAP_CONFIG.centerLng, MAP_CONFIG.zoom]);

  if (threads.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "30px",
        borderTop: "1px solid #eee",
        paddingTop: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#555", marginBottom: "20px" }}>
        遠くのスレッド (マップで表示)
      </h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          id={mapContainerIdRef.current}
          style={{
            width: "100%",
            height: "400px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: "14px",
          }}
        >
          地図を読み込み中...
        </div>
      </div>

      {/* スレッド一覧（地図の下に簡潔に表示） */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", fontSize: "1em", color: "#333" }}>
          スレッド一覧 ({threads.length}件)
        </h3>
        <div style={{ display: "grid", gap: "10px" }}>
          {threads.slice(0, 5).map((thread, index) => (
            <div
              key={thread.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "white",
                borderRadius: "5px",
                border: "1px solid #dee2e6",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onClick={() => {
                const mapUrl = `https://www.google.com/maps?q=${thread.latitude},${thread.longitude}&z=15`;
                try {
                  const newWindow = window.open(
                    mapUrl,
                    "_blank",
                    "noopener,noreferrer"
                  );
                  if (!newWindow) {
                    throw new Error("ポップアップがブロックされました");
                  }
                } catch {
                  window.location.href = mapUrl;
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7em",
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "0.9em",
                      color: "#333",
                    }}
                  >
                    {thread.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75em",
                      color: "#6c757d",
                      marginTop: "2px",
                    }}
                  >
                    投稿数: {thread.post_count} | 座標:{" "}
                    {thread.latitude.toFixed(4)}, {thread.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                <div style={{ fontSize: "0.75em", color: "#6c757d" }}>
                  {thread.distance.toFixed(1)}km
                </div>
                <button
                  style={{
                    fontSize: "0.7em",
                    padding: "2px 6px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${thread.latitude},${thread.longitude}`;
                    window.open(mapUrl, "_blank");
                  }}
                >
                  地図
                </button>
              </div>
            </div>
          ))}
          {threads.length > 5 && (
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <span style={{ fontSize: "0.8em", color: "#6c757d" }}>
                他 {threads.length - 5} 件のスレッドがあります
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const router = useRouter();

  const [location, setLocation] = useState<GeolocationResult>({
    latitude: null,
    longitude: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] =
    useState<string>("位置情報を取得中...");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [foundThread, setFoundThread] = useState<ThreadInfo | null>(null);
  const [distantThreads, setDistantThreads] = useState<DistantThreadInfo[]>([]);
  const [uniqueThreads, setUniqueThreads] = useState<ThreadInfo[]>([]);
  const [readOnlyThreads, setReadOnlyThreads] = useState<DistantThreadInfo[]>(
    []
  );

  const handleLocationProcessed = async (lat: number, lon: number) => {
    setCurrentStatus("スレッドを検索中...");
    try {
      const [mainResult, distantResult, uniqueResult, readOnlyResult] =
        await Promise.all([
          supabase.functions.invoke<EdgeFunctionResponse>("handle-location", {
            body: { latitude: lat, longitude: lon },
          }),
          supabase.functions.invoke<DistantThreadInfo[]>(
            "get-distant-threads",
            { body: { latitude: lat, longitude: lon } }
          ),
          supabase.functions.invoke<ThreadInfo[]>("get-global-threads"),
          supabase.functions.invoke<DistantThreadInfo[]>(
            "get-readonly-threads",
            { body: { latitude: lat, longitude: lon } }
          ),
        ]);

      const { data: mainData, error: mainError } = mainResult;
      if (mainError) throw mainError;
      if (!mainData)
        throw new Error('Function "handle-location" did not return data.');
      if (mainData.error) throw new Error(mainData.error);

      if (mainData.type === "found_thread" && mainData.thread) {
        setActionMessage(`既存のスレッドが見つかりました:`);
        setFoundThread(mainData.thread);
      } else if (mainData.type === "create_new_thread") {
        setActionMessage(
          mainData.message || "この位置にスレッドが見つかりませんでした。"
        );
        setFoundThread(null);
      }

      const { data: distantData, error: distantError } = distantResult;
      if (distantError)
        console.warn("Could not fetch distant threads:", distantError.message);
      else if (distantData) setDistantThreads(distantData);

      const { data: uniqueData, error: uniqueError } = uniqueResult;
      if (uniqueError)
        console.warn("Could not fetch unique threads:", uniqueError.message);
      else if (uniqueData) setUniqueThreads(uniqueData);

      const { data: readOnlyData, error: readOnlyError } = readOnlyResult;
      if (readOnlyError)
        console.warn(
          "Could not fetch readonly threads:",
          readOnlyError.message
        );
      else if (readOnlyData) setReadOnlyThreads(readOnlyData);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setActionMessage(`エラー: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setCurrentStatus("完了");
    }
  };

  useEffect(() => {
    console.log("Attempting to get geolocation...");
    console.log("Navigator available:", !!navigator);
    console.log("Geolocation available:", !!navigator.geolocation);
    console.log("HTTPS context:", window.location.protocol === "https:");
    console.log("Localhost context:", window.location.hostname === "localhost");

    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: "このブラウザは位置情報をサポートしていません。",
      });
      handleLocationProcessed(0, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, error: null });
        handleLocationProcessed(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "位置情報の取得に失敗しました。";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "位置情報へのアクセスが拒否されました。ブラウザの設定で位置情報を許可してください。";
            console.warn("User denied geolocation permission");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "位置情報が取得できませんでした。\n\n確認事項:\n1. macOS: システム設定 → プライバシーとセキュリティ → 位置情報サービス\n2. Chrome: 設定 → プライバシーとセキュリティ → サイトの設定 → 位置情報";
            console.warn(
              "Position unavailable - system settings may be disabled"
            );

            // 開発用フォールバック: 東京駅の座標を使用
            if (window.location.hostname === "localhost") {
              console.warn(
                "Development fallback: Using Tokyo Station coordinates"
              );
              setLocation({
                latitude: 35.6812,
                longitude: 139.7671,
                error: null,
              });
              handleLocationProcessed(35.6812, 139.7671);
              return;
            }
            break;
          case error.TIMEOUT:
            errorMessage =
              "位置情報の取得がタイムアウトしました。再試行してください。";
            console.warn("Geolocation timeout");
            break;
          default:
            errorMessage = "位置情報の取得に失敗しました: " + error.message;
            console.error("Unknown geolocation error:", error);
        }

        setLocation({
          latitude: null,
          longitude: null,
          error: errorMessage,
        });
        handleLocationProcessed(0, 0);
      }
    );
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "auto",
        border: "1px solid #eee",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
        color: "#333",
      }}
    >
      <header
        style={{
          marginBottom: "20px",
          paddingBottom: "10px",
          borderBottom: "1px solid #eee",
        }}
      >
        <h1
          style={{
            color: "#333",
            margin: 0,
            fontSize: "1.5em",
            textAlign: "center",
          }}
        >
          stabo.dev
        </h1>
      </header>

      {isLoading ? (
        <p style={{ textAlign: "center", fontSize: "1.2em", color: "#555" }}>
          {currentStatus}
        </p>
      ) : (
        <div>
          {location.error && (
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ color: "red", whiteSpace: "pre-line" }}>
                {location.error}
              </p>
              <div style={{ marginTop: "15px" }}>
                <button
                  onClick={() => {
                    console.log("Using manual fallback coordinates");
                    setLocation({
                      latitude: 35.6812,
                      longitude: 139.7671,
                      error: null,
                    });
                    handleLocationProcessed(35.6812, 139.7671);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  東京駅でテストする
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  再試行
                </button>
              </div>
            </div>
          )}

          {!location.error && (
            <>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.9em",
                  color: "#777",
                }}
              >
                緯度: {location.latitude?.toFixed(5)}, 経度:{" "}
                {location.longitude?.toFixed(5)}
              </p>

              {foundThread ? (
                <div
                  style={{
                    borderTop: "1px solid #eee",
                    paddingTop: "20px",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", color: "#444" }}>
                    {actionMessage}
                  </p>
                  <p
                    style={{
                      fontSize: "1.2em",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >{`"${foundThread.title}"`}</p>
                  <button
                    onClick={() => router.push(`/thread/${foundThread.id}`)}
                    style={{
                      padding: "10px 20px",
                      cursor: "pointer",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      marginTop: "10px",
                    }}
                  >
                    スレッドを見る
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    borderTop: "1px solid #eee",
                    paddingTop: "20px",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", color: "#444" }}>
                    {actionMessage}
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        `/create-thread?lat=${location.latitude}&lon=${location.longitude}`
                      )
                    }
                    style={{
                      padding: "10px 20px",
                      cursor: "pointer",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    新規スレッドを作成する
                  </button>
                </div>
              )}
            </>
          )}

          <UniqueThreadsList threads={uniqueThreads} />
          <ReadOnlyThreadsList threads={readOnlyThreads} />
          <DistantThreadsList threads={distantThreads} />
          
          {/* Admin Setup Link */}
          <div style={{
            marginTop: "40px",
            padding: "20px",
            borderTop: "1px solid #eee",
            textAlign: "center"
          }}>
            <p style={{
              fontSize: "0.8rem",
              color: "#666",
              margin: "0 0 10px 0"
            }}>
              開発者・管理者向け
            </p>
            <button
              onClick={() => router.push('/admin-setup')}
              style={{
                padding: "8px 16px",
                fontSize: "0.8rem",
                color: "#666",
                backgroundColor: "transparent",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px"
              }}
            >
              管理者セットアップ
            </button>
            <button
              onClick={() => router.push('/admin')}
              style={{
                padding: "8px 16px",
                fontSize: "0.8rem",
                color: "#666",
                backgroundColor: "transparent",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              管理画面
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
