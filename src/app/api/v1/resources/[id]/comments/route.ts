import { createClient } from '@/lib/supabase/server';
import { SupabaseCommentRepository } from '@/backend/infrastructure/supabase/SupabaseCommentRepository';
import { AddCommentUseCase } from '@/backend/application/use-cases/AddCommentUseCase';
import { DeleteCommentUseCase } from '@/backend/application/use-cases/DeleteCommentUseCase';
import { ListCommentsByResourceUseCase } from '@/backend/application/use-cases/ListCommentsByResourceUseCase';
import { CommentController } from '@/backend/presentation/controllers/CommentController';

async function getController() {
  const supabase = await createClient();
  const commentRepo = new SupabaseCommentRepository(supabase);
  const addCommentUseCase = new AddCommentUseCase(commentRepo);
  const deleteCommentUseCase = new DeleteCommentUseCase(commentRepo);
  const listCommentsByResourceUseCase = new ListCommentsByResourceUseCase(commentRepo);
  const controller = new CommentController(addCommentUseCase, deleteCommentUseCase, listCommentsByResourceUseCase);
  
  const { data: { user } } = await supabase.auth.getUser();
  return { controller, user };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { controller } = await getController();
  const { id } = await params;
  return controller.listComments(id);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión para comentar.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  return controller.addComment(user.id, id, body);
}
