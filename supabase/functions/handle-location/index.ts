// supabase/functions/handle-location/index.ts

// DenoのHTTPサーバーをインポート
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// Supabaseクライアントライブラリをインポート
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SupabaseのURLとAnon Keyを環境変数から取得
// Edge Functionではこれらの環境変数が自動的に注入されるため、通常は空文字列でも動作します。
// ローカルでのテスト時に必要になる場合があります。
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Supabaseクライアントを初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// HTTPリクエストを処理するハンドラー関数
serve(async (req) => {
  // CORS (Cross-Origin Resource Sharing) Preflight リクエストのハンドリング
  // ブラウザがPOSTリクエストなどを送る前にOPTIONSリクエストを送ってくるため、これに応答します。
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*', // すべてのオリジンからのアクセスを許可
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST', // 許可するHTTPメソッド
      },
    });
  }

  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 405,
    });
  }

  try {
    // リクエストボディから緯度と経度を取得
    const { latitude, longitude } = await req.json();

    // 必須パラメータのチェック
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude or longitude. Both must be numbers.' }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 400, // Bad Request
        }
      );
    }

    // スレッド検索の半径（キロメートル）を環境変数から取得
    // スレッド検索の半径（キロメートル）...
    const SEARCH_RADIUS_KM = Number.parseFloat(Deno.env.get('SEARCH_RADIUS_KM') || '0.3');

    // ★ 投稿数の上限を環境変数から取得
    const MAX_POST_COUNT = Number.parseInt(Deno.env.get('MAX_POST_COUNT') || '1000', 10);

    // 1. 全てのスレッドを取得し、...
    // 1000レスに達したスレッドは対象外とします。
    const { data: allThreads, error: fetchThreadsError } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, post_count')
      .not('post_count', 'gte', MAX_POST_COUNT); // ★ ここを修正

    if (fetchThreadsError) {
      console.error('Error fetching threads:', fetchThreadsError);
      throw new Error('Failed to fetch threads.');
    }

    let foundThread = null;
    let minDistance = Number.POSITIVE_INFINITY; // 最小距離を無限大で初期化

    // 各スレッドとの距離を計算し、最も近い有効なスレッドを特定
    for (const thread of allThreads) {
      // データベースのRPC関数を呼び出して距離を計算
      const { data: distance, error: distanceError } = await supabase.rpc('calculate_distance', {
        lat1: latitude,
        lon1: longitude,
        lat2: thread.latitude,
        lon2: thread.longitude,
      });

      if (distanceError) {
        console.error(`Error calculating distance for thread ${thread.id}:`, distanceError);
        // 特定のスレッドの距離計算に失敗しても、他のスレッドの処理を続行
        continue;
      }

      // 距離が指定半径以内 AND これまでの最小距離より近い場合
      if (distance <= SEARCH_RADIUS_KM && distance < minDistance) {
        minDistance = distance;
        foundThread = thread;
      }
    }

    // 2. 結果に基づいて応答を返す
    if (foundThread) {
      // 既存のスレッドが見つかった場合
      return new Response(
        JSON.stringify({
          type: 'found_thread',
          thread: foundThread,
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 200,
        }
      );
    }
    // 既存のスレッドが見つからなかった場合
    return new Response(
      JSON.stringify({
        type: 'create_new_thread',
        message: 'この位置にスレッドが見つかりませんでした。新しいスレッドを作成できます。',
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Edge Function execution error:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});
