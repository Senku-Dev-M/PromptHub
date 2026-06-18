export interface LikeProps {
  userId: string;
  resourceId: string;
  createdAt?: Date;
}

export class Like {
  private constructor(private props: LikeProps) {}

  public static create(props: LikeProps): Like {
    return new Like({
      ...props,
      createdAt: props.createdAt || new Date(),
    });
  }

  get userId(): string { return this.props.userId; }
  get resourceId(): string { return this.props.resourceId; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
}
