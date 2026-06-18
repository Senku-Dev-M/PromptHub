import { createClient } from '@/lib/supabase/server';
import { SupabaseResourceRepository } from '@/backend/infrastructure/supabase/SupabaseResourceRepository';
import { SupabaseFollowRepository } from '@/backend/infrastructure/supabase/SupabaseFollowRepository';
import { GetPersonalizedFeedUseCase } from '@/backend/application/use-cases/GetPersonalizedFeedUseCase';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión para ver su feed personalizado.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }

  try {
    const resourceRepo = new SupabaseResourceRepository(supabase);
    const followRepo = new SupabaseFollowRepository(supabase);
    const getFeedUseCase = new GetPersonalizedFeedUseCase(resourceRepo, followRepo);

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit')) || 20;
    const offset = Number(url.searchParams.get('offset')) || 0;

    const result = await getFeedUseCase.execute({
      userId: user.id,
      limit,
      offset,
    });

    return Response.json({
      data: result.resources.map(res => ({
        id: res.id,
        authorId: res.authorId,
        title: res.title,
        slug: res.slug,
        description: res.description,
        content: res.content,
        type: res.type,
        status: res.status,
        categoryId: res.categoryId,
        compatibleModels: res.compatibleModels,
        viewsCount: res.viewsCount,
        likesCount: res.likesCount,
        savesCount: res.savesCount,
        commentsCount: res.commentsCount,
        createdAt: res.createdAt,
        tags: res.tags,
      })),
      error: null,
      meta: {
        total: result.total,
        timestamp: new Date().toISOString(),
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Feed API Error:', error);
    return Response.json({
      data: null,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al obtener el feed.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 500 });
  }
}
