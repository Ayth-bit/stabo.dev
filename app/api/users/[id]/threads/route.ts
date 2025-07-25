import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('include_expired') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('threads')
      .select(`
        *,
        boards:board_id (
          name
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    // 期限切れスレッドも含める場合の条件分岐
    if (!includeExpired) {
      query = query.eq('is_archived', false);
    }

    const { data: threads, error } = await query;

    if (error) {
      console.error('User threads query error:', error);
      return NextResponse.json(
        { error: `Failed to fetch threads: ${error.message}` },
        { status: 500 }
      );
    }

    // スレッドを期限切れ状態で分類
    const now = new Date();
    const categorizedThreads = threads?.map(thread => ({
      ...thread,
      is_expired: thread.expires_at ? new Date(thread.expires_at) < now : false,
      can_restore: thread.expires_at ? new Date(thread.expires_at) < now : false
    })) || [];

    const activeThreads = categorizedThreads.filter(t => !t.is_expired);
    const expiredThreads = categorizedThreads.filter(t => t.is_expired);

    return NextResponse.json({ 
      active_threads: activeThreads,
      expired_threads: expiredThreads,
      total_active: activeThreads.length,
      total_expired: expiredThreads.length
    }, { status: 200 });

  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}