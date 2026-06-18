import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../../domain/repositories/ICommentRepository';

export class ListCommentsByResourceUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(resourceId: string): Promise<Comment[]> {
    return this.commentRepository.findByResourceId(resourceId);
  }
}
