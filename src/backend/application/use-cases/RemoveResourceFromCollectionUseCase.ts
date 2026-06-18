import { ICollectionRepository } from '../../domain/repositories/ICollectionRepository';

export class RemoveResourceFromCollectionUseCase {
  constructor(private collectionRepository: ICollectionRepository) {}

  async execute(ownerId: string, collectionId: string, resourceId: string): Promise<void> {
    const collection = await this.collectionRepository.findById(collectionId);
    if (!collection) {
      throw new Error('La colección no existe.');
    }

    if (collection.ownerId !== ownerId) {
      throw new Error('No tienes permisos para modificar esta colección.');
    }

    const has = await this.collectionRepository.hasResource(collectionId, resourceId);
    if (!has) {
      throw new Error('El recurso no se encuentra en esta colección.');
    }

    await this.collectionRepository.removeResource(collectionId, resourceId);
  }
}
