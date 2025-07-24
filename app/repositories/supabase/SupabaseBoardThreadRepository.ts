import { supabase } from '@/lib/supabase'
import type { BoardThread } from '@/app/types/domain'

export class SupabaseBoardThreadRepository {
  private mapDbToThread(dbThread: Record<string, unknown>): BoardThread {
    return {
      id: dbThread.id as string,
      boardId: dbThread.board_id as string,
      userId: dbThread.author_id as string,
      content: dbThread.content as string,
      stickerId: null, // スキーマにはstickerIdがないため一旦null
      createdAt: new Date(dbThread.created_at as string),
      expiresAt: dbThread.expires_at ? new Date(dbThread.expires_at as string) : null,
      isArchived: dbThread.is_archived as boolean,
      viewCount: 0, // スキーマにはview_countがないため一旦0
      likeCount: 0, // スキーマにはlike_countがないため一旦0
    }
  }

  async findAll(): Promise<BoardThread[]> {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching threads:', error)
      return []
    }

    return data ? data.map(this.mapDbToThread) : []
  }

  async findByBoardId(boardId: string): Promise<BoardThread[]> {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching threads by board id:', error)
      return []
    }

    return data ? data.map(this.mapDbToThread) : []
  }

  async findById(id: string): Promise<BoardThread | null> {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching thread by id:', error)
      return null
    }

    return data ? this.mapDbToThread(data) : null
  }
}