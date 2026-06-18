import { Resource, ResourceType, ResourceStatus, ResourceFileProps } from '../../domain/entities/Resource';
import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { CategoryNotFoundException } from '../../domain/exceptions/ResourceExceptions';

export interface CreateResourceInput {
  authorId: string;
  title: string;
  description?: string | null;
  content: string;
  type: ResourceType;
  status: ResourceStatus;
  categoryId?: string | null;
  compatibleModels?: string[];
  exampleInput?: string | null;
  exampleOutput?: string | null;
  metadata?: Record<string, any>;
  tags?: string[];
  files?: ResourceFileProps[];
}

export class CreateResourceUseCase {
  constructor(
    private resourceRepository: IResourceRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(input: CreateResourceInput): Promise<Resource> {
    // 1. Validar categoría si se proporciona
    if (input.categoryId) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new CategoryNotFoundException(input.categoryId);
      }
    }

    // 2. Generar slug único
    let baseSlug = Resource.generateSlug(input.title);
    if (!baseSlug) baseSlug = 'recurso-ia';
    
    let slug = baseSlug;
    let suffix = 1;
    while (await this.resourceRepository.slugExists(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // 3. Crear entidad de dominio
    const resource = Resource.create({
      id: crypto.randomUUID(), // Generamos UUID
      authorId: input.authorId,
      title: input.title,
      slug,
      description: input.description,
      content: input.content,
      type: input.type,
      status: input.status,
      categoryId: input.categoryId,
      compatibleModels: input.compatibleModels,
      exampleInput: input.exampleInput,
      exampleOutput: input.exampleOutput,
      metadata: input.metadata,
      publishedAt: input.status === 'published' ? new Date() : null,
      tags: input.tags,
      files: input.files,
    });

    // 4. Guardar en base de datos
    await this.resourceRepository.save(resource);

    return resource;
  }
}
