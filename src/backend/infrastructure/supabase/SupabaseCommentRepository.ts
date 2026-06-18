import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../../domain/repositories/ICommentRepository';

export class SupabaseCommentRepository implements ICommentRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Comment | null> {
    const { data, error } = await this.client
      .from('comments')
      .select('*, profiles:author_id(username, display_name, avatar_url)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async save(comment: Comment): Promise<void> {
    const { error } = await this.client
      .from('comments')
      .insert({
        id: comment.id,
        resource_id: comment.resourceId,
        author_id: comment.authorId,
        parent_id: comment.parentId,
        content: comment.content,
        is_edited: comment.isEdited,
        created_at: comment.createdAt.toISOString(),
        updated_at: comment.updatedAt.toISOString(),
      });

    if (error) {
      throw new Error(`Error al guardar comentario: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar comentario: ${error.message}`);
    }
  }

  async findByResourceId(resourceId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from('comments')
      .select('*, profiles:author_id(username, display_name, avatar_url)')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => this.mapToDomain(row));
  }

  private mapToDomain(row: any): Comment {
    return Comment.create({
      id: row.id,
      resourceId: row.resource_id,
      authorId: row.author_id,
      parentId: row.parent_id,
      content: row.content,
      isEdited: row.is_edited,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      authorProfile: row.profiles ? {
        username: row.profiles.username,
        displayName: row.profiles.display_name,
        avatarUrl: row.profiles.avatar_url,
      } : null,
    });
  }
}
