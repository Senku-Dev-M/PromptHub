export interface FollowProps {
  followerId: string;
  followingId: string;
  createdAt?: Date;
}

export class Follow {
  private constructor(private props: FollowProps) {
    this.validateFollowSelf(props.followerId, props.followingId);
  }

  public static create(props: FollowProps): Follow {
    return new Follow({
      ...props,
      createdAt: props.createdAt || new Date(),
    });
  }

  private validateFollowSelf(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('No puedes seguirte a ti mismo.');
    }
  }

  get followerId(): string { return this.props.followerId; }
  get followingId(): string { return this.props.followingId; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
}
