import { Profile } from '../entities/Profile';

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByUsername(username: string): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
  usernameExists(username: string): Promise<boolean>;
}
