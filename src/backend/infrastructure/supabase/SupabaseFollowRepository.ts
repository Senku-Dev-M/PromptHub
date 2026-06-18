import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Follow } from '../../domain/entities/Follow';
import { IFollowRepository } from '../../domain/repositories/IFollowRepository';

export class SupabaseFollowRepository implements IFollowRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async add(follow: Follow): Promise<void> {
    const { error } = await this.client
      .from('follows')
      .insert({
        follower_id: follow.followerId,
        following_id: follow.followingId,
        created_at: follow.createdAt.toISOString(),
      });

    if (error) {
      throw new Error(`Error al seguir al usuario: ${error.message}`);
    }
  }

  async delete(followerId: string, followingId: string): Promise<void> {
    const { error } = await this.client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new Error(`Error al dejar de seguir al usuario: ${error.message}`);
    }
  }

  async exists(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async findFollowingIds(followerId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('follows')
      .select('following_id')
      .eq('follower_id', followerId);

    if (error || !data) return [];
    return data.map((row) => row.following_id);
  }
}
