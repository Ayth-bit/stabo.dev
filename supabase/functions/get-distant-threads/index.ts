// supabase/functions/get-distant-threads/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

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

    // 投稿数上限を環境変数から取得（なければ1000）
    const MAX_POST_COUNT = parseInt(Deno.env.get('MAX_POST_COUNT') || '1000', 10);

    const { data: allThreads, error: fetchError } = await supabase
    .from('threads')
    // ★★★ この select 文に is_global が含まれていることが非常に重要です ★★★
    .select('id, title, latitude, longitude, post_count, is_global')
    .lt('post_count', MAX_POST_COUNT)
    .eq('is_global', false); // グローバルスレッドは除外
  

    if (fetchError) throw fetchError;
    if (!allThreads) {
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

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

    const distantThreads = threadsWithDistance
      .filter((thread): thread is NonNullable<typeof thread> => thread !== null && thread.distance > 1.5)
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