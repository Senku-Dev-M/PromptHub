import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  update(notification: Notification): Promise<void>;
  findManyByUser(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
}
