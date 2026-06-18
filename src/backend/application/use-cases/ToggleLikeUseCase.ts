import { Like } from '../../domain/entities/Like';
import { ILikeRepository } from '../../domain/repositories/ILikeRepository';

export class ToggleLikeUseCase {
  constructor(private likeRepository: ILikeRepository) {}

  async execute(userId: string, resourceId: string): Promise<{ liked: boolean }> {
    const isLiked = await this.likeRepository.exists(userId, resourceId);

    if (isLiked) {
      await this.likeRepository.delete(userId, resourceId);
      return { liked: false };
    } else {
      const like = Like.create({ userId, resourceId });
      await this.likeRepository.add(like);
      return { liked: true };
    }
  }
}
