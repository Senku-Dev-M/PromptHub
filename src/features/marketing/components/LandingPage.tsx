'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import ResourceCard from '@/features/resources/components/ResourceCard';
import Lightfall from '@/components/ui/Lightfall';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Heart, 
  Compass, 
  Copy, 
  Share2, 
  Layers, 
  Users 
} from 'lucide-react';

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

      {/* Hero Container con efecto de fondo Lightfall */}
      <div className="relative overflow-hidden w-full border-b border-zinc-900/60 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center z-0">
        <div className="absolute inset-0 -z-10">
          <Lightfall
            colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
            backgroundColor="#07030e"
            speed={0.15}
            streakCount={2}
            streakWidth={0.8}
            streakLength={1.0}
            glow={0.8}
            density={0.3}
            twinkle={0.5}
            zoom={2.5}
            backgroundGlow={0.15}
            opacity={0.45}
            mouseInteraction={true}
            mouseStrength={0.4}
            mouseRadius={0.8}
          />
        </div>
        {/* Máscara radial oscura en el centro para maximizar contraste de lectura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#07030e_35%,transparent_80%)] pointer-events-none -z-10 opacity-85" />

        {/* Desvanecido suave al final del hero */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-10" />

        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center space-y-6 relative z-20">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent max-w-4xl mx-auto leading-none">
            El Hub de Prompts de IA de Próxima Generación
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Encuentra, comparte y optimiza prompts profesionales para ChatGPT, Midjourney, Claude y más. Únete a miles de creadores de contenido, desarrolladores y entusiastas de la Inteligencia Artificial.
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
      </div>

      {/* Características Clave */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900/60 relative z-10">
        <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-3 backdrop-blur-sm hover:border-purple-500/20 hover:bg-zinc-900/30 transition-all duration-300">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 w-fit">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-white">Velocidad Instantánea</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Busca y filtra entre miles de prompts con nuestra búsqueda optimizada y descarga o copia código en un segundo.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-3 backdrop-blur-sm hover:border-emerald-500/20 hover:bg-zinc-900/30 transition-all duration-300">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 w-fit">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-white">Prompts Probados</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Cada recurso cuenta con ejemplos estructurados de entrada y salida, asegurando su correcto funcionamiento y compatibilidad.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-3 backdrop-blur-sm hover:border-blue-500/20 hover:bg-zinc-900/30 transition-all duration-300">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 w-fit">
            <Heart className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-white">Comunidad Activa</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Muestra tus creaciones en tu perfil público de creador, recibe feedback y sigue de cerca a otros expertos de la industria.
          </p>
        </div>
      </section>

      {/* Sección: Cómo Funciona */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-900/60 relative z-10 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Cómo funciona PromptHub</h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            PromptHub está diseñado para que encuentres, utilices y compartas soluciones de IA en segundos de forma intuitiva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4 text-center p-6 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl backdrop-blur-sm">
            <div className="mx-auto p-4 bg-purple-950/20 border border-purple-900/30 text-purple-400 rounded-full w-14 h-14 flex items-center justify-center">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm text-white">1. Descubre e Inspírate</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Explora una biblioteca en constante crecimiento de prompts validados por la comunidad, clasificados por categorías, modelos y tipos de tareas.
            </p>
          </div>

          <div className="space-y-4 text-center p-6 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl backdrop-blur-sm">
            <div className="mx-auto p-4 bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 rounded-full w-14 h-14 flex items-center justify-center">
              <Copy className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm text-white">2. Copia y Adapta</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Copia el prompt con un solo clic o personaliza sus variables integradas para adaptarlo exactamente a tus necesidades específicas.
            </p>
          </div>

          <div className="space-y-4 text-center p-6 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl backdrop-blur-sm">
            <div className="mx-auto p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-full w-14 h-14 flex items-center justify-center">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm text-white">3. Comparte y Destaca</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Publica tus propios prompts estructurados, recibe feedback directo de otros creadores y haz crecer tu reputación en la comunidad de IA.
            </p>
          </div>
        </div>
      </section>


      {/* Prompts Destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 relative z-10">
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

      {/* Banner de Registro Secundario (CTA) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-3xl p-8 sm:p-12 text-center space-y-6 backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">¿Listo para potenciar tu productividad?</h2>
          <p className="text-xs sm:text-sm text-zinc-350 max-w-xl mx-auto leading-relaxed">
            Únete a PromptHub hoy mismo de manera gratuita. Guarda tus prompts favoritos, sigue a tus creadores preferidos y publica tus mejores flujos de trabajo con inteligencia artificial.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-3">
            <Link
              href="/login"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-purple-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto cursor-pointer"
            >
              Crear Cuenta Gratis
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white rounded-xl font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto cursor-pointer"
            >
              Explorar Biblioteca
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Profesional */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md pt-16 pb-8 mt-auto relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-650/10 rounded-lg border border-purple-500/20 text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-white">PromptHub</span>
            </div>
            <p className="text-xs text-zinc-450 leading-relaxed">
              La plataforma abierta donde creadores y desarrolladores comparten, descubren y optimizan prompts para los modelos de Inteligencia Artificial más avanzados.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-4">Descubrir</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><Link href="/explore" className="hover:text-white transition-colors">Explorar Prompts</Link></li>
              <li><Link href="/explore?type=prompt_llm" className="hover:text-white transition-colors">Modelos de Lenguaje</Link></li>
              <li><Link href="/explore?type=prompt_image" className="hover:text-white transition-colors">Generación de Imágenes</Link></li>
              <li><Link href="/explore?type=agent" className="hover:text-white transition-colors">Agentes de IA</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-4">Comunidad</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><Link href="/feed" className="hover:text-white transition-colors">Mi Feed</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Únete Gratis</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Creadores Destacados</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Eventos y Retos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-4">Recursos y Soporte</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentación de Prompts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ingeniería de Prompts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} PromptHub. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

