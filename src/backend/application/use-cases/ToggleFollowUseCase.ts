import { Follow } from '../../domain/entities/Follow';
import { IFollowRepository } from '../../domain/repositories/IFollowRepository';

export class ToggleFollowUseCase {
  constructor(private followRepository: IFollowRepository) {}

  async execute(followerId: string, followingId: string): Promise<{ followed: boolean }> {
    if (followerId === followingId) {
      throw new Error('No puedes seguirte a ti mismo.');
    }

    const isFollowing = await this.followRepository.exists(followerId, followingId);

    if (isFollowing) {
      await this.followRepository.delete(followerId, followingId);
      return { followed: false };
    } else {
      const follow = Follow.create({ followerId, followingId });
      await this.followRepository.add(follow);
      return { followed: true };
    }
  }
}
