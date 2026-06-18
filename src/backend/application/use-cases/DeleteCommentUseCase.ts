import { ICommentRepository } from '../../domain/repositories/ICommentRepository';

export class DeleteCommentUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(id: string, authorId: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new Error('Comentario no encontrado.');
    }

    if (comment.authorId !== authorId) {
      throw new Error('No tienes permisos para eliminar este comentario.');
    }

    await this.commentRepository.delete(id);
  }
}
