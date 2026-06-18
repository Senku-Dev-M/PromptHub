import { Collection } from '../../domain/entities/Collection';
import { ICollectionRepository } from '../../domain/repositories/ICollectionRepository';

export interface CreateCollectionInput {
  ownerId: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublic?: boolean;
}

export class CreateCollectionUseCase {
  constructor(private collectionRepository: ICollectionRepository) {}

  async execute(input: CreateCollectionInput): Promise<Collection> {
    // 1. Generar base slug
    let baseSlug = this.generateSlug(input.name);
    if (!baseSlug) baseSlug = 'coleccion';

    let slug = baseSlug;
    let suffix = 1;
    
    // Garantizar que sea único para este usuario
    while (await this.collectionRepository.findBySlug(input.ownerId, slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const collection = Collection.create({
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      name: input.name,
      slug,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      isPublic: input.isPublic,
    });

    await this.collectionRepository.save(collection);
    return collection;
  }

  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
