import { ToggleFollowUseCase } from '../../application/use-cases/ToggleFollowUseCase';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { IFollowRepository } from '../../domain/repositories/IFollowRepository';

export class FollowController {
  constructor(
    private toggleFollowUseCase: ToggleFollowUseCase,
    private profileRepository: IProfileRepository,
    private followRepository: IFollowRepository
  ) {}

  async toggleFollow(followerId: string, followingUsername: string): Promise<Response> {
    try {
      const targetProfile = await this.profileRepository.findByUsername(followingUsername);
      if (!targetProfile) {
        return Response.json({
          data: null,
          error: { code: 'NOT_FOUND', message: `El usuario @${followingUsername} no existe.` },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 404 });
      }

      const result = await this.toggleFollowUseCase.execute(followerId, targetProfile.id);
      return Response.json({
        data: result,
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Follow API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al alternar seguimiento.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async checkFollowing(followerId: string, followingUsername: string): Promise<Response> {
    try {
      const targetProfile = await this.profileRepository.findByUsername(followingUsername);
      if (!targetProfile) {
        return Response.json({
          data: null,
          error: { code: 'NOT_FOUND', message: `El usuario @${followingUsername} no existe.` },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 404 });
      }

      const following = await this.followRepository.exists(followerId, targetProfile.id);
      return Response.json({
        data: { following },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Check Follow API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al verificar seguimiento.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }
}
