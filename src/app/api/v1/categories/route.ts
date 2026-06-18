import { createClient } from '@/lib/supabase/server';
import { SupabaseCategoryRepository } from '@/backend/infrastructure/supabase/SupabaseCategoryRepository';
import { ListCategoriesUseCase } from '@/backend/application/use-cases/ListCategoriesUseCase';
import { CategoryController } from '@/backend/presentation/controllers/CategoryController';

async function getController() {
  const supabase = await createClient();
  const categoryRepo = new SupabaseCategoryRepository(supabase);
  const listCategoriesUseCase = new ListCategoriesUseCase(categoryRepo);
  const controller = new CategoryController(listCategoriesUseCase);
  return { controller };
}

export async function GET() {
  const { controller } = await getController();
  return controller.listAll();
}
