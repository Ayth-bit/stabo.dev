import { SupabaseBoardRepository } from '@/app/repositories/supabase/SupabaseBoardRepository';
import { SupabaseBoardThreadRepository } from '@/app/repositories/supabase/SupabaseBoardThreadRepository';
import { SupabaseChatRepository } from '@/app/repositories/supabase/SupabaseChatRepository';
import { SupabaseUserRepository } from '@/app/repositories/supabase/SupabaseUserRepository';
import type { Board, BoardThread, Chat, User } from '@/app/types/domain';
import { type NextRequest, NextResponse } from 'next/server';

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

    const boardRepository = new SupabaseBoardRepository();
    const threadRepository = new SupabaseBoardThreadRepository();
    const userRepository = new SupabaseUserRepository();
    const chatRepository = new SupabaseChatRepository();

    let boards: Board[] = [];
    let threads: BoardThread[] = [];
    let users: User[] = [];
    let chats: Chat[] = [];

    if (showBoards) {
      if (boardType === 'all') {
        boards = await boardRepository.findAll();
      } else {
        boards = await boardRepository.findByType(boardType as 'station' | 'ward' | 'park');
      }
    }

    if (showThreads) {
      const allThreads = await threadRepository.findAll();
      threads = allThreads.filter((thread) => {
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return true;
        const threadDate = new Date(thread.createdAt);
        return threadDate >= startDate && threadDate <= endDate;
      });
    }

    if (showUsers) {
      users = await userRepository.findAll();
    }

    if (showChats) {
      const allChats = await chatRepository.findAll();
      chats = allChats.filter((chat) => {
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return true;
        const chatDate = new Date(chat.createdAt);
        return chatDate >= startDate && chatDate <= endDate;
      });
    }

    return NextResponse.json({
      boards,
      threads,
      users,
      chats,
    });
  } catch (error) {
    console.error('Admin map data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch map data' }, { status: 500 });
  }
}
