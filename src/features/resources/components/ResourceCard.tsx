'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Image as ImageIcon, Video, Box, Eye, Heart, Calendar } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import ResourceSaveButton from './ResourceSaveButton';

export interface ResourceCardProps {
  resource: {
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
    createdAt: string | Date;
  };
}

const typeConfig = {
  prompt_llm: {
    label: 'Prompt LLM',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Sparkles,
  },
  prompt_image: {
    label: 'Prompt Imagen',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: ImageIcon,
  },
  prompt_video: {
    label: 'Prompt Video',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Video,
  },
  agent: {
    label: 'Agente IA',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Box,
  },
  workflow: {
    label: 'Workflow',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: Box,
  },
  other: {
    label: 'Otros',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    icon: Box,
  },
};

export default function ResourceCard({ resource }: ResourceCardProps) {
  const { session } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(resource.likesCount);

  const config = typeConfig[resource.type] || typeConfig.other;
  const TypeIcon = config.icon;

  const formattedDate = new Date(resource.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Verificar si el usuario actual ha dado like a este recurso
  useEffect(() => {
    if (session) {
      fetch(`/api/v1/resources/${resource.id}/like`)
        .then((res) => res.json())
        .then((payload) => {
          if (payload.data && payload.data.liked) {
            setLiked(true);
          }
        })
        .catch((err) => console.error('Error al comprobar like:', err));
    }
  }, [session, resource.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      window.location.href = '/login';
      return;
    }

    // Actualización optimista de la UI
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/v1/resources/${resource.id}/like`, {
        method: 'POST',
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al procesar el like.');
      }
      setLiked(payload.data.liked);
      setLikesCount(payload.data.liked ? prevCount + 1 : prevCount - 1);
    } catch (err) {
      console.error(err);
      // Revertir si falló
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  return (
    <div className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-950/5">
      <div className="space-y-4">
        {/* Tipo de recurso y fecha */}
        <div className="flex justify-between items-center text-xs">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${config.color} font-medium`}>
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </span>
          <span className="text-zinc-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        </div>

        {/* Título */}
        <Link href={`/resource/${resource.slug}`} className="block">
          <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors line-clamp-2">
            {resource.title}
          </h3>
        </Link>

        {/* Descripción */}
        <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
          {resource.description || 'Sin descripción disponible.'}
        </p>

        {/* Modelos compatibles */}
        {resource.compatibleModels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {resource.compatibleModels.map((model) => (
              <span
                key={model}
                className="text-[10px] px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 rounded-md font-medium"
              >
                {model}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-850 space-y-4">
        {/* Etiquetas */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {resource.viewsCount}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors cursor-pointer group/like ${
                liked ? 'text-pink-500 hover:text-pink-400' : 'text-zinc-500 hover:text-pink-400'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 transition-transform group-active/like:scale-125 ${liked ? 'fill-pink-500' : ''}`} />
              <span>{likesCount}</span>
            </button>
          </div>

          <ResourceSaveButton
            resourceId={resource.id}
            hasUser={session !== null}
            variant="icon"
          />
        </div>
      </div>
    </div>
  );
}
