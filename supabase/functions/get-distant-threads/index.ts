// supabase/functions/get-distant-threads/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid latitude or longitude.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // 1000レス未満のスレッドをすべて取得
    const { data: allThreads, error: fetchError } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, post_count')
      .lt('post_count', 1000);

    if (fetchError) throw fetchError;

    // 各スレッドまでの距離を計算
    const threadsWithDistance = await Promise.all(
      allThreads.map(async (thread) => {
        const { data: distance, error: rpcError } = await supabase.rpc('calculate_distance', {
          lat1: latitude,
          lon1: longitude,
          lat2: thread.latitude,
          lon2: thread.longitude,
        });
        if (rpcError) return null;
        return { ...thread, distance };
      })
    );

    // 1km以上離れているスレッドをフィルタリングし、距離でソートして上位4件を取得
    const distantThreads = threadsWithDistance
      .filter((thread): thread is NonNullable<typeof thread> => thread !== null && thread.distance > 1)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    return new Response(JSON.stringify(distantThreads), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});