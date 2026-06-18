import { Like } from '../entities/Like';

export interface ILikeRepository {
  add(like: Like): Promise<void>;
  delete(userId: string, resourceId: string): Promise<void>;
  exists(userId: string, resourceId: string): Promise<boolean>;
}
