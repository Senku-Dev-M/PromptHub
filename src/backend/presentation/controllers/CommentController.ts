import { z } from 'zod';
import { AddCommentUseCase } from '../../application/use-cases/AddCommentUseCase';
import { DeleteCommentUseCase } from '../../application/use-cases/DeleteCommentUseCase';
import { ListCommentsByResourceUseCase } from '../../application/use-cases/ListCommentsByResourceUseCase';

const addCommentSchema = z.object({
  content: z.string().min(1, { message: 'El comentario no puede estar vacío.' }).max(1000),
  parentId: z.string().uuid().nullable().optional(),
});

export class CommentController {
  constructor(
    private addCommentUseCase: AddCommentUseCase,
    private deleteCommentUseCase: DeleteCommentUseCase,
    private listCommentsByResourceUseCase: ListCommentsByResourceUseCase
  ) {}

  async addComment(userId: string, resourceId: string, body: any): Promise<Response> {
    try {
      const parsed = addCommentSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: parsed.error.issues[0]?.message || 'Datos inválidos.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      const comment = await this.addCommentUseCase.execute({
        resourceId,
        authorId: userId,
        parentId: parsed.data.parentId,
        content: parsed.data.content,
      });

      return Response.json({
        data: {
          id: comment.id,
          resourceId: comment.resourceId,
          authorId: comment.authorId,
          parentId: comment.parentId,
          content: comment.content,
          isEdited: comment.isEdited,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          authorProfile: comment.authorProfile,
        },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 201 });
    } catch (error: any) {
      console.error('Add Comment API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al añadir el comentario.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async deleteComment(userId: string, commentId: string): Promise<Response> {
    try {
      if (!commentId) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'El ID del comentario es obligatorio.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      await this.deleteCommentUseCase.execute(commentId, userId);
      return Response.json({
        data: { success: true },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Delete Comment API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al eliminar el comentario.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async listComments(resourceId: string): Promise<Response> {
    try {
      if (!resourceId) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'El ID del recurso es obligatorio.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      const comments = await this.listCommentsByResourceUseCase.execute(resourceId);
      return Response.json({
        data: comments.map(c => ({
          id: c.id,
          resourceId: c.resourceId,
          authorId: c.authorId,
          parentId: c.parentId,
          content: c.content,
          isEdited: c.isEdited,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          authorProfile: c.authorProfile,
        })),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('List Comments API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al listar los comentarios.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }
}
