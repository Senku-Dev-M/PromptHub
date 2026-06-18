import { SupabaseClient } from '@supabase/supabase-js';
import { Notification } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private client: SupabaseClient<any>) {}

  async findById(id: string): Promise<Notification | null> {
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async save(notification: Notification): Promise<void> {
    const { error } = await this.client
      .from('notifications')
      .insert({
        id: notification.id,
        user_id: notification.userId,
        notifier_id: notification.notifierId,
        type: notification.type,
        resource_id: notification.resourceId,
        comment_id: notification.commentId,
        is_read: notification.isRead,
        created_at: notification.createdAt.toISOString(),
      });

    if (error) {
      throw new Error(`Error al guardar la notificación: ${error.message}`);
    }
  }

  async update(notification: Notification): Promise<void> {
    const { error } = await this.client
      .from('notifications')
      .update({
        is_read: notification.isRead,
      })
      .eq('id', notification.id);

    if (error) {
      throw new Error(`Error al actualizar la notificación: ${error.message}`);
    }
  }

  async findManyByUser(userId: string, limit?: number): Promise<Notification[]> {
    let query = this.client
      .from('notifications')
      .select('*, notifier:profiles!notifications_notifier_id_fkey(username, display_name), resource:resources(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row) => this.mapToDomain(row));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  }

  private mapToDomain(row: any): Notification {
    return Notification.create({
      id: row.id,
      userId: row.user_id,
      notifierId: row.notifier_id,
      type: row.type,
      resourceId: row.resource_id,
      commentId: row.comment_id,
      isRead: row.is_read,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      notifier: row.notifier ? {
        username: row.notifier.username,
        displayName: row.notifier.display_name,
      } : null,
      resource: row.resource ? {
        title: row.resource.title,
      } : null,
    });
  }
}
