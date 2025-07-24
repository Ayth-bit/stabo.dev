import { supabase } from '@/lib/supabase'
import type { Board, BoardType } from '@/app/types/domain'

export class SupabaseBoardRepository {
  private mapDbToBoard(dbBoard: Record<string, unknown>): Board {
    return {
      id: dbBoard.id as string,
      type: dbBoard.type as BoardType,
      name: dbBoard.name as string,
      lat: dbBoard.latitude as number,
      lng: dbBoard.longitude as number,
      accessRadius: dbBoard.access_radius as number,
      viewRadius: dbBoard.view_radius as number,
      description: dbBoard.description as string,
      createdAt: new Date(dbBoard.created_at as string),
    }
  }

  async findAll(): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching boards:', error)
      return []
    }

    return data ? data.map(this.mapDbToBoard) : []
  }

  async findByType(type: 'station' | 'ward' | 'park'): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching boards by type:', error)
      return []
    }

    return data ? data.map(this.mapDbToBoard) : []
  }

  async findById(id: string): Promise<Board | null> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching board by id:', error)
      return null
    }

    return data ? this.mapDbToBoard(data) : null
  }
}