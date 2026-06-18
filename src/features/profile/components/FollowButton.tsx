'use client';

import React, { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  followingUsername: string;
  initialFollowing: boolean;
  hasUser: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  followingUsername,
  initialFollowing,
  hasUser,
  onFollowChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!hasUser) {
      window.location.href = '/login';
      return;
    }

    if (loading) return;
    setLoading(true);

    const prevFollowing = following;
    setFollowing(!prevFollowing);
    if (onFollowChange) onFollowChange(!prevFollowing);

    try {
      const res = await fetch(`/api/v1/users/${followingUsername}/follow`, {
        method: 'POST',
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al procesar el follow.');
      }
      setFollowing(payload.data.following);
      if (onFollowChange) onFollowChange(payload.data.following);
    } catch (err) {
      console.error(err);
      setFollowing(prevFollowing);
      if (onFollowChange) onFollowChange(prevFollowing);
    } finally {
      setLoading(false);
    }
  };

  if (following) {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-900/35 hover:text-red-400 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer group"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserMinus className="h-3.5 w-3.5 text-zinc-500 group-hover:text-red-400" />
        )}
        <span>Siguiendo</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      <span>Seguir</span>
    </button>
  );
}
