import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseProfileRepository } from '@/backend/infrastructure/supabase/SupabaseProfileRepository';
import { GetProfileUseCase } from '@/backend/application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '@/backend/application/use-cases/UpdateProfileUseCase';
import { ProfileController } from '@/backend/presentation/controllers/ProfileController';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  // 1. Await params in Next.js 16
  const { username } = await params;

  // 2. Instantiate Supabase server client
  const supabase = await createClient();

  // 3. Resolve dependencies (Manual Dependency Injection)
  const profileRepo = new SupabaseProfileRepository(supabase);
  const getProfileUseCase = new GetProfileUseCase(profileRepo);
  const updateProfileUseCase = new UpdateProfileUseCase(profileRepo);
  const controller = new ProfileController(getProfileUseCase, updateProfileUseCase);

  // 4. Delegate to controller
  return controller.getPublicProfile(username);
}
