import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // スレッドの存在確認と権限チェック
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, author_id, expires_at, restore_count')
      .eq('id', id)
      .eq('author_id', user_id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    // 匿名投稿（author_id = null）はRestore不可
    if (!thread.author_id) {
      return NextResponse.json(
        { error: 'Anonymous threads cannot be restored' },
        { status: 403 }
      );
    }

    // 既に期限内の場合はRestore不要
    if (thread.expires_at && new Date(thread.expires_at) > new Date()) {
      return NextResponse.json(
        { error: 'Thread is not expired yet' },
        { status: 400 }
      );
    }

    // 新しい期限を設定（72時間後）
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 72);

    // スレッドを復元
    const { data: restoredThread, error: restoreError } = await supabaseAdmin
      .from('threads')
      .update({
        expires_at: newExpiresAt.toISOString(),
        restored_at: new Date().toISOString(),
        restore_count: (thread.restore_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (restoreError) {
      console.error('Restore error:', restoreError);
      return NextResponse.json(
        { error: `Failed to restore thread: ${restoreError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Thread restored successfully',
      thread: restoredThread 
    }, { status: 200 });

  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}