import { createClient } from '@/lib/supabase/server';
import { SupabaseLikeRepository } from '@/backend/infrastructure/supabase/SupabaseLikeRepository';
import { ToggleLikeUseCase } from '@/backend/application/use-cases/ToggleLikeUseCase';
import { CheckUserLikedUseCase } from '@/backend/application/use-cases/CheckUserLikedUseCase';
import { LikeController } from '@/backend/presentation/controllers/LikeController';

async function getController() {
  const supabase = await createClient();
  const likeRepo = new SupabaseLikeRepository(supabase);
  const toggleLikeUseCase = new ToggleLikeUseCase(likeRepo);
  const checkUserLikedUseCase = new CheckUserLikedUseCase(likeRepo);
  const controller = new LikeController(toggleLikeUseCase, checkUserLikedUseCase);
  
  const { data: { user } } = await supabase.auth.getUser();
  return { controller, user };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión para realizar esta acción.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }
  const { id } = await params;
  return controller.toggleLike(user.id, id);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: { liked: false },
      error: null,
      meta: { timestamp: new Date().toISOString() }
    }, { status: 200 });
  }
  const { id } = await params;
  return controller.checkLiked(user.id, id);
}
