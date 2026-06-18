'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import ResourceCard from '@/features/resources/components/ResourceCard';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Heart } from 'lucide-react';

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

export default function LandingPage() {
  // Cargar algunos recursos recientes destacados
  const { data: resourcesData, isLoading } = useQuery<{ data: Resource[] }>({
    queryKey: ['featuredResources'],
    queryFn: async () => {
      const res = await fetch('/api/v1/resources?limit=3');
      return res.json();
    },
  });

  const featured = resourcesData?.data || [];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden relative">
      {/* Luces decorativas ambientales de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/20 border border-purple-900/30 rounded-full text-xs text-purple-400 font-semibold mb-2 animate-bounce">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Fase 1 MVP ya disponible</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent max-w-4xl mx-auto leading-none">
          El Hub de Prompts de IA de Próxima Generación
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Encuentra, comparte y optimiza prompts para ChatGPT, Midjourney, Claude y más. Únete a creadores que impulsan los límites del diseño y la ingeniería de prompts.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
          <Link
            href="/explore"
            className="group flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-550 hover:to-indigo-550 text-white rounded-xl font-semibold text-sm shadow-xl shadow-purple-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto text-center justify-center cursor-pointer"
          >
            <span>Explorar Prompts</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto text-center justify-center cursor-pointer"
          >
            Comenzar Gratis
          </Link>
        </div>
      </header>

      {/* Características */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900">
        <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 w-fit">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-white">Velocidad Instantánea</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Busca y filtra entre miles de prompts con nuestra búsqueda optimizada. Copia código en un segundo.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 w-fit">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-white">Prompts Probados</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Cada recurso cuenta con ejemplos estructurados de entrada y salida, asegurando su correcto funcionamiento.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 w-fit">
            <Heart className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-white">Comunidad Activa</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Muestra tus creaciones en tu perfil público de creador y recibe feedback en tus estadísticas.
          </p>
        </div>
      </section>

      {/* Prompts Destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Prompts Destacados</h2>
            <p className="text-xs text-zinc-400">Descubre algunos de los prompts añadidos recientemente por la comunidad.</p>
          </div>
          <Link
            href="/explore"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Ver todos</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, idx) => (
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
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-2xl">
            <p className="text-zinc-550 text-sm">Aún no se han publicado prompts. ¡Sé el primero en publicar uno!</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10 mt-auto text-center text-xs text-zinc-550 space-y-2">
        <p>© 2026 PromptHub. Todos los derechos reservados.</p>
        <p>Construido con Next.js 16 + Supabase Onion Architecture.</p>
      </footer>
    </div>
  );
}
