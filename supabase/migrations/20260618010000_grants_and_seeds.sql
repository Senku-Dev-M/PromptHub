-- 1. Conceder permisos de uso al esquema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Conceder permisos SELECT por defecto a anon y authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- 3. Conceder permisos de escritura (INSERT, UPDATE, DELETE) por defecto a authenticated
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- 4. Conceder permisos sobre secuencias por defecto
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- 5. Backfill de perfiles para usuarios de auth.users existentes antes del trigger
INSERT INTO public.profiles (id, username, display_name, avatar_url, is_verified)
SELECT 
    id, 
    coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1) || '_' || substr(id::text, 1, 4)),
    coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_url',
    false
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. Carga de datos de inicio (Seed Data) para Categorías
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
('Productividad', 'productividad', 'Prompts para aumentar la eficiencia y automatizar tareas cotidianas.', 'zap', 1),
('Desarrollo', 'desarrollo', 'Prompts para programación, depuración, refactorización y diseño de software.', 'code', 2),
('Marketing', 'marketing', 'Prompts para campañas, redactores creativos, SEO y redes sociales.', 'megaphone', 3),
('Diseño', 'diseno', 'Prompts para generación de imágenes (Midjourney, DALL-E) y modelado.', 'palette', 4),
('Redacción', 'redaccion', 'Prompts para redacción de artículos, corrección de estilo y traducción.', 'pen-tool', 5),
('Otros', 'otros', 'Otras categorías y utilidades diversas.', 'box', 6)
ON CONFLICT (slug) DO NOTHING;

-- 7. Crear el bucket de almacenamiento para imágenes y adjuntos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-attachments', 'resource-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Políticas de RLS para Storage (evitar error new row violates row-level security policy)
DROP POLICY IF EXISTS "Lectura pública de adjuntos" ON storage.objects;
CREATE POLICY "Lectura pública de adjuntos" ON storage.objects
    FOR SELECT USING (bucket_id = 'resource-attachments');

DROP POLICY IF EXISTS "Subida de adjuntos por usuarios autenticados" ON storage.objects;
CREATE POLICY "Subida de adjuntos por usuarios autenticados" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resource-attachments' 
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Eliminación de adjuntos" ON storage.objects;
CREATE POLICY "Eliminación de adjuntos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resource-attachments' 
        AND auth.role() = 'authenticated'
    );
