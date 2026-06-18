import { Resource } from '../../domain/entities/Resource';
import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import { IFollowRepository } from '../../domain/repositories/IFollowRepository';

export interface GetFeedInput {
  userId: string;
  limit?: number;
  offset?: number;
}

export class GetPersonalizedFeedUseCase {
  constructor(
    private resourceRepository: IResourceRepository,
    private followRepository: IFollowRepository
  ) {}

  async execute(input: GetFeedInput): Promise<{ resources: Resource[]; total: number }> {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    // 1. Obtener los IDs de usuarios seguidos
    const followingIds = await this.followRepository.findFollowingIds(input.userId);

    // 2. Fallback: Si no sigue a nadie, retornamos recursos publicados recientes
    if (followingIds.length === 0) {
      return this.resourceRepository.findMany({
        status: 'published',
        limit,
        offset,
      });
    }

    // 3. Consultar recursos publicados por los usuarios seguidos
    return this.resourceRepository.findMany({
      authorIds: followingIds,
      status: 'published',
      limit,
      offset,
    });
  }
}
