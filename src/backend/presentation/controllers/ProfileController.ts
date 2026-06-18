import { GetProfileUseCase } from '../../application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../application/use-cases/UpdateProfileUseCase';
import { 
  DomainException, 
  ProfileNotFoundException, 
  UsernameAlreadyExistsException, 
  UnauthorizedProfileAccessException 
} from '../../domain/exceptions/ProfileExceptions';
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.',
  }),
  displayName: z.string().max(100).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url({ message: 'Debe ser una URL válida.' }).or(z.literal('')).nullable().optional(),
  websiteUrl: z.string().url({ message: 'Debe ser una URL válida.' }).or(z.literal('')).nullable().optional(),
  socialLinks: z.record(z.string(), z.any()).optional(),
});

export class ProfileController {
  constructor(
    private getProfileUseCase: GetProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase
  ) {}

  private mapDomainToResponse(profile: any) {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      websiteUrl: profile.websiteUrl,
      socialLinks: profile.socialLinks,
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private handleError(error: any) {
    console.error('API Error:', error);

    let status = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Ocurrió un error inesperado en el servidor.';
    let details: any = null;

    if (error instanceof z.ZodError) {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = 'Los datos enviados no son válidos.';
      details = error.issues.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
    } else if (error instanceof ProfileNotFoundException) {
      status = 404;
      code = 'PROFILE_NOT_FOUND';
      message = error.message;
    } else if (error instanceof UsernameAlreadyExistsException) {
      status = 400;
      code = 'USERNAME_ALREADY_EXISTS';
      message = error.message;
    } else if (error instanceof UnauthorizedProfileAccessException) {
      status = 403;
      code = 'UNAUTHORIZED_ACCESS';
      message = error.message;
    } else if (error instanceof DomainException) {
      status = 400;
      code = 'DOMAIN_ERROR';
      message = error.message;
    } else if (error instanceof Error) {
      // Si arrojó un error genérico (ejemplo la validación interna de la entidad)
      status = 400;
      code = 'BAD_REQUEST';
      message = error.message;
    }

    return Response.json({
      data: null,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString() }
    }, { status });
  }

  async getPublicProfile(username: string): Promise<Response> {
    try {
      const profile = await this.getProfileUseCase.execute({ username });
      return Response.json({
        data: this.mapDomainToResponse(profile),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMyProfile(userId: string): Promise<Response> {
    try {
      const profile = await this.getProfileUseCase.execute({ id: userId });
      return Response.json({
        data: this.mapDomainToResponse(profile),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProfile(userId: string, req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const validated = updateProfileSchema.parse(body);

      const profile = await this.updateProfileUseCase.execute({
        authUserId: userId,
        id: userId,
        username: validated.username,
        displayName: validated.displayName,
        bio: validated.bio,
        avatarUrl: validated.avatarUrl,
        websiteUrl: validated.websiteUrl,
        socialLinks: validated.socialLinks,
      });

      return Response.json({
        data: this.mapDomainToResponse(profile),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
