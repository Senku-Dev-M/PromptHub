import { ICollectionRepository } from '../../domain/repositories/ICollectionRepository';

export class AddResourceToCollectionUseCase {
  constructor(private collectionRepository: ICollectionRepository) {}

  async execute(ownerId: string, collectionId: string, resourceId: string): Promise<void> {
    const collection = await this.collectionRepository.findById(collectionId);
    if (!collection) {
      throw new Error('La colección no existe.');
    }

    if (collection.ownerId !== ownerId) {
      throw new Error('No tienes permisos para modificar esta colección.');
    }

    const alreadyHas = await this.collectionRepository.hasResource(collectionId, resourceId);
    if (alreadyHas) {
      throw new Error('El recurso ya se encuentra en esta colección.');
    }

    await this.collectionRepository.addResource(collectionId, resourceId);
  }
}
