import { createClient } from '@/lib/supabase/server';
import { SupabaseFollowRepository } from '@/backend/infrastructure/supabase/SupabaseFollowRepository';
import { SupabaseProfileRepository } from '@/backend/infrastructure/supabase/SupabaseProfileRepository';
import { ToggleFollowUseCase } from '@/backend/application/use-cases/ToggleFollowUseCase';
import { FollowController } from '@/backend/presentation/controllers/FollowController';

async function getController() {
  const supabase = await createClient();
  const followRepo = new SupabaseFollowRepository(supabase);
  const profileRepo = new SupabaseProfileRepository(supabase);
  const toggleFollowUseCase = new ToggleFollowUseCase(followRepo);
  const controller = new FollowController(toggleFollowUseCase, profileRepo, followRepo);
  
  const { data: { user } } = await supabase.auth.getUser();
  return { controller, user };
}

export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión para realizar esta acción.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }
  const { username } = await params;
  return controller.toggleFollow(user.id, username);
}

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: { following: false },
      error: null,
      meta: { timestamp: new Date().toISOString() }
    }, { status: 200 });
  }
  const { username } = await params;
  return controller.checkFollowing(user.id, username);
}
