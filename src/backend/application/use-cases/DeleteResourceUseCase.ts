import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import { 
  ResourceNotFoundException, 
  UnauthorizedResourceAccessException 
} from '../../domain/exceptions/ResourceExceptions';

export interface DeleteResourceInput {
  authUserId: string;
  id: string;
}

export class DeleteResourceUseCase {
  constructor(private resourceRepository: IResourceRepository) {}

  async execute(input: DeleteResourceInput): Promise<void> {
    const resource = await this.resourceRepository.findById(input.id);
    if (!resource) {
      throw new ResourceNotFoundException(input.id);
    }

    if (resource.authorId !== input.authUserId) {
      throw new UnauthorizedResourceAccessException();
    }

    await this.resourceRepository.delete(input.id);
  }
}
