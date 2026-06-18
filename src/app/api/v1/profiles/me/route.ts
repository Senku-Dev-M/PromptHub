import { createClient } from '@/lib/supabase/server';
import { SupabaseProfileRepository } from '@/backend/infrastructure/supabase/SupabaseProfileRepository';
import { GetProfileUseCase } from '@/backend/application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '@/backend/application/use-cases/UpdateProfileUseCase';
import { ProfileController } from '@/backend/presentation/controllers/ProfileController';

async function getController() {
  const supabase = await createClient();
  const profileRepo = new SupabaseProfileRepository(supabase);
  const getProfileUseCase = new GetProfileUseCase(profileRepo);
  const updateProfileUseCase = new UpdateProfileUseCase(profileRepo);
  return {
    controller: new ProfileController(getProfileUseCase, updateProfileUseCase),
    supabase,
  };
}

function handleUnauthorized() {
  return Response.json({
    data: null,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Debe iniciar sesión para realizar esta acción.',
    },
    meta: { timestamp: new Date().toISOString() }
  }, { status: 401 });
}

export async function GET(request: Request) {
  const { controller, supabase } = await getController();

  // 1. Autenticar usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return handleUnauthorized();
  }

  // 2. Obtener perfil propio
  return controller.getMyProfile(user.id);
}

export async function PATCH(request: Request) {
  const { controller, supabase } = await getController();

  // 1. Autenticar usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return handleUnauthorized();
  }

  // 2. Actualizar perfil propio
  return controller.updateProfile(user.id, request);
}
