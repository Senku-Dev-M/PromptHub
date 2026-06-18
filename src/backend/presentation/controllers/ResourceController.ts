import { z } from 'zod';
import { CreateResourceUseCase } from '../../application/use-cases/CreateResourceUseCase';
import { GetResourceUseCase } from '../../application/use-cases/GetResourceUseCase';
import { UpdateResourceUseCase } from '../../application/use-cases/UpdateResourceUseCase';
import { DeleteResourceUseCase } from '../../application/use-cases/DeleteResourceUseCase';
import { ListResourcesUseCase } from '../../application/use-cases/ListResourcesUseCase';
import { 
  DomainException, 
  ResourceNotFoundException, 
  UnauthorizedResourceAccessException,
  CategoryNotFoundException 
} from '../../domain/exceptions/ResourceExceptions';

const resourceTypeSchema = z.enum(['prompt_llm', 'prompt_image', 'prompt_video', 'agent', 'workflow', 'other']);
const resourceStatusSchema = z.enum(['draft', 'published', 'archived', 'flagged']);

const fileSchema = z.object({
  fileUrl: z.string().url({ message: 'URL del archivo no válida.' }),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  sortOrder: z.number().optional(),
});

const createResourceSchema = z.object({
  title: z.string().min(5, { message: 'El título debe tener al menos 5 caracteres.' }).max(200),
  description: z.string().max(1000).nullable().optional(),
  content: z.string().min(10, { message: 'El contenido debe tener al menos 10 caracteres.' }),
  type: resourceTypeSchema,
  status: resourceStatusSchema.default('draft'),
  categoryId: z.string().uuid({ message: 'ID de categoría no válido.' }).nullable().optional(),
  compatibleModels: z.array(z.string()).optional(),
  exampleInput: z.string().nullable().optional(),
  exampleOutput: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string().max(50)).max(5, { message: 'No puede agregar más de 5 etiquetas.' }).optional(),
  files: z.array(fileSchema).optional(),
});

const updateResourceSchema = createResourceSchema.partial();

export class ResourceController {
  constructor(
    private createResourceUseCase: CreateResourceUseCase,
    private getResourceUseCase: GetResourceUseCase,
    private updateResourceUseCase: UpdateResourceUseCase,
    private deleteResourceUseCase: DeleteResourceUseCase,
    private listResourcesUseCase: ListResourcesUseCase
  ) {}

  private mapDomainToResponse(resource: any) {
    return {
      id: resource.id,
      authorId: resource.authorId,
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      content: resource.content,
      type: resource.type,
      status: resource.status,
      categoryId: resource.categoryId,
      compatibleModels: resource.compatibleModels,
      exampleInput: resource.exampleInput,
      exampleOutput: resource.exampleOutput,
      metadata: resource.metadata,
      viewsCount: resource.viewsCount,
      likesCount: resource.likesCount,
      savesCount: resource.savesCount,
      commentsCount: resource.commentsCount,
      isFeatured: resource.isFeatured,
      publishedAt: resource.publishedAt,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      tags: resource.tags,
      files: resource.files,
    };
  }

  private handleError(error: any): Response {
    console.error('Resource API Error:', error);

    let status = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Ocurrió un error inesperado en el servidor.';
    let details: any = null;

    if (error instanceof z.ZodError) {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = 'Los datos enviados no son válidos.';
      details = error.issues.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
    } else if (error instanceof ResourceNotFoundException) {
      status = 404;
      code = 'RESOURCE_NOT_FOUND';
      message = error.message;
    } else if (error instanceof CategoryNotFoundException) {
      status = 400;
      code = 'CATEGORY_NOT_FOUND';
      message = error.message;
    } else if (error instanceof UnauthorizedResourceAccessException) {
      status = 403;
      code = 'UNAUTHORIZED_ACCESS';
      message = error.message;
    } else if (error instanceof DomainException) {
      status = 400;
      code = 'DOMAIN_ERROR';
      message = error.message;
    } else if (error instanceof Error) {
      status = 400;
      code = 'BAD_REQUEST';
      message = error.message;
    }

    return Response.json({
      data: null,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString() }
    }, { status });
  }

  async create(userId: string, req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const validated = createResourceSchema.parse(body);

      const resource = await this.createResourceUseCase.execute({
        ...validated,
        authorId: userId,
      });

      return Response.json({
        data: this.mapDomainToResponse(resource),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getDetail(idOrSlug: string): Promise<Response> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const resource = await this.getResourceUseCase.execute(
        isUuid ? { id: idOrSlug } : { slug: idOrSlug }
      );

      return Response.json({
        data: this.mapDomainToResponse(resource),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(userId: string, resourceId: string, req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const validated = updateResourceSchema.parse(body);

      const resource = await this.updateResourceUseCase.execute({
        ...validated,
        id: resourceId,
        authUserId: userId,
      });

      return Response.json({
        data: this.mapDomainToResponse(resource),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(userId: string, resourceId: string): Promise<Response> {
    try {
      await this.deleteResourceUseCase.execute({
        id: resourceId,
        authUserId: userId,
      });

      return Response.json({
        data: { success: true },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async list(req: Request): Promise<Response> {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || undefined;
      const categoryId = searchParams.get('categoryId') || undefined;
      const type = searchParams.get('type') || undefined;
      const authorId = searchParams.get('authorId') || undefined;
      const status = searchParams.get('status') || undefined;
      
      const limitStr = searchParams.get('limit');
      const offsetStr = searchParams.get('offset');
      const limit = limitStr ? parseInt(limitStr, 10) : undefined;
      const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

      const { resources, total } = await this.listResourcesUseCase.execute({
        search,
        categoryId,
        type,
        authorId,
        status,
        limit,
        offset,
      });

      return Response.json({
        data: resources.map(r => this.mapDomainToResponse(r)),
        error: null,
        meta: { 
          total,
          limit: limit ?? 20,
          offset: offset ?? 0,
          timestamp: new Date().toISOString() 
        }
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
