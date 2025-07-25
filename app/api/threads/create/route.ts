import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author_id, author_name, board_id, latitude, longitude } = body;

    // 必要なフィールドのバリデーション
    if (!title || !content || !author_name || !board_id) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // 72時間後の有効期限を設定
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // スレッドデータの準備
    const threadData: Record<string, unknown> = {
      title: title.trim(),
      content: content.trim(),
      author_name: author_name,
      board_id: board_id,
      latitude: latitude,
      longitude: longitude,
      expires_at: expiresAt.toISOString(),
      is_archived: false,
      created_at: new Date().toISOString()
    };

    // author_idが提供された場合のみ追加
    if (author_id) {
      threadData.author_id = author_id;
    }

    // サービスロールキーを使用してRLSを回避
    const { data, error } = await supabaseAdmin
      .from('threads')
      .insert([threadData])
      .select()
      .single();

    if (error) {
      console.error('Thread creation error:', error);
      return NextResponse.json(
        { error: `Failed to create thread: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ thread: data }, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}