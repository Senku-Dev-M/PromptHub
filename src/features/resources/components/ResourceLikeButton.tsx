'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface ResourceLikeButtonProps {
  resourceId: string;
  initialLikesCount: number;
  initialLiked: boolean;
  hasUser: boolean;
}

export default function ResourceLikeButton({
  resourceId,
  initialLikesCount,
  initialLiked,
  hasUser,
}: ResourceLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!hasUser) {
      window.location.href = '/login';
      return;
    }

    if (loading) return;
    setLoading(true);

    // Actualización optimista
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/v1/resources/${resourceId}/like`, {
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
      // Revertir
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full transition-all cursor-pointer group hover:border-pink-500/30 ${
        liked ? 'text-pink-500 bg-pink-500/5 border-pink-500/20' : 'text-zinc-400 hover:text-pink-400'
      }`}
    >
      <Heart
        className={`h-4 w-4 transition-transform group-active:scale-125 ${
          liked ? 'fill-pink-500 text-pink-500' : ''
        }`}
      />
      <span className="text-xs font-semibold">{likesCount}</span>
    </button>
  );
}
