'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ResourceCard from './ResourceCard';
import Navbar from '@/components/layout/Navbar';
import { Search, Sparkles, Image as ImageIcon, Video, Box, Layers, SlidersHorizontal, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';

interface Category {
  id: string;
  name: string;
  slug: string;
}

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
}

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [newCount, setNewCount] = useState(0);

  const [offset, setOffset] = useState(0);
  const limit = 12;
  const [allResources, setAllResources] = useState<Resource[]>([]);

  const { profile } = useAuthStore();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
    setNewCount(0);
  };

  // Resetear paginación al cambiar filtros
  useEffect(() => {
    setOffset(0);
    setAllResources([]);
  }, [search, selectedCategory, selectedType]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('explore-realtime-prompts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'resources' },
        (payload) => {
          // Si el prompt es público/published y no es del usuario actual
          if (
            payload.new &&
            payload.new.status === 'published' &&
            payload.new.author_id !== profile?.id
          ) {
            setNewCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Cargar categorías
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      const payload = await res.json();
      return payload.data || [];
    },
  });

  // Cargar recursos con filtros
  const { data: resourcesData, isLoading, isFetching } = useQuery<{ data: Resource[]; meta: { total: number } }>({
    queryKey: ['resources', search, selectedCategory, selectedType, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const res = await fetch(`/api/v1/resources?${params.toString()}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (resourcesData?.data) {
      if (offset === 0) {
        setAllResources(resourcesData.data);
      } else {
        setAllResources((prev) => {
          const existingIds = new Set(prev.map(r => r.id));
          const newItems = resourcesData.data.filter(r => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [resourcesData, offset]);

  const totalCount = resourcesData?.meta?.total || 0;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Cabecera / Buscador principal */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Explora Prompts de IA
          </h1>
          <p className="text-sm text-zinc-400">
            Descubre prompts probados de lenguaje, generación de imágenes, flujos de automatización y agentes construidos por la comunidad.
          </p>

          <div className="w-full relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, descripción o palabras clave..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl text-sm placeholder-zinc-550 outline-none transition-all shadow-xl backdrop-blur-md"
            />
          </div>
        </div>

        {/* Controles de Filtros */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Filtros Lateral (Escritorio) o superiores (Móvil) */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-zinc-900/10 border border-zinc-900 backdrop-blur-sm p-6 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Filtros</h2>
            </div>

            {/* Tipos */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300">Tipo de Recurso</h3>
              <div className="flex flex-col gap-1 text-sm">
                <button
                  onClick={() => setSelectedType('')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedType === '' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Todos</span>
                </button>
                <button
                  onClick={() => setSelectedType('prompt_llm')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedType === 'prompt_llm' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Prompts LLM</span>
                </button>
                <button
                  onClick={() => setSelectedType('prompt_image')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedType === 'prompt_image' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Imágenes</span>
                </button>
                <button
                  onClick={() => setSelectedType('prompt_video')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedType === 'prompt_video' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>Videos</span>
                </button>
                <button
                  onClick={() => setSelectedType('agent')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedType === 'agent' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Box className="h-4 w-4" />
                  <span>Agentes</span>
                </button>
                <button
                  onClick={() => setSelectedType('workflow')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedType === 'workflow' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Box className="h-4 w-4" />
                  <span>Workflows</span>
                </button>
              </div>
            </div>

            {/* Categorías */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300">Categorías</h3>
              <div className="flex flex-col gap-1 text-sm">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedCategory === '' ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  Todas las categorías
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-left transition-colors truncate cursor-pointer ${
                      selectedCategory === cat.id ? 'bg-purple-950/20 border border-purple-900/30 text-purple-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid de Resultados */}
          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
              <span>Mostrando {allResources.length} de {totalCount} prompts encontrados</span>
            </div>

            {newCount > 0 && (
              <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full text-xs font-semibold cursor-pointer shadow-lg shadow-purple-500/20 border border-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4 text-purple-200 animate-pulse" />
                  <span>Hay {newCount} {newCount === 1 ? 'nuevo prompt disponible' : 'nuevos prompts disponibles'}. Haz clic para actualizar.</span>
                </button>
              </div>
            )}

            {isLoading && offset === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-4 bg-zinc-800 rounded w-1/3" />
                      <div className="h-6 bg-zinc-800 rounded w-3/4" />
                      <div className="h-4 bg-zinc-800 rounded w-full" />
                      <div className="h-4 bg-zinc-800 rounded w-5/6" />
                    </div>
                    <div className="h-8 bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : allResources.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <span>Cargar más prompts</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-2xl">
                <p className="text-zinc-500 text-sm">No se encontraron prompts con los filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
