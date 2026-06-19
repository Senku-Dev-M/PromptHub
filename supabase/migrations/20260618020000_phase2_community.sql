-- Migration: 20260618020000_phase2_community.sql

-- 1. Modificar tabla profiles para agregar seguidores/seguidos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 2. Crear tabla notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- El receptor de la notificación
    notifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Quién realiza la acción
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'system'
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE, -- Opcional, si aplica (like o comentario)
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- Opcional, si aplica (comentario)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para notifications
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden ver sus propias notificaciones" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden marcar como leídas sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden marcar como leídas sus propias notificaciones" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden crear sus propias notificaciones" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = notifier_id);

-- 3. Trigger para actualizar followers_count y following_count en public.profiles
CREATE OR REPLACE FUNCTION public.handle_user_follow_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Incrementar seguidos de follower_id
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        -- Incrementar seguidores de following_id
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrementar seguidos de follower_id
        UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        -- Decrementar seguidores de following_id
        UPDATE public.profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_inserted_deleted ON public.follows;
CREATE TRIGGER on_follow_inserted_deleted
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_follow_change();

-- 4. Triggers automáticos para notificaciones

-- A) Notificación por nuevo Like
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_author_id UUID;
BEGIN
    -- Obtener autor del recurso
    SELECT author_id INTO target_author_id FROM public.resources WHERE id = NEW.resource_id;
    
    -- Solo crear notificación si el que da like no es el autor del recurso
    IF (NEW.user_id != target_author_id) THEN
        INSERT INTO public.notifications (user_id, notifier_id, type, resource_id)
        VALUES (target_author_id, NEW.user_id, 'like', NEW.resource_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created_notify ON public.likes;
CREATE TRIGGER on_like_created_notify
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();

-- B) Notificación por nuevo Comentario
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_author_id UUID;
    parent_comment_author_id UUID;
    target_resource_id UUID;
BEGIN
    -- Obtener autor del recurso
    SELECT author_id INTO target_author_id FROM public.resources WHERE id = NEW.resource_id;

    -- Si es una respuesta a otro comentario
    IF (NEW.parent_id IS NOT NULL) THEN
        -- Obtener autor del comentario padre
        SELECT author_id INTO parent_comment_author_id FROM public.comments WHERE id = NEW.parent_id;
        
        -- Si el autor de la respuesta no es el autor del comentario padre, notificar al autor del comentario padre
        IF (NEW.author_id != parent_comment_author_id) THEN
            INSERT INTO public.notifications (user_id, notifier_id, type, resource_id, comment_id)
            VALUES (parent_comment_author_id, NEW.author_id, 'comment', NEW.resource_id, NEW.id);
        END IF;
    END IF;

    -- Notificar al autor del recurso (siempre que el comentario no lo haya hecho él mismo y que no haya sido ya notificado por respuesta)
    IF (NEW.author_id != target_author_id AND (NEW.parent_id IS NULL OR target_author_id != parent_comment_author_id)) THEN
        INSERT INTO public.notifications (user_id, notifier_id, type, resource_id, comment_id)
        VALUES (target_author_id, NEW.author_id, 'comment', NEW.resource_id, NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_notify ON public.comments;
CREATE TRIGGER on_comment_created_notify
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

-- C) Notificación por nuevo Follow
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar al usuario seguido (following_id) que follower_id le está siguiendo
    INSERT INTO public.notifications (user_id, notifier_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_created_notify ON public.follows;
CREATE TRIGGER on_follow_created_notify
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.create_follow_notification();

-- 5. Concesión de privilegios (GRANTS) para las tablas de la Fase 2
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.collection_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

GRANT SELECT ON public.likes TO anon;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.follows TO anon;
GRANT SELECT ON public.collections TO anon;
GRANT SELECT ON public.collection_resources TO anon;

