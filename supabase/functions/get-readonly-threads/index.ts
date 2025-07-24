// supabase/functions/get-readonly-threads/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { latitude, longitude } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // 全てのスレッドを取得 (is_globalではないもの)
    const { data: allThreads, error: fetchError } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, post_count, is_global')
      .eq('is_global', false);
    if (fetchError) throw fetchError;

    // 各スレッドまでの距離を計算
    const threadsWithDistance = await Promise.all(
      allThreads.map(async (thread) => {
        const { data: distance } = await supabase.rpc('calculate_distance', {
          lat1: latitude,
          lon1: longitude,
          lat2: thread.latitude,
          lon2: thread.longitude,
        });
        return { ...thread, distance };
      })
    );

    // 0.3kmより大きく、1.5km以下のスレッドをフィルタリング
    const readonlyThreads = threadsWithDistance.filter(
      (thread) => thread.distance > 0.3 && thread.distance <= 1.5
    );

    return new Response(JSON.stringify(readonlyThreads), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
