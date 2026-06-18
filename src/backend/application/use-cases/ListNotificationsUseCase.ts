import { Notification } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';

export class ListNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: string, limit?: number): Promise<Notification[]> {
    return this.notificationRepository.findManyByUser(userId, limit);
  }
}
