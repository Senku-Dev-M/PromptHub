'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import { BarChart3, Eye, Heart, MessageSquare, Folder, Plus, ArrowUpRight, Loader2, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { session, profile } = useAuthStore();
  const supabase = createClient();
  const [prompts, setPrompts] = useState<Resource[]>([]);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!profile) return;
    try {
      // 1. Obtener prompts del usuario (incluyendo borradores y publicados)
      const res = await fetch(`/api/v1/resources?authorId=${profile.id}`);
      const payload = await res.json();
      if (res.ok && payload.data) {
        setPrompts(payload.data);
      }

      // 2. Obtener total de colecciones del usuario
      const colRes = await fetch(`/api/v1/collections?userId=${profile.id}`);
      const colPayload = await colRes.json();
      if (colRes.ok && colPayload.data) {
        setCollectionsCount(colPayload.data.length);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center space-y-6">
          <div className="p-4 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-full">
            <BarChart3 className="h-10 w-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Dashboard de Creador</h1>
            <p className="text-sm text-zinc-400">
              Inicia sesión para ver las estadísticas detalladas y el alcance de tus prompts publicados.
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

  // Cálculos de métricas globales
  const totalViews = prompts.reduce((acc, p) => acc + p.viewsCount, 0);
  const totalLikes = prompts.reduce((acc, p) => acc + p.likesCount, 0);
  const totalComments = prompts.reduce((acc, p) => acc + p.commentsCount, 0);
  const totalPrompts = prompts.length;

  // Filtrar los 5 prompts con mejor rendimiento (basado en vistas) para el gráfico SVG
  const topPrompts = [...prompts]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 5);

  const maxViews = Math.max(...topPrompts.map(p => p.viewsCount), 10);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-purple-500" />
              <span>Estadísticas de Creador</span>
            </h1>
            <p className="text-xs text-zinc-500">
              Monitorea el impacto de tus aportes a la comunidad.
            </p>
          </div>
          <Link
            href="/resource/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-xs shadow-md shadow-purple-950/10 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Publicar Prompt</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <span className="text-xs text-zinc-500">Analizando métricas...</span>
          </div>
        ) : (
          <>
            {/* Grid de Tarjetas de Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Tarjeta 1: Prompts */}
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl -z-10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Prompts</span>
                  <BookOpen className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white mt-4">{totalPrompts}</p>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                  <span>Creados por ti</span>
                </div>
              </div>

              {/* Tarjeta 2: Vistas */}
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -z-10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Vistas Totales</span>
                  <Eye className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white mt-4">{totalViews.toLocaleString('es-ES')}</p>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                  <span>Visualizaciones</span>
                </div>
              </div>

              {/* Tarjeta 3: Likes */}
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/5 rounded-full blur-2xl -z-10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Me gusta</span>
                  <Heart className="h-4 w-4 text-pink-500 fill-pink-500/10" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white mt-4">{totalLikes.toLocaleString('es-ES')}</p>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                  <span>Likes acumulados</span>
                </div>
              </div>

              {/* Tarjeta 4: Colecciones */}
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl -z-10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Colecciones</span>
                  <Folder className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white mt-4">{collectionsCount}</p>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                  <span>Carpetas creadas</span>
                </div>
              </div>

            </div>

            {/* Sección Gráficos SVG */}
            {prompts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Gráfico de rendimiento */}
                <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-900 backdrop-blur-sm rounded-2xl p-6 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>Top 5 Prompts con más Vistas</span>
                  </h3>

                  <div className="h-60 w-full flex items-end justify-between pt-6 px-4">
                    {topPrompts.map((p, idx) => {
                      const heightPercent = (p.viewsCount / maxViews) * 100;
                      return (
                        <div key={p.id} className="flex flex-col items-center flex-1 max-w-[80px] group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-150 bg-zinc-800 text-white border border-zinc-700 text-[10px] rounded-lg px-2 py-1 z-10 shadow-lg pointer-events-none whitespace-nowrap">
                            {p.viewsCount} vistas
                          </div>
                          
                          {/* Barra */}
                          <div
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                            className="w-8 rounded-t-lg bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-purple-950/20 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-400 transition-all duration-300"
                          />

                          {/* Nombre truncado */}
                          <span className="text-[9px] text-zinc-550 truncate w-full text-center mt-3 font-semibold group-hover:text-zinc-200 transition-colors">
                            {p.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Métricas secundarias */}
                <div className="bg-zinc-900/20 border border-zinc-900 backdrop-blur-sm rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <span>Engagement de Comunidad</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                      El engagement representa la cantidad de comentarios e interacciones de valor que reciben tus prompts.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Total Comentarios recibidos</span>
                      <span className="font-bold text-white">{totalComments}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-900">
                      <div
                        style={{ width: `${Math.min((totalComments / (totalLikes || 1)) * 100, 100)}%` }}
                        className="bg-purple-500 h-full rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-550">
                      <span>Proporción comentarios/likes</span>
                      <span>{totalLikes > 0 ? ((totalComments / totalLikes) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Listado de Prompts con estadísticas */}
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-5 border-b border-zinc-900">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mis Prompts publicados</h3>
              </div>

              {prompts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-950/45 text-zinc-500 border-b border-zinc-900 font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Prompt</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Vistas</th>
                        <th className="px-6 py-4 text-right">Likes</th>
                        <th className="px-6 py-4 text-right">Guardados</th>
                        <th className="px-6 py-4 text-right">Comentarios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                      {prompts.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="px-6 py-4.5">
                            <Link href={`/resource/${p.slug}`} className="font-bold text-zinc-200 hover:text-purple-400 transition-colors text-sm truncate max-w-[280px] block">
                              {p.title}
                            </Link>
                            <span className="text-[10px] text-zinc-550 mt-1 block">
                              {p.type.replace('_', ' ').toUpperCase()} • {new Date(p.createdAt).toLocaleDateString('es-ES')}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                              p.status === 'published'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                            }`}>
                              {p.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right font-semibold text-zinc-350">{p.viewsCount.toLocaleString('es-ES')}</td>
                          <td className="px-6 py-4.5 text-right font-semibold text-zinc-350">{p.likesCount.toLocaleString('es-ES')}</td>
                          <td className="px-6 py-4.5 text-right font-semibold text-zinc-350">{p.savesCount.toLocaleString('es-ES')}</td>
                          <td className="px-6 py-4.5 text-right font-semibold text-zinc-350">{p.commentsCount.toLocaleString('es-ES')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-zinc-500 text-xs">Aún no has publicado ningún prompt.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
