'use client';

import React, { useState } from 'react';
import ResourceCard from '@/features/resources/components/ResourceCard';
import { Sparkles, Image as ImageIcon, Video } from 'lucide-react';

interface ProfilePromptsProps {
  resources: any[];
}

export default function ProfilePrompts({ resources }: ProfilePromptsProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');

  // Filtrar recursos localmente
  const filteredResources = resources.filter((res) => {
    if (activeTab === 'text') {
      return ['prompt_llm', 'agent', 'workflow', 'other'].includes(res.type);
    } else if (activeTab === 'image') {
      return res.type === 'prompt_image';
    } else if (activeTab === 'video') {
      return res.type === 'prompt_video';
    }
    return false;
  });

  // Contar los prompts por categoría de pestaña
  const textCount = resources.filter(res => ['prompt_llm', 'agent', 'workflow', 'other'].includes(res.type)).length;
  const imageCount = resources.filter(res => res.type === 'prompt_image').length;
  const videoCount = resources.filter(res => res.type === 'prompt_video').length;

  return (
    <div className="space-y-6">
      {/* Pestañas de la Galería (Segmented Pills Control) */}
      <div className="flex justify-center border-b border-zinc-900/60 pb-4">
        <div className="flex bg-zinc-900/40 p-1 border border-zinc-900 rounded-2xl backdrop-blur-sm shadow-xl">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-purple-650 text-white shadow-lg shadow-purple-950/40 scale-[1.02]'
                : 'text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/30'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Texto y Lógica</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'text' ? 'bg-purple-800 text-purple-200' : 'bg-zinc-800 text-zinc-500'}`}>
              {textCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-purple-650 text-white shadow-lg shadow-purple-950/40 scale-[1.02]'
                : 'text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/30'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Imágenes</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'image' ? 'bg-purple-800 text-purple-200' : 'bg-zinc-800 text-zinc-500'}`}>
              {imageCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-purple-650 text-white shadow-lg shadow-purple-950/40 scale-[1.02]'
                : 'text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/30'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Videos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'video' ? 'bg-purple-800 text-purple-200' : 'bg-zinc-800 text-zinc-500'}`}>
              {videoCount}
            </span>
          </button>
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={{
                id: res.id,
                title: res.title,
                slug: res.slug,
                description: res.description,
                type: res.type,
                status: res.status,
                compatibleModels: res.compatibleModels,
                viewsCount: res.viewsCount,
                likesCount: res.likesCount,
                savesCount: res.savesCount,
                commentsCount: res.commentsCount,
                tags: res.tags,
                createdAt: res.createdAt,
                exampleOutput: res.exampleOutput,
                files: res.files,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl">
          <p className="text-zinc-550 text-sm">Este creador aún no ha publicado ningún prompt en esta categoría.</p>
        </div>
      )}
    </div>
  );
}
