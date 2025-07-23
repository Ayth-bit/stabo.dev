import { NextRequest, NextResponse } from 'next/server';
import { BoardThread } from '@/app/types/domain';

// 仮のスレッドデータ（各掲示板用）
const generateMockThreads = (boardId: string): BoardThread[] => {
  const baseThreads = [
    {
      id: `thread-${boardId}-1`,
      boardId,
      userId: 'user-1',
      content: 'この場所でおすすめのお店はありますか？',
      stickerId: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: `thread-${boardId}-2`,
      boardId,
      userId: 'user-2',
      content: '今日は天気が良いですね！散歩している方いませんか？',
      stickerId: 'sticker-1',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)    },
    {
      id: `thread-${boardId}-3`,
      boardId,
      userId: 'user-3',
      content: 'イベント情報: 来週末にフリーマーケットが開催されます！',
      stickerId: null,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  // 掲示板タイプに応じて内容をカスタマイズ
  if (boardId.includes('station')) {
    baseThreads.push({
      id: `thread-${boardId}-4`,
      boardId,
      userId: 'user-4',
      content: '電車の遅延情報を共有します。山手線で信号故障があるようです。',
      stickerId: null,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    });
  } else if (boardId.includes('park')) {
    baseThreads.push({
      id: `thread-${boardId}-4`,
      boardId,
      userId: 'user-5',
      content: '桜が満開です！写真撮影スポットとしてもおすすめです。',
      stickerId: 'sticker-2',
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 45 * 60 * 1000)
    });
  } else if (boardId.includes('ward')) {
    baseThreads.push({
      id: `thread-${boardId}-4`,
      boardId,
      userId: 'user-6',
      content: '地域のお祭り情報です。来月第一土曜日に開催予定！',
      stickerId: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    });
  }

  return baseThreads;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    
    // 実際の実装では、IBoardThreadRepositoryを使用してデータベースから取得
    const threads = generateMockThreads(boardId);
    
    // アクティブなスレッドのみを返す（期限切れやアーカイブされたものを除外）
    const activeThreads = threads.filter(thread => 
      !thread.isArchived && 
      (!thread.expiresAt || thread.expiresAt > new Date())
    );

    return NextResponse.json({
      threads: activeThreads,
      total: activeThreads.length
    });
  } catch (error) {
    console.error('Board threads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}