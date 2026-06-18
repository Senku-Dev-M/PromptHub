import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Like } from '../../domain/entities/Like';
import { ILikeRepository } from '../../domain/repositories/ILikeRepository';

export class SupabaseLikeRepository implements ILikeRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async add(like: Like): Promise<void> {
    const { error } = await this.client
      .from('likes')
      .insert({
        user_id: like.userId,
        resource_id: like.resourceId,
        created_at: like.createdAt.toISOString(),
      });

    if (error) {
      throw new Error(`Error al insertar like: ${error.message}`);
    }
  }

  async delete(userId: string, resourceId: string): Promise<void> {
    const { error } = await this.client
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('resource_id', resourceId);

    if (error) {
      throw new Error(`Error al eliminar like: ${error.message}`);
    }
  }

  async exists(userId: string, resourceId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }
}
