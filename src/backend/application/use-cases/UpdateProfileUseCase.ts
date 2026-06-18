import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { Profile } from '../../domain/entities/Profile';
import { 
  ProfileNotFoundException, 
  UsernameAlreadyExistsException, 
  UnauthorizedProfileAccessException 
} from '../../domain/exceptions/ProfileExceptions';

export interface UpdateProfileInput {
  authUserId: string;
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  socialLinks?: Record<string, any>;
}

export class UpdateProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(input: UpdateProfileInput): Promise<Profile> {
    // 1. Autorización a nivel de aplicación: El usuario autenticado solo puede editar su propio perfil
    if (input.authUserId !== input.id) {
      throw new UnauthorizedProfileAccessException();
    }

    // 2. Recuperar el perfil actual
    const profile = await this.profileRepository.findById(input.id);
    if (!profile) {
      throw new ProfileNotFoundException(input.id);
    }

    // 3. Si el nombre de usuario cambió, validar que no esté tomado
    if (input.username !== profile.username) {
      const exists = await this.profileRepository.usernameExists(input.username);
      if (exists) {
        throw new UsernameAlreadyExistsException(input.username);
      }
    }

    // 4. Instanciar un nuevo estado del perfil (aplicando las reglas del dominio)
    // El constructor de Profile validará el formato del username
    const updatedProfile = Profile.create({
      id: profile.id,
      username: input.username,
      displayName: input.displayName !== undefined ? input.displayName : profile.displayName,
      bio: input.bio !== undefined ? input.bio : profile.bio,
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : profile.avatarUrl,
      websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl : profile.websiteUrl,
      socialLinks: input.socialLinks !== undefined ? input.socialLinks : profile.socialLinks,
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
    });

    // 5. Persistir los cambios
    await this.profileRepository.update(updatedProfile);

    return updatedProfile;
  }
}
