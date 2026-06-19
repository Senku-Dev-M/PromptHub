'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import ResourceCard from '@/features/resources/components/ResourceCard';
import Navbar from '@/components/layout/Navbar';
import { Sparkles, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Resource {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: 'prompt_llm' | 'prompt_image' | 'prompt_video' | 'agent' | 'workflow' | 'other';
  status: 'draft' | 'published' | 'archived' | 'flagged';
  compatibleModels: string[];
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  tags: string[];
  createdAt: string;
  exampleOutput?: string | null;
  files?: Array<{
    id?: string;
    fileUrl: string;
    fileType?: string | null;
    fileSize?: number | null;
  }> | null;
}

export default function FeedPage() {
  const { session } = useAuthStore();
  const [newCount, setNewCount] = useState(0);
  const queryClient = useQueryClient();

  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [allResources, setAllResources] = useState<Resource[]>([]);

  const handleRefresh = () => {
    setOffset(0);
    setAllResources([]);
    queryClient.invalidateQueries({ queryKey: ['personalized-feed'] });
    setNewCount(0);
  };

  useEffect(() => {
    if (!session) return;
    const supabase = createClient();

    const channel = supabase
      .channel('feed-realtime-prompts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'resources' },
        async (payload) => {
          if (
            payload.new &&
            payload.new.status === 'published' &&
            payload.new.author_id !== session.user.id
          ) {
            // Verificar si el usuario autenticado sigue al autor
            const { data } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', session.user.id)
              .eq('following_id', payload.new.author_id)
              .maybeSingle();

            if (data) {
              setNewCount((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const { data: feedData, isLoading, isFetching } = useQuery<{ data: Resource[]; meta: { total: number } }>({
    queryKey: ['personalized-feed', offset],
    queryFn: async () => {
      const res = await fetch(`/api/v1/resources/feed?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error('Error al cargar feed.');
      return res.json();
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (feedData?.data) {
      if (offset === 0) {
        setAllResources(feedData.data);
      } else {
        setAllResources((prev) => {
          const existingIds = new Set(prev.map(r => r.id));
          const newItems = feedData.data.filter(r => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [feedData, offset]);

  const totalCount = feedData?.meta?.total || 0;

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center space-y-6">
          <div className="p-4 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-full">
            <Users className="h-10 w-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Tu Feed Personalizado</h1>
            <p className="text-sm text-zinc-400">
              Inicia sesión para ver las publicaciones de los ingenieros de prompts y creadores que sigues en tiempo real.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Iniciar Sesión
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-purple-500" />
              <span>Mi Feed</span>
            </h1>
            <p className="text-xs text-zinc-500">
              Prompts y flujos compartidos por las personas que sigues.
            </p>
          </div>
          <div className="text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-850 px-3 py-1.5 rounded-xl">
            Sigues a creadores activos
          </div>
        </div>

        {/* Banner Realtime */}
        {newCount > 0 && (
          <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full text-xs font-semibold cursor-pointer shadow-lg shadow-purple-500/20 border border-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 text-purple-200 animate-pulse" />
              <span>Nuevas publicaciones disponibles de creadores que sigues. Haz clic para actualizar.</span>
            </button>
          </div>
        )}

        {/* Listado */}
        {isLoading && offset === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-6 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-full" />
                </div>
                <div className="h-8 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : allResources.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allResources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>

            {/* Botón de Cargar más */}
            {allResources.length < totalCount && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => setOffset((prev) => prev + limit)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <span>Cargar más publicaciones</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-6 space-y-4 max-w-xl mx-auto">
            <Sparkles className="h-10 w-10 text-zinc-650" />
            <h3 className="text-base font-bold text-zinc-300">Tu feed está vacío</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Comienza a seguir a creadores y expertos en la pestaña de exploración para personalizar tu feed.
            </p>
            <Link
              href="/explore"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition-all cursor-pointer"
            >
              Explorar Creadores
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
