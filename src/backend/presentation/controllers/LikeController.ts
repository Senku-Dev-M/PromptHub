import { ToggleLikeUseCase } from '../../application/use-cases/ToggleLikeUseCase';
import { CheckUserLikedUseCase } from '../../application/use-cases/CheckUserLikedUseCase';

export class LikeController {
  constructor(
    private toggleLikeUseCase: ToggleLikeUseCase,
    private checkUserLikedUseCase: CheckUserLikedUseCase
  ) {}

  async toggleLike(userId: string, resourceId: string): Promise<Response> {
    try {
      if (!resourceId) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'El ID del recurso es obligatorio.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      const result = await this.toggleLikeUseCase.execute(userId, resourceId);
      return Response.json({
        data: result,
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Like API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al alternar me gusta.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async checkLiked(userId: string, resourceId: string): Promise<Response> {
    try {
      if (!resourceId) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'El ID del recurso es obligatorio.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      const liked = await this.checkUserLikedUseCase.execute(userId, resourceId);
      return Response.json({
        data: { liked },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Check Like API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al comprobar me gusta.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }
}
