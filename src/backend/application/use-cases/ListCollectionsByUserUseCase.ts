import { Collection } from '../../domain/entities/Collection';
import { ICollectionRepository } from '../../domain/repositories/ICollectionRepository';

export class ListCollectionsByUserUseCase {
  constructor(private collectionRepository: ICollectionRepository) {}

  async execute(userId: string): Promise<Collection[]> {
    return this.collectionRepository.findByUser(userId);
  }
}
