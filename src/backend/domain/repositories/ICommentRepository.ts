import { Comment } from '../entities/Comment';

export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  save(comment: Comment): Promise<void>;
  delete(id: string): Promise<void>;
  findByResourceId(resourceId: string): Promise<Comment[]>;
}
