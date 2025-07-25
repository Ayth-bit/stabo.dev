import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Chat } from '@/app/types/domain'

export class SupabaseChatRepository {
  private mapDbToChat(dbChat: Record<string, unknown>): Chat {
    return {
      id: dbChat.id as string,
      senderId: dbChat.sender_id as string,
      receiverId: dbChat.receiver_id as string,
      message: dbChat.content as string,
      isRead: dbChat.is_read as boolean,
      createdAt: new Date(dbChat.created_at as string),
    }
  }

  async findAll(): Promise<Chat[]> {
    const { data, error } = await supabaseAdmin
      .from('direct_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching chats:', error)
      return []
    }

    return data ? data.map(this.mapDbToChat) : []
  }

  async findById(id: string): Promise<Chat | null> {
    const { data, error } = await supabaseAdmin
      .from('direct_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching chat by id:', error)
      return null
    }

    return data ? this.mapDbToChat(data) : null
  }

  async findByUserId(userId: string): Promise<Chat[]> {
    const { data, error } = await supabaseAdmin
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching chats by user id:', error)
      return []
    }

    return data ? data.map(this.mapDbToChat) : []
  }
}