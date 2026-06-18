import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { IResourceRepository, FindManyFilters } from '../../domain/repositories/IResourceRepository';
import { Resource, ResourceType, ResourceStatus } from '../../domain/entities/Resource';

type ResourceRow = Database['public']['Tables']['resources']['Row'];

export class SupabaseResourceRepository implements IResourceRepository {
  constructor(private client: SupabaseClient<Database>) {}

  private async mapToDomain(row: any): Promise<Resource> {
    // Extraer tags
    const tags = row.resource_tags 
      ? row.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean)
      : [];

    // Extraer files
    const files = row.resource_files
      ? row.resource_files.map((rf: any) => ({
          id: rf.id,
          fileUrl: rf.file_url,
          fileType: rf.file_type,
          fileSize: rf.file_size,
          sortOrder: rf.sort_order,
        }))
      : [];

    return Resource.create({
      id: row.id,
      authorId: row.author_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      content: row.content,
      type: row.type as ResourceType,
      status: row.status as ResourceStatus,
      categoryId: row.category_id,
      compatibleModels: row.compatible_models || [],
      exampleInput: row.example_input,
      exampleOutput: row.example_output,
      metadata: row.metadata as Record<string, any>,
      viewsCount: row.views_count || 0,
      likesCount: row.likes_count || 0,
      savesCount: row.saves_count || 0,
      commentsCount: row.comments_count || 0,
      isFeatured: row.is_featured || false,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      tags,
      files,
    });
  }

  private async associateTags(resourceId: string, tags: string[]): Promise<void> {
    // 1. Eliminar relaciones anteriores
    await this.client
      .from('resource_tags')
      .delete()
      .eq('resource_id', resourceId);

    if (!tags || tags.length === 0) return;

    // 2. Insertar etiquetas en la tabla tags. Usamos upsert.
    const tagInserts = tags.map(name => {
      const cleanName = name.trim().toLowerCase();
      return {
        name: cleanName,
        slug: cleanName.replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      };
    });

    const { data: insertedTags, error: tagError } = await this.client
      .from('tags')
      .upsert(tagInserts, { onConflict: 'name' })
      .select('id, name');

    if (tagError) {
      throw new Error(`Error registrando etiquetas: ${tagError.message}`);
    }

    // 3. Crear nuevas relaciones en resource_tags
    if (insertedTags && insertedTags.length > 0) {
      const relationInserts = insertedTags.map(t => ({
        resource_id: resourceId,
        tag_id: t.id,
      }));

      const { error: relationError } = await this.client
        .from('resource_tags')
        .insert(relationInserts);

      if (relationError) {
        throw new Error(`Error asociando etiquetas al recurso: ${relationError.message}`);
      }
    }
  }

  private async associateFiles(resourceId: string, files: any[]): Promise<void> {
    // 1. Eliminar archivos anteriores
    await this.client
      .from('resource_files')
      .delete()
      .eq('resource_id', resourceId);

    if (!files || files.length === 0) return;

    // 2. Insertar archivos nuevos
    const fileInserts = files.map((f, idx) => ({
      resource_id: resourceId,
      file_url: f.fileUrl,
      file_type: f.fileType || null,
      file_size: f.fileSize || null,
      sort_order: f.sortOrder ?? idx,
    }));

    const { error: fileError } = await this.client
      .from('resource_files')
      .insert(fileInserts);

    if (fileError) {
      throw new Error(`Error registrando archivos de recurso: ${fileError.message}`);
    }
  }

  async findById(id: string): Promise<Resource | null> {
    const { data, error } = await this.client
      .from('resources')
      .select('*, resource_tags(tags(id, name)), resource_files(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findBySlug(slug: string): Promise<Resource | null> {
    const { data, error } = await this.client
      .from('resources')
      .select('*, resource_tags(tags(id, name)), resource_files(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async save(resource: Resource): Promise<void> {
    const { error } = await this.client
      .from('resources')
      .insert({
        id: resource.id,
        author_id: resource.authorId,
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        content: resource.content,
        type: resource.type,
        status: resource.status,
        category_id: resource.categoryId,
        compatible_models: resource.compatibleModels,
        example_input: resource.exampleInput,
        example_output: resource.exampleOutput,
        metadata: resource.metadata,
        is_featured: resource.isFeatured,
        published_at: resource.publishedAt?.toISOString() || null,
      });

    if (error) {
      throw new Error(`Error guardando recurso: ${error.message}`);
    }

    // Guardar tags y archivos asociados
    await this.associateTags(resource.id, resource.tags);
    await this.associateFiles(resource.id, resource.files);
  }

  async update(resource: Resource): Promise<void> {
    const { error } = await this.client
      .from('resources')
      .update({
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        content: resource.content,
        type: resource.type,
        status: resource.status,
        category_id: resource.categoryId,
        compatible_models: resource.compatibleModels,
        example_input: resource.exampleInput,
        example_output: resource.exampleOutput,
        metadata: resource.metadata,
        is_featured: resource.isFeatured,
        published_at: resource.publishedAt?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resource.id);

    if (error) {
      throw new Error(`Error actualizando recurso: ${error.message}`);
    }

    // Actualizar tags y archivos asociados
    await this.associateTags(resource.id, resource.tags);
    await this.associateFiles(resource.id, resource.files);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error eliminando recurso: ${error.message}`);
    }
  }

  async slugExists(slug: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('resources')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async findMany(filters: FindManyFilters): Promise<{ resources: Resource[]; total: number }> {
    let query = this.client
      .from('resources')
      .select('*, resource_tags(tags(id, name)), resource_files(*)', { count: 'exact' });

    // Aplicar filtros
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.type) {
      query = query.eq('type', filters.type as any);
    }
    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }
    if (filters.authorIds && filters.authorIds.length > 0) {
      query = query.in('author_id', filters.authorIds);
    }
    if (filters.status) {
      query = query.eq('status', filters.status as any);
    } else {
      // Por defecto mostrar solo publicados si no se especifica el autor
      if (!filters.authorId) {
        query = query.eq('status', 'published' as any);
      }
    }

    if (filters.search) {
      const term = `%${filters.search}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},content.ilike.${term}`);
    }

    // Paginación y orden
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    query = query
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error || !data) {
      return { resources: [], total: 0 };
    }

    const resources = await Promise.all(data.map(row => this.mapToDomain(row)));
    return { resources, total: count || 0 };
  }
}
