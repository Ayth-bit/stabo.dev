import { supabaseAdmin } from '@/lib/supabase-admin'
import type { User } from '@/app/types/domain'

export class SupabaseUserRepository {
  private mapDbToUser(dbUser: Record<string, unknown>): User {
    return {
      id: dbUser.id as string,
      displayName: dbUser.display_name as string | null,
      avatarUrl: dbUser.avatar_url as string | null,
      baseLat: dbUser.home_base_lat as number | null,
      baseLng: dbUser.home_base_lng as number | null,
      baseRadius: (dbUser.base_radius as number) || 1000,
      isCreator: dbUser.is_creator as boolean,
      qrCode: dbUser.qr_code as string | null,
      points: dbUser.points as number,
      createdAt: new Date(dbUser.created_at as string),
    }
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users_extended')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data ? data.map(this.mapDbToUser) : []
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users_extended')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user by id:', error)
      return null
    }

    return data ? this.mapDbToUser(data) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users_extended')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }

    return data ? this.mapDbToUser(data) : null
  }
}