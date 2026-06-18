import { INotificationRepository } from '../../domain/repositories/INotificationRepository';

export class MarkNotificationAsReadUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: string, id?: string | null): Promise<void> {
    if (id) {
      const notification = await this.notificationRepository.findById(id);
      if (!notification) {
        throw new Error('Notificación no encontrada.');
      }
      if (notification.userId !== userId) {
        throw new Error('No tienes permisos sobre esta notificación.');
      }
      notification.markAsRead();
      await this.notificationRepository.update(notification);
    } else {
      // Marcar todas como leídas
      const notifications = await this.notificationRepository.findManyByUser(userId);
      for (const notif of notifications) {
        if (!notif.isRead) {
          notif.markAsRead();
          await this.notificationRepository.update(notif);
        }
      }
    }
  }
}
