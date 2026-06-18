import { Resource } from '../../domain/entities/Resource';
import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import { ResourceNotFoundException } from '../../domain/exceptions/ResourceExceptions';

export interface GetResourceInput {
  id?: string;
  slug?: string;
}

export class GetResourceUseCase {
  constructor(private resourceRepository: IResourceRepository) {}

  async execute(input: GetResourceInput): Promise<Resource> {
    let resource: Resource | null = null;

    if (input.id) {
      resource = await this.resourceRepository.findById(input.id);
    } else if (input.slug) {
      resource = await this.resourceRepository.findBySlug(input.slug);
    }

    if (!resource) {
      throw new ResourceNotFoundException(input.id || input.slug || '');
    }

    return resource;
  }
}
