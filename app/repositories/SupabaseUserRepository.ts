// Supabase User Repository - ユーザー関連のデータアクセス実装
// ====================================

import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@/app/types/domain';
import { IUserRepository } from '@/app/repositories/interfaces';

export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users_extended')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.mapToUser(data);
  }

  async findByQrCode(qrCode: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users_extended')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    if (error || !data) return null;

    return this.mapToUser(data);
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users_extended')
      .insert([{
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        base_lat: user.baseLat,
        base_lng: user.baseLng,
        base_radius: user.baseRadius,
        is_creator: user.isCreator,
        qr_code: user.qrCode,
        points: user.points
      }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }

    return this.mapToUser(data);
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const updateData: Record<string, unknown> = {};

    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.baseLat !== undefined) updateData.base_lat = updates.baseLat;
    if (updates.baseLng !== undefined) updateData.base_lng = updates.baseLng;
    if (updates.baseRadius !== undefined) updateData.base_radius = updates.baseRadius;
    if (updates.isCreator !== undefined) updateData.is_creator = updates.isCreator;
    if (updates.points !== undefined) updateData.points = updates.points;

    const { data, error } = await this.supabase
      .from('users_extended')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user: ${error?.message}`);
    }

    return this.mapToUser(data);
  }

  async updatePoints(id: string, points: number): Promise<void> {
    const { error } = await this.supabase
      .from('users_extended')
      .update({ points })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update points: ${error.message}`);
    }
  }

  private mapToUser(data: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    base_lat: number | null;
    base_lng: number | null;
    base_radius: number;
    is_creator: boolean;
    qr_code: string | null;
    points: number;
    created_at: string;
    updated_at: string;
  }): User {
    return {
      id: data.id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      baseLat: data.base_lat,
      baseLng: data.base_lng,
      baseRadius: data.base_radius,
      isCreator: data.is_creator,
      qrCode: data.qr_code,
      points: data.points,
      createdAt: new Date(data.created_at)
    };
  }
}