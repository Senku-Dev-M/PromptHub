import { Resource } from '../entities/Resource';

export interface FindManyFilters {
  search?: string;
  categoryId?: string;
  type?: string;
  types?: string[];
  authorId?: string;
  authorIds?: string[];
  status?: string;
  limit?: number;
  offset?: number;
}

export interface IResourceRepository {
  findById(id: string): Promise<Resource | null>;
  findBySlug(slug: string): Promise<Resource | null>;
  save(resource: Resource): Promise<void>;
  update(resource: Resource): Promise<void>;
  delete(id: string): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
  findMany(filters: FindManyFilters): Promise<{ resources: Resource[]; total: number }>;
}
