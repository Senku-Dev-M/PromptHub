export type NotificationType = 'like' | 'comment' | 'follow' | 'system';

export interface NotificationProps {
  id?: string;
  userId: string;
  notifierId: string;
  type: NotificationType;
  resourceId?: string | null;
  commentId?: string | null;
  isRead?: boolean;
  createdAt?: Date;
  notifier?: { username: string; displayName?: string | null } | null;
  resource?: { title: string } | null;
}

export class Notification {
  private constructor(private props: NotificationProps) {
    this.validateType(props.type);
  }

  public static create(props: NotificationProps): Notification {
    return new Notification({
      ...props,
      isRead: props.isRead !== undefined ? props.isRead : false,
      resourceId: props.resourceId || null,
      commentId: props.commentId || null,
      createdAt: props.createdAt || new Date(),
      notifier: props.notifier || null,
      resource: props.resource || null,
    });
  }

  private validateType(type: NotificationType) {
    const validTypes = ['like', 'comment', 'follow', 'system'];
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de notificación no válido: ${type}`);
    }
  }

  get id(): string | undefined { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get notifierId(): string { return this.props.notifierId; }
  get type(): NotificationType { return this.props.type; }
  get resourceId(): string | null | undefined { return this.props.resourceId; }
  get commentId(): string | null | undefined { return this.props.commentId; }
  get isRead(): boolean { return this.props.isRead || false; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
  get notifier(): { username: string; displayName?: string | null } | null | undefined { return this.props.notifier; }
  get resource(): { title: string } | null | undefined { return this.props.resource; }

  public markAsRead() {
    this.props.isRead = true;
  }
}
