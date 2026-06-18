import { ILikeRepository } from '../../domain/repositories/ILikeRepository';

export class CheckUserLikedUseCase {
  constructor(private likeRepository: ILikeRepository) {}

  async execute(userId: string, resourceId: string): Promise<boolean> {
    return this.likeRepository.exists(userId, resourceId);
  }
}
