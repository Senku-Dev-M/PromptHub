import { z } from 'zod';
import { CreateCollectionUseCase } from '../../application/use-cases/CreateCollectionUseCase';
import { ListCollectionsByUserUseCase } from '../../application/use-cases/ListCollectionsByUserUseCase';
import { AddResourceToCollectionUseCase } from '../../application/use-cases/AddResourceToCollectionUseCase';
import { RemoveResourceFromCollectionUseCase } from '../../application/use-cases/RemoveResourceFromCollectionUseCase';

const createCollectionSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }).max(100),
  description: z.string().max(500).nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  isPublic: z.boolean().optional(),
});

export class CollectionController {
  constructor(
    private createCollectionUseCase: CreateCollectionUseCase,
    private listCollectionsByUserUseCase: ListCollectionsByUserUseCase,
    private addResourceToCollectionUseCase: AddResourceToCollectionUseCase,
    private removeResourceFromCollectionUseCase: RemoveResourceFromCollectionUseCase
  ) {}

  async createCollection(ownerId: string, body: any): Promise<Response> {
    try {
      const parsed = createCollectionSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: parsed.error.issues[0]?.message || 'Datos inválidos.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      const collection = await this.createCollectionUseCase.execute({
        ownerId,
        name: parsed.data.name,
        description: parsed.data.description,
        coverImageUrl: parsed.data.coverImageUrl,
        isPublic: parsed.data.isPublic,
      });

      return Response.json({
        data: {
          id: collection.id,
          ownerId: collection.ownerId,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          coverImageUrl: collection.coverImageUrl,
          isPublic: collection.isPublic,
          resourcesCount: collection.resourcesCount,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 201 });
    } catch (error: any) {
      console.error('Create Collection API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al crear la colección.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async listCollections(userId: string): Promise<Response> {
    try {
      const collections = await this.listCollectionsByUserUseCase.execute(userId);
      return Response.json({
        data: collections.map(col => ({
          id: col.id,
          ownerId: col.ownerId,
          name: col.name,
          slug: col.slug,
          description: col.description,
          coverImageUrl: col.coverImageUrl,
          isPublic: col.isPublic,
          resourcesCount: col.resourcesCount,
          createdAt: col.createdAt,
          updatedAt: col.updatedAt,
        })),
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('List Collections API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al listar las colecciones.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async addResource(ownerId: string, collectionId: string, resourceId: string): Promise<Response> {
    try {
      if (!collectionId || !resourceId) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'El ID de colección y de recurso son obligatorios.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      await this.addResourceToCollectionUseCase.execute(ownerId, collectionId, resourceId);
      return Response.json({
        data: { success: true },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Add Resource to Collection API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al añadir recurso a la colección.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }

  async removeResource(ownerId: string, collectionId: string, resourceId: string): Promise<Response> {
    try {
      if (!collectionId || !resourceId) {
        return Response.json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'El ID de colección y de recurso son obligatorios.' },
          meta: { timestamp: new Date().toISOString() }
        }, { status: 400 });
      }

      await this.removeResourceFromCollectionUseCase.execute(ownerId, collectionId, resourceId);
      return Response.json({
        data: { success: true },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Remove Resource from Collection API Error:', error);
      return Response.json({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al eliminar recurso de la colección.' },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }
}
