'use client';

import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ src, alt, className = '', size = 'md' }: AvatarProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-24 w-24 sm:h-28 sm:w-28 text-3xl',
    xl: 'h-32 w-32 text-4xl',
  };

  // Limpiar el username si viene con @ al inicio
  const cleanAlt = alt ? alt.replace(/^@/, '') : 'U';
  const initials = cleanAlt.substring(0, 2).toUpperCase();

  if (src && !error) {
    return (
      <div className={`rounded-full overflow-hidden bg-zinc-900 border border-zinc-800/80 flex-shrink-0 flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`rounded-full overflow-hidden bg-zinc-900 border border-zinc-800/80 flex-shrink-0 flex items-center justify-center text-purple-400 font-semibold select-none ${sizeClasses[size]} ${className}`}>
      <span>{initials}</span>
    </div>
  );
}
