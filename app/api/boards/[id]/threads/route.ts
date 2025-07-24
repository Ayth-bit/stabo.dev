import { type NextRequest, NextResponse } from 'next/server';
import { SupabaseBoardThreadRepository } from '@/app/repositories/supabase/SupabaseBoardThreadRepository';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: boardId } = await params;
    const threadRepository = new SupabaseBoardThreadRepository();

    const threads = await threadRepository.findByBoardId(boardId);

    const activeThreads = threads.filter(
      (thread) => !thread.isArchived && (!thread.expiresAt || thread.expiresAt > new Date())
    );

    return NextResponse.json({
      threads: activeThreads,
      total: activeThreads.length,
    });
  } catch (error) {
    console.error('Board threads API error:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}
