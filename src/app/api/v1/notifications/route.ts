import { createClient } from '@/lib/supabase/server';
import { SupabaseNotificationRepository } from '@/backend/infrastructure/supabase/SupabaseNotificationRepository';
import { ListNotificationsUseCase } from '@/backend/application/use-cases/ListNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '@/backend/application/use-cases/MarkNotificationAsReadUseCase';
import { NotificationController } from '@/backend/presentation/controllers/NotificationController';

async function getController() {
  const supabase = await createClient();
  const notificationRepo = new SupabaseNotificationRepository(supabase);
  const listNotificationsUseCase = new ListNotificationsUseCase(notificationRepo);
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationRepo);
  const controller = new NotificationController(listNotificationsUseCase, markNotificationAsReadUseCase);
  
  const { data: { user } } = await supabase.auth.getUser();
  return { controller, user };
}

export async function GET() {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: [],
      error: null,
      meta: { timestamp: new Date().toISOString() }
    }, { status: 200 });
  }
  return controller.listNotifications(user.id);
}

export async function PATCH(request: Request) {
  const { controller, user } = await getController();
  if (!user) {
    return Response.json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión para realizar esta acción.' },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  return controller.markAsRead(user.id, id);
}
