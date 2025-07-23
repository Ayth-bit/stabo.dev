import { NextRequest, NextResponse } from 'next/server';
import { Board, BoardThread, User, Chat } from '@/app/types/domain';

// 仮のデータ生成（実際の実装では各Repositoryを使用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const showBoards = searchParams.get('showBoards') === 'true';
    const showThreads = searchParams.get('showThreads') === 'true';
    const showUsers = searchParams.get('showUsers') === 'true';
    const showChats = searchParams.get('showChats') === 'true';
    const boardType = searchParams.get('boardType') || 'all';
    const startDate = new Date(searchParams.get('startDate') || '');
    const endDate = new Date(searchParams.get('endDate') || '');

    // 実際の実装では各Repositoryからデータを取得
    // const boardRepository = new SupabaseBoardRepository();
    // const threadRepository = new SupabaseBoardThreadRepository();
    // const userRepository = new SupabaseUserRepository();
    // const chatRepository = new SupabaseChatRepository();
    
    let boards: Board[] = [];
    let threads: BoardThread[] = [];
    let users: User[] = [];
    let chats: Chat[] = [];

    // 仮データの生成（開発用）
    if (showBoards) {
      boards = generateMockBoards(boardType as 'all' | 'station' | 'ward' | 'park');
    }
    
    if (showThreads) {
      threads = generateMockThreads(startDate, endDate);
    }
    
    if (showUsers) {
      users = generateMockUsers();
    }
    
    if (showChats) {
      chats = generateMockChats(startDate, endDate);
    }

    return NextResponse.json({
      boards,
      threads,
      users,
      chats
    });

  } catch (error) {
    console.error('Admin map data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}

// 仮のデータ生成関数（開発用）
function generateMockBoards(boardType: 'all' | 'station' | 'ward' | 'park'): Board[] {
  const mockBoards: Board[] = [
    {
      id: 'board-1',
      name: '渋谷駅',
      type: 'station',
      lat: 35.6580, 
      lng: 139.7016,
      accessRadius: 1650,
      createdAt: new Date()
    },
    {
      id: 'board-2',
      name: '新宿駅',
      type: 'station',
      lat: 35.6896,
      lng: 139.7006,
      accessRadius: 1650,
      createdAt: new Date()
    },
    {
      id: 'board-3',
      name: '渋谷区',
      type: 'ward',
      lat: 35.6614,
      lng: 139.7044,
      accessRadius: 3000,
      createdAt: new Date()
    },
    {
      id: 'board-4',
      name: '代々木公園',
      type: 'park',
      lat: 35.6732,
      lng: 139.6958,
      accessRadius: 1000,
      createdAt: new Date()
    },
    {
      id: 'board-5',
      name: '上野公園',
      type: 'park',
      lat: 35.7146,
      lng: 139.7740,
      accessRadius: 1000,
      createdAt: new Date()
    }
  ];

  if (boardType === 'all') {
    return mockBoards;
  }
  
  return mockBoards.filter(board => board.type === boardType);
}

function generateMockThreads(startDate: Date, endDate: Date): BoardThread[] {
  const mockThreads: BoardThread[] = [
    {
      id: 'thread-1',
      boardId: 'board-1',
      userId: 'user-1',
      content: '渋谷駅で面白いイベントがありました！',
      stickerId: 'sticker-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'thread-2',
      boardId: 'board-2',
      userId: 'user-2',
      content: '新宿で美味しいラーメン店を発見',
      stickerId: null,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 'thread-3',
      boardId: 'board-4',
      userId: 'user-1',
      content: '代々木公園で桜が綺麗です',
      stickerId: 'sticker-2',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      isArchived: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
    }
  ];

  return mockThreads.filter(thread => {
    const threadDate = new Date(thread.createdAt);
    return threadDate >= startDate && threadDate <= endDate;
  });
}

function generateMockUsers(): User[] {
  return [
    {
      id: 'user-1',
      displayName: 'タロウ',
      avatarUrl: null,
      baseLat: 35.6580,
      baseLng: 139.7016,
      baseRadius: 1000,
      isCreator: false,
      qrCode: 'stabo_user1_abc123',
      points: 150,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'user-2',
      displayName: 'ハナコ',
      avatarUrl: null,
      baseLat: 35.6896,
      baseLng: 139.7006,
      baseRadius: 1500,
      isCreator: true,
      qrCode: 'stabo_user2_def456',
      points: 320,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'user-3',
      displayName: 'ジロウ',
      avatarUrl: null,
      baseLat: 35.6732,
      baseLng: 139.6958,
      baseRadius: 800,
      isCreator: false,
      qrCode: 'stabo_user3_ghi789',
      points: 80,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];
}

function generateMockChats(startDate: Date, endDate: Date): Chat[] {
  const mockChats: Chat[] = [
    {
      id: 'chat-1',
      senderId: 'user-1',
      receiverId: 'user-2',
      message: 'こんにちは！渋谷で会いませんか？',
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 'chat-2',
      senderId: 'user-2',
      receiverId: 'user-1',
      message: 'はい、ぜひお会いしましょう！',
      isRead: true,
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
    },
    {
      id: 'chat-3',
      senderId: 'user-1',
      receiverId: 'user-3',
      message: '代々木公園はどうでしたか？',
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ];

  return mockChats.filter(chat => {
    const chatDate = new Date(chat.createdAt);
    return chatDate >= startDate && chatDate <= endDate;
  });
}