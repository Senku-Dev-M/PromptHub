import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../../domain/repositories/ICommentRepository';

export interface AddCommentInput {
  resourceId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
}

export class AddCommentUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async execute(input: AddCommentInput): Promise<Comment> {
    // Si tiene parentId, validar que el comentario padre exista y pertenezca al mismo recurso
    if (input.parentId) {
      const parent = await this.commentRepository.findById(input.parentId);
      if (!parent) {
        throw new Error('El comentario al que intentas responder no existe.');
      }
      if (parent.resourceId !== input.resourceId) {
        throw new Error('El comentario padre no pertenece al mismo recurso.');
      }
      // Evitar anidamiento de más de un nivel (respuestas a respuestas)
      if (parent.parentId) {
        throw new Error('No puedes responder a una respuesta de segundo nivel.');
      }
    }

    const comment = Comment.create({
      id: crypto.randomUUID(),
      resourceId: input.resourceId,
      authorId: input.authorId,
      parentId: input.parentId || null,
      content: input.content,
    });

    await this.commentRepository.save(comment);
    const populatedComment = await this.commentRepository.findById(comment.id!);
    return populatedComment || comment;
  }
}
