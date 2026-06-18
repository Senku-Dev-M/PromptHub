import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { Profile } from '../../domain/entities/Profile';
import { ProfileNotFoundException } from '../../domain/exceptions/ProfileExceptions';

export class GetProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(params: { id?: string; username?: string }): Promise<Profile> {
    let profile: Profile | null = null;

    if (params.id) {
      profile = await this.profileRepository.findById(params.id);
    } else if (params.username) {
      profile = await this.profileRepository.findByUsername(params.username);
    }

    if (!profile) {
      throw new ProfileNotFoundException(params.id || params.username || 'unknown');
    }

    return profile;
  }
}
