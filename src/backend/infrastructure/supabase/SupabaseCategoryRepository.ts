import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { ICategoryRepository, CategoryDTO } from '../../domain/repositories/ICategoryRepository';

export class SupabaseCategoryRepository implements ICategoryRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async listAll(): Promise<CategoryDTO[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('id, name, slug, description, icon')
      .order('sort_order', { ascending: true });

    if (error || !data) return [];
    return data;
  }

  async findById(id: string): Promise<CategoryDTO | null> {
    const { data, error } = await this.client
      .from('categories')
      .select('id, name, slug, description, icon')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  }
}
