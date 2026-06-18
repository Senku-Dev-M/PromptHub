'use client';

import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import CollectionSelector from './CollectionSelector';

interface ResourceSaveButtonProps {
  resourceId: string;
  hasUser: boolean;
  variant?: 'pill' | 'icon';
}

export default function ResourceSaveButton({ resourceId, hasUser, variant = 'pill' }: ResourceSaveButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasUser) {
      window.location.href = '/login';
      return;
    }
    setShowModal(true);
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleSaveClick}
          className="flex items-center gap-1 text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer group/save"
          title="Guardar en colección"
        >
          <Bookmark className="h-3.5 w-3.5 transition-transform group-active/save:scale-125" />
        </button>

        {showModal && (
          <CollectionSelector
            resourceId={resourceId}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleSaveClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 rounded-full text-zinc-400 hover:text-purple-400 transition-all cursor-pointer group"
      >
        <Bookmark className="h-4 w-4 transition-transform group-active:scale-125" />
        <span className="text-xs font-semibold">Guardar</span>
      </button>

      {showModal && (
        <CollectionSelector
          resourceId={resourceId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
