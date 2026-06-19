import { ListNotificationsUseCase } from '../../application/use-cases/ListNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/MarkNotificationAsReadUseCase';

export class NotificationController {
  constructor(
    private listNotificationsUseCase: ListNotificationsUseCase,
    private markNotificationAsReadUseCase: MarkNotificationAsReadUseCase
  ) {}

  async listNotifications(userId: string): Promise<Response> {
    try {
      const notifications = await this.listNotificationsUseCase.execute(userId);
      return Response.json({
        data: notifications.map(n => ({
          id: n.id,
          userId: n.userId,
          notifierId: n.notifierId,
          type: n.type,
          resourceId: n.resourceId,
          commentId: n.commentId,
          isRead: n.isRead,
          createdAt: n.createdAt,
          notifier: n.notifier,
          resource: n.resource,
        })),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('List Notifications API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al listar las notificaciones.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async markAsRead(userId: string, notificationId?: string | null): Promise<Response> {
    try {
      await this.markNotificationAsReadUseCase.execute(userId, notificationId);
      return Response.json({
        data: { success: true },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Mark Notification as Read API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al marcar como leída la notificación.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }
}
