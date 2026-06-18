import { Follow } from '../entities/Follow';

export interface IFollowRepository {
  add(follow: Follow): Promise<void>;
  delete(followerId: string, followingId: string): Promise<void>;
  exists(followerId: string, followingId: string): Promise<boolean>;
  findFollowingIds(followerId: string): Promise<string[]>;
}
