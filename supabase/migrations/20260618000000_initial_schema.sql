-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Crear tipos enumerados
CREATE TYPE resource_type AS ENUM ('prompt_llm', 'prompt_image', 'prompt_video', 'agent', 'workflow', 'other');
CREATE TYPE resource_status AS ENUM ('draft', 'published', 'archived', 'flagged');

-- 3. Crear tablas principales

-- Tabla: profiles (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Tabla: categories (organización principal)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tags (etiquetado libre)
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: resources (publicaciones de IA)
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- El prompt o las instrucciones estructuradas
    type resource_type NOT NULL,
    status resource_status DEFAULT 'draft',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    compatible_models TEXT[] DEFAULT '{}'::text[],
    example_input TEXT,
    example_output TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla relacional: resource_tags (M:N entre recursos y etiquetas)
CREATE TABLE public.resource_tags (
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, tag_id)
);

-- Tabla: resource_files (adjuntos del recurso: imágenes de muestra, jsons)
CREATE TABLE public.resource_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: collections (tableros públicos o privados creados por usuarios)
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    resources_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, slug)
);

-- Tabla relacional: collection_resources (M:N entre colecciones y recursos)
CREATE TABLE public.collection_resources (
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (collection_id, resource_id)
);

-- Tabla relacional: likes (me gusta de recursos)
CREATE TABLE public.likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_id)
);

-- Tabla relacional: saved_resources (guardados privados generales)
CREATE TABLE public.saved_resources (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_id)
);

-- Tabla: comments (comentarios en publicaciones)
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- Soporte para respuestas
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla relacional: follows (seguimientos entre usuarios)
CREATE TABLE public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id != following_id)
);

-- Tabla: resource_views (auditoría / analítica de visualizaciones)
CREATE TABLE public.resource_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Creación de Índices para optimización de consultas comunes

CREATE INDEX idx_resources_author ON public.resources(author_id);
CREATE INDEX idx_resources_category ON public.resources(category_id);
CREATE INDEX idx_resources_type_status ON public.resources(type, status);
CREATE INDEX idx_resources_status_published ON public.resources(status, published_at DESC);
CREATE INDEX idx_resources_compatible_models ON public.resources USING GIN (compatible_models);
CREATE INDEX idx_resources_search ON public.resources USING gin(to_tsvector('spanish', title || ' ' || coalesce(description, '') || ' ' || content));

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_likes_resource ON public.likes(resource_id);
CREATE INDEX idx_saved_resources_user ON public.saved_resources(user_id);
CREATE INDEX idx_comments_resource_created ON public.comments(resource_id, created_at);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_collection_resources_resource ON public.collection_resources(resource_id);
CREATE INDEX idx_resource_views_resource_date ON public.resource_views(resource_id, created_at);


-- 5. Triggers y Funciones de PostgreSQL

-- FUNCIÓN 5.1: Sincronizar perfiles de usuario desde auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username VARCHAR(30);
BEGIN
    -- Intentar extraer el username del email o metadata, o generar uno aleatorio
    new_username := coalesce(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    );

    -- Asegurar que el username tenga al menos 3 caracteres
    IF char_length(new_username) < 3 THEN
        new_username := new_username || '_user';
    END IF;

    -- Validar unicidad (si ya existe, agregar un sufijo aleatorio)
    WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
        new_username := new_username || substr(uuid_generate_v4()::text, 1, 3);
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, avatar_url, is_verified)
    VALUES (
        new.id,
        new_username,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- FUNCIÓN 5.2: Actualizar timestamp updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- FUNCIÓN 5.3: Triggers para mantener sincronizados los contadores desnormalizados de resources

-- A) likes_count
CREATE OR REPLACE FUNCTION public.handle_resource_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.resources SET likes_count = likes_count + 1 WHERE id = NEW.resource_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.resources SET likes_count = likes_count - 1 WHERE id = OLD.resource_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_inserted_deleted
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_resource_like_change();

-- B) saves_count
CREATE OR REPLACE FUNCTION public.handle_resource_save_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.resources SET saves_count = saves_count + 1 WHERE id = NEW.resource_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.resources SET saves_count = saves_count - 1 WHERE id = OLD.resource_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_save_inserted_deleted
    AFTER INSERT OR DELETE ON public.saved_resources
    FOR EACH ROW EXECUTE FUNCTION public.handle_resource_save_change();

-- C) comments_count
CREATE OR REPLACE FUNCTION public.handle_resource_comment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.resources SET comments_count = comments_count + 1 WHERE id = NEW.resource_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.resources SET comments_count = comments_count - 1 WHERE id = OLD.resource_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_inserted_deleted
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_resource_comment_change();


-- FUNCIÓN 5.4: Mantener contadores desnormalizados de collections (resources_count)
CREATE OR REPLACE FUNCTION public.handle_collection_resource_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.collections SET resources_count = resources_count + 1 WHERE id = NEW.collection_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.collections SET resources_count = resources_count - 1 WHERE id = OLD.collection_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collection_resource_inserted_deleted
    AFTER INSERT OR DELETE ON public.collection_resources
    FOR EACH ROW EXECUTE FUNCTION public.handle_collection_resource_change();


-- FUNCIÓN 5.5: Incrementar usage_count de tags cuando se asocian a recursos
CREATE OR REPLACE FUNCTION public.handle_resource_tag_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_resource_tag_inserted_deleted
    AFTER INSERT OR DELETE ON public.resource_tags
    FOR EACH ROW EXECUTE FUNCTION public.handle_resource_tag_change();


-- 6. Habilitar Row Level Security (RLS) en todas las tablas

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;


-- 7. Definición de Políticas de Row Level Security (RLS)

-- POLÍTICAS: profiles
CREATE POLICY "Perfiles legibles por cualquiera" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Modificación del propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS: categories (lectura libre, edición solo admin vía backend con service_role)
CREATE POLICY "Categorías legibles por cualquiera" ON public.categories
    FOR SELECT USING (true);

-- POLÍTICAS: tags (lectura libre, inserción libre por autenticados)
CREATE POLICY "Etiquetas legibles por cualquiera" ON public.tags
    FOR SELECT USING (true);

CREATE POLICY "Inserción de etiquetas por usuarios autenticados" ON public.tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- POLÍTICAS: resources
CREATE POLICY "Recursos publicados visibles por todos" ON public.resources
    FOR SELECT USING (status = 'published');

CREATE POLICY "Borradores visibles solo por el autor" ON public.resources
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Creación de recursos para usuarios autenticados" ON public.resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

CREATE POLICY "Edición y borrado solo por el autor" ON public.resources
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Eliminación solo por el autor" ON public.resources
    FOR DELETE USING (auth.uid() = author_id);

-- POLÍTICAS: resource_tags (M:N)
CREATE POLICY "Asociación de etiquetas visible por todos" ON public.resource_tags
    FOR SELECT USING (true);

CREATE POLICY "Asociar etiquetas a recurso propio" ON public.resource_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resources 
            WHERE id = resource_id AND author_id = auth.uid()
        )
    );

CREATE POLICY "Desasociar etiquetas de recurso propio" ON public.resource_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.resources 
            WHERE id = resource_id AND author_id = auth.uid()
        )
    );

-- POLÍTICAS: resource_files
CREATE POLICY "Archivos asociados visibles si el recurso está publicado o es propio" ON public.resource_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resources 
            WHERE id = resource_id AND (status = 'published' OR author_id = auth.uid())
        )
    );

CREATE POLICY "Añadir archivos a recurso propio" ON public.resource_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resources 
            WHERE id = resource_id AND author_id = auth.uid()
        )
    );

CREATE POLICY "Eliminar archivos de recurso propio" ON public.resource_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.resources 
            WHERE id = resource_id AND author_id = auth.uid()
        )
    );

-- POLÍTICAS: collections
CREATE POLICY "Colecciones públicas legibles por cualquiera" ON public.collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Colecciones privadas visibles por el dueño" ON public.collections
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Creación de colecciones para usuarios autenticados" ON public.collections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

CREATE POLICY "Edición y borrado por el dueño" ON public.collections
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Eliminación por el dueño" ON public.collections
    FOR DELETE USING (auth.uid() = owner_id);

-- POLÍTICAS: collection_resources
CREATE POLICY "Recursos de colección visibles según visibilidad de la colección" ON public.collection_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE id = collection_id AND (is_public = true OR owner_id = auth.uid())
        )
    );

CREATE POLICY "Agregar recursos a colección propia" ON public.collection_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE id = collection_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Eliminar recursos de colección propia" ON public.collection_resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE id = collection_id AND owner_id = auth.uid()
        )
    );

-- POLÍTICAS: likes
CREATE POLICY "Likes legibles por todos" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Crear likes para uno mismo" ON public.likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Eliminar likes propios" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: saved_resources
CREATE POLICY "Ver recursos guardados propios" ON public.saved_resources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Guardar recursos para uno mismo" ON public.saved_resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Eliminar recursos guardados propios" ON public.saved_resources
    FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: comments
CREATE POLICY "Comentarios legibles si el recurso está publicado" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resources 
            WHERE id = resource_id AND status = 'published'
        )
    );

CREATE POLICY "Comentar para usuarios autenticados" ON public.comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

CREATE POLICY "Editar comentario propio" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Borrar comentario propio" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- POLÍTICAS: follows
CREATE POLICY "Seguidores legibles por todos" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Seguir para usuarios autenticados" ON public.follows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);

CREATE POLICY "Dejar de seguir" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- POLÍTICAS: resource_views (solo inserción, analíticas internas)
CREATE POLICY "Crear registro de vista" ON public.resource_views
    FOR INSERT WITH CHECK (true);
