import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // スレッド詳細を取得（サービスロールキーでRLS回避）
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select(`
        *,
        boards:board_id (
          name
        )
      `)
      .eq('id', id)
      .eq('is_archived', false)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();
    
    if (threadError) {
      console.error('Thread query error:', threadError);
      return NextResponse.json(
        { error: 'Thread not found or has expired' },
        { status: 404 }
      );
    }

    // 投稿を取得（author_idが正しいカラム名）
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        users_extended:author_id (
          display_name
        )
      `)
      .eq('thread_id', id)
      .order('created_at', { ascending: true });

    if (postsError) {
      console.error('Posts query error:', postsError);
      // 投稿取得エラーは非致命的なのでスレッドは返す
    }

    return NextResponse.json({ 
      thread,
      posts: posts || []
    }, { status: 200 });

  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}