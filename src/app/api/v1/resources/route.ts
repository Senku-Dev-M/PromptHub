import { createClient } from '@/lib/supabase/server';
import { SupabaseResourceRepository } from '@/backend/infrastructure/supabase/SupabaseResourceRepository';
import { SupabaseCategoryRepository } from '@/backend/infrastructure/supabase/SupabaseCategoryRepository';
import { CreateResourceUseCase } from '@/backend/application/use-cases/CreateResourceUseCase';
import { GetResourceUseCase } from '@/backend/application/use-cases/GetResourceUseCase';
import { UpdateResourceUseCase } from '@/backend/application/use-cases/UpdateResourceUseCase';
import { DeleteResourceUseCase } from '@/backend/application/use-cases/DeleteResourceUseCase';
import { ListResourcesUseCase } from '@/backend/application/use-cases/ListResourcesUseCase';
import { ResourceController } from '@/backend/presentation/controllers/ResourceController';

async function getController() {
  const supabase = await createClient();
  const resourceRepo = new SupabaseResourceRepository(supabase);
  const categoryRepo = new SupabaseCategoryRepository(supabase);

  const createResourceUseCase = new CreateResourceUseCase(resourceRepo, categoryRepo);
  const getResourceUseCase = new GetResourceUseCase(resourceRepo);
  const updateResourceUseCase = new UpdateResourceUseCase(resourceRepo, categoryRepo);
  const deleteResourceUseCase = new DeleteResourceUseCase(resourceRepo);
  const listResourcesUseCase = new ListResourcesUseCase(resourceRepo);

  const controller = new ResourceController(
    createResourceUseCase,
    getResourceUseCase,
    updateResourceUseCase,
    deleteResourceUseCase,
    listResourcesUseCase
  );

  return { controller, supabase };
}

export async function GET(request: Request) {
  const { controller } = await getController();
  return controller.list(request);
}

export async function POST(request: Request) {
  const { controller, supabase } = await getController();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Debe iniciar sesión para realizar esta acción.',
      },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }

  return controller.create(user.id, request);
}
