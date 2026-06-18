import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Collection } from '../../domain/entities/Collection';
import { ICollectionRepository } from '../../domain/repositories/ICollectionRepository';

export class SupabaseCollectionRepository implements ICollectionRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Collection | null> {
    const { data, error } = await this.client
      .from('collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findBySlug(ownerId: string, slug: string): Promise<Collection | null> {
    const { data, error } = await this.client
      .from('collections')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async save(collection: Collection): Promise<void> {
    const { error } = await this.client
      .from('collections')
      .insert({
        id: collection.id,
        owner_id: collection.ownerId,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        cover_image_url: collection.coverImageUrl,
        is_public: collection.isPublic,
        resources_count: collection.resourcesCount,
        created_at: collection.createdAt.toISOString(),
        updated_at: collection.updatedAt.toISOString(),
      });

    if (error) {
      throw new Error(`Error al guardar la colección: ${error.message}`);
    }
  }

  async update(collection: Collection): Promise<void> {
    const { error } = await this.client
      .from('collections')
      .update({
        name: collection.name,
        description: collection.description,
        cover_image_url: collection.coverImageUrl,
        is_public: collection.isPublic,
        updated_at: collection.updatedAt.toISOString(),
      })
      .eq('id', collection.id);

    if (error) {
      throw new Error(`Error al actualizar la colección: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar la colección: ${error.message}`);
    }
  }

  async findByUser(userId: string): Promise<Collection[]> {
    const { data, error } = await this.client
      .from('collections')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.mapToDomain(row));
  }

  async addResource(collectionId: string, resourceId: string): Promise<void> {
    const { error } = await this.client
      .from('collection_resources')
      .insert({
        collection_id: collectionId,
        resource_id: resourceId,
      });

    if (error) {
      throw new Error(`Error al añadir recurso a la colección: ${error.message}`);
    }
  }

  async removeResource(collectionId: string, resourceId: string): Promise<void> {
    const { error } = await this.client
      .from('collection_resources')
      .delete()
      .eq('collection_id', collectionId)
      .eq('resource_id', resourceId);

    if (error) {
      throw new Error(`Error al eliminar recurso de la colección: ${error.message}`);
    }
  }

  async hasResource(collectionId: string, resourceId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('collection_resources')
      .select('collection_id')
      .eq('collection_id', collectionId)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  private mapToDomain(row: any): Collection {
    return Collection.create({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      isPublic: row.is_public,
      resourcesCount: row.resources_count,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }
}
