import { Collection } from '../entities/Collection';

export interface ICollectionRepository {
  findById(id: string): Promise<Collection | null>;
  findBySlug(ownerId: string, slug: string): Promise<Collection | null>;
  save(collection: Collection): Promise<void>;
  update(collection: Collection): Promise<void>;
  delete(id: string): Promise<void>;
  findByUser(userId: string): Promise<Collection[]>;
  addResource(collectionId: string, resourceId: string): Promise<void>;
  removeResource(collectionId: string, resourceId: string): Promise<void>;
  hasResource(collectionId: string, resourceId: string): Promise<boolean>;
}
