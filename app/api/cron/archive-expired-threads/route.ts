import { supabase } from '../../../../lib/supabase';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 認証ヘッダーチェック（本番環境ではCron Job用の認証を追加）
    const authorization = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authorization !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Using unified Supabase client
    const now = new Date().toISOString();

    // 期限切れのスレッドを取得
    const { data: expiredThreads, error: fetchError } = await supabase
      .from('threads')
      .select('id, expires_at, created_at')
      .lt('expires_at', now)
      .eq('is_archived', false);

    if (fetchError) {
      console.error('Failed to fetch expired threads:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch expired threads' }, { status: 500 });
    }

    if (!expiredThreads || expiredThreads.length === 0) {
      return NextResponse.json({
        message: 'No expired threads found',
        archivedCount: 0,
        timestamp: now,
      });
    }

    // スレッドをアーカイブ
    const threadIds = expiredThreads.map((thread) => thread.id);
    const { error: updateError } = await supabase
      .from('threads')
      .update({
        is_archived: true,
        archived_at: now,
        updated_at: now,
      })
      .in('id', threadIds);

    if (updateError) {
      console.error('Failed to archive expired threads:', updateError);
      return NextResponse.json({ error: 'Failed to archive expired threads' }, { status: 500 });
    }

    // ログ出力
    console.log(`Successfully archived ${threadIds.length} expired threads:`, threadIds);

    return NextResponse.json({
      message: 'Expired threads archived successfully',
      archivedCount: threadIds.length,
      archivedThreadIds: threadIds,
      timestamp: now,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET メソッドで動作状況確認
export async function GET() {
  // Using unified Supabase client

  try {
    // 統計情報を取得
    const { data: stats, error } = await supabase
      .from('threads')
      .select('id, expires_at, is_archived, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    const now = new Date();
    const activeThreads = stats?.filter((t) => !t.is_archived) || [];
    const expiredCount = activeThreads.filter(
      (t) => t.expires_at && new Date(t.expires_at) < now
    ).length;

    return NextResponse.json({
      message: 'Thread lifecycle cron job status',
      totalThreads: stats?.length || 0,
      activeThreads: activeThreads.length,
      archivedThreads: (stats?.length || 0) - activeThreads.length,
      expiredPendingArchive: expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
