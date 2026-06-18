import { createClient } from '@/lib/supabase/server';
import { SupabaseCollectionRepository } from '@/backend/infrastructure/supabase/SupabaseCollectionRepository';
import { CreateCollectionUseCase } from '@/backend/application/use-cases/CreateCollectionUseCase';
import { ListCollectionsByUserUseCase } from '@/backend/application/use-cases/ListCollectionsByUserUseCase';
import { AddResourceToCollectionUseCase } from '@/backend/application/use-cases/AddResourceToCollectionUseCase';
import { RemoveResourceFromCollectionUseCase } from '@/backend/application/use-cases/RemoveResourceFromCollectionUseCase';
import { CollectionController } from '@/backend/presentation/controllers/CollectionController';

async function getController() {
  const supabase = await createClient();
  const collectionRepo = new SupabaseCollectionRepository(supabase);
  const createCollectionUseCase = new CreateCollectionUseCase(collectionRepo);
  const listCollectionsByUserUseCase = new ListCollectionsByUserUseCase(collectionRepo);
  const addResourceToCollectionUseCase = new AddResourceToCollectionUseCase(collectionRepo);
  const removeResourceFromCollectionUseCase = new RemoveResourceFromCollectionUseCase(collectionRepo);
  
  const controller = new CollectionController(
    createCollectionUseCase,
    listCollectionsByUserUseCase,
    addResourceToCollectionUseCase,
    removeResourceFromCollectionUseCase
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return { controller, user };
}

export async function GET(request: Request) {
  const { controller, user } = await getController();
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || user?.id;
  
  if (!userId) {
    return Response.json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'Debe especificar el userId o iniciar sesión.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 400 });
  }
  
  return controller.listCollections(userId);
}

export async function POST(request: Request) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión para realizar esta acción.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }
  const body = await request.json();
  return controller.createCollection(user.id, body);
}
