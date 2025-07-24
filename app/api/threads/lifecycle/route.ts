import { supabase } from '../../../../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Using unified Supabase client
    const { action, threadId, userId } = await request.json();

    switch (action) {
      case 'archive_expired':
        return await handleArchiveExpired(supabase);

      case 'restore_thread':
        if (!threadId || !userId) {
          return NextResponse.json(
            { error: 'threadId and userId are required for restore action' },
            { status: 400 }
          );
        }
        return await handleRestoreThread(supabase, threadId);

      case 'get_lifecycle_stats':
        return await handleGetLifecycleStats(supabase);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Thread lifecycle API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleArchiveExpired(supabase: SupabaseClient) {
  const now = new Date().toISOString();

  // 期限切れスレッドを取得
  const { data: expiredThreads, error: fetchError } = await supabase
    .from('threads')
    .select('id, expires_at')
    .lt('expires_at', now)
    .eq('is_archived', false);

  if (fetchError) {
    throw fetchError;
  }

  if (!expiredThreads || expiredThreads.length === 0) {
    return NextResponse.json({
      message: 'No expired threads found',
      archivedCount: 0,
      archivedThreadIds: [],
    });
  }

  // スレッドをアーカイブ
  const threadIds = expiredThreads.map((t: { id: string }) => t.id);
  const { error: updateError } = await supabase
    .from('threads')
    .update({
      is_archived: true,
      updated_at: now,
    })
    .in('id', threadIds);

  if (updateError) {
    throw updateError;
  }

  return NextResponse.json({
    message: 'Expired threads archived successfully',
    archivedCount: threadIds.length,
    archivedThreadIds: threadIds,
  });
}

async function handleRestoreThread(supabase: SupabaseClient, threadId: string) {
  // スレッドの存在確認と復元可能性チェック
  const { data: thread, error: fetchError } = await supabase
    .from('threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (fetchError || !thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  if (!thread.is_archived) {
    return NextResponse.json({ error: 'Thread is not archived' }, { status: 400 });
  }

  const restoreCount = thread.restore_count || 0;
  if (restoreCount >= 1) {
    return NextResponse.json(
      { error: 'Thread cannot be restored more than once' },
      { status: 400 }
    );
  }

  // 72時間後の新しい期限を設定
  const newExpiresAt = new Date();
  newExpiresAt.setHours(newExpiresAt.getHours() + 72);

  const { data: restoredThread, error: updateError } = await supabase
    .from('threads')
    .update({
      is_archived: false,
      expires_at: newExpiresAt.toISOString(),
      restore_count: restoreCount + 1,
      restored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  return NextResponse.json({
    message: 'Thread restored successfully',
    thread: restoredThread,
    newExpiresAt: newExpiresAt.toISOString(),
  });
}

async function handleGetLifecycleStats(supabase: SupabaseClient) {
  const now = new Date();

  // 全アクティブスレッド
  const { data: activeThreads, error: activeError } = await supabase
    .from('threads')
    .select('id, expires_at, created_at')
    .eq('is_archived', false);

  if (activeError) {
    throw activeError;
  }

  let expiringIn24Hours = 0;
  let expiringIn6Hours = 0;
  let expired = 0;
  let totalLifetimeHours = 0;

  for (const thread of activeThreads || []) {
    if (thread.expires_at) {
      const expiresAt = new Date(thread.expires_at);
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingHours = remainingMs / (1000 * 60 * 60);

      if (remainingHours <= 0) {
        expired++;
      } else if (remainingHours <= 6) {
        expiringIn6Hours++;
      } else if (remainingHours <= 24) {
        expiringIn24Hours++;
      }

      // 寿命計算
      const createdAt = new Date(thread.created_at);
      const lifetimeMs = expiresAt.getTime() - createdAt.getTime();
      totalLifetimeHours += lifetimeMs / (1000 * 60 * 60);
    }
  }

  const averageLifetime = activeThreads?.length > 0 ? totalLifetimeHours / activeThreads.length : 0;

  return NextResponse.json({
    totalActiveThreads: activeThreads?.length || 0,
    expiringIn24Hours,
    expiringIn6Hours,
    expired,
    averageLifetime: Math.round(averageLifetime * 100) / 100,
  });
}
