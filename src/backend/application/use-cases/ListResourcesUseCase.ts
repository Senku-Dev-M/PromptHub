import { Resource } from '../../domain/entities/Resource';
import { IResourceRepository, FindManyFilters } from '../../domain/repositories/IResourceRepository';

export interface ListResourcesInput {
  search?: string;
  categoryId?: string | null;
  type?: string | null;
  authorId?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
}

export class ListResourcesUseCase {
  constructor(private resourceRepository: IResourceRepository) {}

  async execute(input: ListResourcesInput): Promise<{ resources: Resource[]; total: number }> {
    const filters: FindManyFilters = {
      search: input.search || undefined,
      categoryId: input.categoryId || undefined,
      type: input.type || undefined,
      authorId: input.authorId || undefined,
      status: input.status || undefined,
      limit: input.limit !== undefined ? input.limit : 20,
      offset: input.offset !== undefined ? input.offset : 0,
    };

    return this.resourceRepository.findMany(filters);
  }
}
