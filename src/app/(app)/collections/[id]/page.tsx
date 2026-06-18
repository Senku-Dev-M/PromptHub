import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/layout/Navbar';
import ResourceCard from '@/features/resources/components/ResourceCard';
import { Folder, Lock, Globe, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id: collectionId } = await params;
  const supabase = await createClient();

  // 1. Obtener la colección
  const { data: collection, error: colError } = await supabase
    .from('collections')
    .select('*, profiles:owner_id(username, display_name)')
    .eq('id', collectionId)
    .maybeSingle();

  if (colError || !collection) {
    return notFound();
  }

  // 2. Comprobar permisos (Privada vs Pública)
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user !== null && user.id === collection.owner_id;

  if (!collection.is_public && !isOwner) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
            <Lock className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Colección Privada</h1>
          <p className="text-sm text-zinc-400">
            No tienes permisos para ver esta colección de prompts.
          </p>
          <Link href="/explore" className="text-xs text-purple-400 hover:underline">
            Volver a explorar
          </Link>
        </main>
      </div>
    );
  }

  // 3. Obtener recursos asociados a la colección
  const { data: assocData, error: assocError } = await supabase
    .from('collection_resources')
    .select('resource_id, resources(*, resource_tags(tags(id, name)), resource_files(*))')
    .eq('collection_id', collectionId);

  const rawResources = assocError || !assocData
    ? []
    : assocData.map((row: any) => row.resources).filter(Boolean);

  // Mapear al formato esperado por ResourceCard
  const resources = rawResources.map((res: any) => {
    const tags = res.resource_tags 
      ? res.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean)
      : [];

    return {
      id: res.id,
      title: res.title,
      slug: res.slug,
      description: res.description,
      type: res.type,
      status: res.status,
      compatibleModels: res.compatible_models || [],
      viewsCount: res.views_count || 0,
      likesCount: res.likes_count || 0,
      savesCount: res.saves_count || 0,
      commentsCount: res.comments_count || 0,
      tags,
      createdAt: res.created_at,
    };
  });

  const formattedDate = collection.created_at
    ? new Date(collection.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Migas de pan */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium border-b border-zinc-900 pb-4">
          <Link href="/explore" className="hover:text-zinc-350 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Explorar</span>
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400">Colecciones</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 truncate max-w-[200px]">{collection.name}</span>
        </div>

        {/* Info Colección */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-2xl flex-shrink-0">
              <Folder className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {collection.name}
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full text-xs font-semibold">
                  {collection.is_public ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Pública
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Privada
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Creada por{' '}
                <Link href={`/u/${collection.profiles?.username}`} className="text-purple-400 hover:underline font-medium">
                  {collection.profiles?.display_name || `@${collection.profiles?.username}`}
                </Link>{' '}
                el {formattedDate}
              </p>
            </div>
          </div>

          {collection.description && (
            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>

        {/* Grid Prompts */}
        <div className="space-y-6 pt-4">
          <h2 className="text-lg font-bold text-white">
            Prompts en esta colección ({resources.length})
          </h2>

          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-6 space-y-3">
              <Folder className="h-10 w-10 text-zinc-650" />
              <h3 className="text-base font-bold text-zinc-300">Colección vacía</h3>
              <p className="text-xs text-zinc-550 max-w-xs">
                Aún no has añadido ningún prompt a esta colección.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
