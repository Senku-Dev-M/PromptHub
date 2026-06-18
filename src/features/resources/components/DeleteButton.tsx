'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash, Loader2, AlertTriangle, X } from 'lucide-react';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/resources/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error?.message || 'Error al eliminar el recurso.');
      }
      setConfirming(false);
      router.push('/explore');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo eliminar el recurso.');
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/50 rounded-xl text-xs font-semibold text-red-400 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      >
        <Trash className="h-3.5 w-3.5" />
        <span>Eliminar</span>
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => !loading && setConfirming(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-zinc-900/95 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              {/* Alert Icon */}
              <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">¿Eliminar Prompt?</h3>
                <p className="text-sm text-zinc-400">
                  ¿Estás seguro de que deseas eliminar este prompt? Esta acción no se puede deshacer y el prompt desaparecerá de la plataforma.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full pt-4">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-650 hover:bg-red-550 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-950/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      <span>Sí, eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
