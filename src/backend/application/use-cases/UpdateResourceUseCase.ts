import { Resource, ResourceType, ResourceStatus, ResourceFileProps } from '../../domain/entities/Resource';
import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { 
  ResourceNotFoundException, 
  UnauthorizedResourceAccessException,
  CategoryNotFoundException 
} from '../../domain/exceptions/ResourceExceptions';

export interface UpdateResourceInput {
  authUserId: string;
  id: string;
  title?: string;
  description?: string | null;
  content?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  categoryId?: string | null;
  compatibleModels?: string[];
  exampleInput?: string | null;
  exampleOutput?: string | null;
  metadata?: Record<string, any>;
  tags?: string[];
  files?: ResourceFileProps[];
}

export class UpdateResourceUseCase {
  constructor(
    private resourceRepository: IResourceRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(input: UpdateResourceInput): Promise<Resource> {
    // 1. Obtener recurso existente
    const resource = await this.resourceRepository.findById(input.id);
    if (!resource) {
      throw new ResourceNotFoundException(input.id);
    }

    // 2. Validar autorización: Solo el autor puede modificar el recurso
    if (resource.authorId !== input.authUserId) {
      throw new UnauthorizedResourceAccessException();
    }

    // 3. Validar categoría si cambia
    if (input.categoryId !== undefined && input.categoryId !== resource.categoryId) {
      if (input.categoryId !== null) {
        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category) {
          throw new CategoryNotFoundException(input.categoryId);
        }
      }
    }

    // 4. Si cambia el título y el recurso es un borrador (draft), actualizar slug
    let newSlug = resource.slug;
    if (input.title && input.title !== resource.title && resource.status === 'draft') {
      let baseSlug = Resource.generateSlug(input.title);
      if (!baseSlug) baseSlug = 'recurso-ia';
      
      newSlug = baseSlug;
      let suffix = 1;
      while (await this.resourceRepository.slugExists(newSlug)) {
        newSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }
    }

    // 5. Aplicar cambios a la entidad
    resource.update({
      title: input.title,
      description: input.description,
      content: input.content,
      type: input.type,
      status: input.status,
      categoryId: input.categoryId,
      compatibleModels: input.compatibleModels,
      exampleInput: input.exampleInput,
      exampleOutput: input.exampleOutput,
      metadata: input.metadata,
      tags: input.tags,
      files: input.files,
    });

    // Si el slug cambió, forzar su asignación en la entidad (haciendo uso de update con casting si es necesario, o actualizando la entidad)
    // En nuestro caso, la entidad tiene props privadas, pero podemos mutarla llamando a un método o pasando el slug en update
    // Let's modify the Resource.ts file if it doesn't allow changing slug. Wait, Resource.ts props is private. In ResourceProps we have slug.
    // In update method in Resource.ts we didn't specify slug. Let's see: we can update Resource.ts if we need to support updating the slug,
    // or we can allow passing slug to the update method.
    // Wait, let's see. Does update support slug? No, it has Partial<Pick<ResourceProps, 'title' ...>>. It doesn't include 'slug'.
    // Let's modify Resource.ts update to include slug. Wait, let's look at Resource.ts update method:
    // public update(props: Partial<Pick<ResourceProps, 'title' | ...>>) { ... }
    // Let's modify Resource.ts to allow updating slug. Or we can just leave it.
    // Wait! Let's update Resource.ts to include slug in update so we can change slug for drafts.
    // Actually, let's write UpdateResourceUseCase to call update. We can check if we want to change slug in Resource.ts.
    // Let's make a quick replacement in Resource.ts first, or just write UpdateResourceUseCase first and then adjust Resource.ts if needed.
    // Wait! Let's check:
    // In Resource.ts, line 56:
    // public update(props: Partial<Pick<ResourceProps, 'title' | 'description' | 'content' | 'type' | 'status' | 'categoryId' | 'compatibleModels' | 'exampleInput' | 'exampleOutput' | 'metadata' | 'tags' | 'files'>>)
    // We can change it to include 'slug' in Pick!
    // Yes! Let's do that. But first, let's write UpdateResourceUseCase to pass slug inside update:
    // resource.update({ ..., slug: newSlug }) if we update Resource.ts.
    // Yes, let's do both. Let's write UpdateResourceUseCase.ts.

    // Let's update resource
    const updatePayload: any = {
      title: input.title,
      description: input.description,
      content: input.content,
      type: input.type,
      status: input.status,
      categoryId: input.categoryId,
      compatibleModels: input.compatibleModels,
      exampleInput: input.exampleInput,
      exampleOutput: input.exampleOutput,
      metadata: input.metadata,
      tags: input.tags,
      files: input.files,
    };

    if (newSlug !== resource.slug) {
      updatePayload.slug = newSlug;
    }

    resource.update(updatePayload);

    // 6. Guardar en base de datos
    await this.resourceRepository.update(resource);

    return resource;
  }
}
