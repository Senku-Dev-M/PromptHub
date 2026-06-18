'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FolderPlus, Plus, Folder, Check, Loader2, X } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  resourcesCount: number;
}

interface CollectionSelectorProps {
  resourceId: string;
  onClose: () => void;
}

export default function CollectionSelector({ resourceId, onClose }: CollectionSelectorProps) {
  const supabase = createClient();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [associatedIds, setAssociatedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Obtener colecciones del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/v1/collections?userId=${user.id}`);
      const payload = await res.json();
      if (res.ok && payload.data) {
        setCollections(payload.data);
      }

      // 2. Obtener asociaciones de esta recurso
      const { data: assocData, error: assocError } = await supabase
        .from('collection_resources')
        .select('collection_id')
        .eq('resource_id', resourceId);

      if (!assocError && assocData) {
        setAssociatedIds(assocData.map((row: any) => row.collection_id));
      }
    } catch (err) {
      console.error('Error al cargar colecciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resourceId]);

  const handleToggle = async (collectionId: string, isAssociated: boolean) => {
    if (togglingId) return;
    setTogglingId(collectionId);

    try {
      if (isAssociated) {
        // Eliminar de colección
        const res = await fetch(`/api/v1/collections/${collectionId}/resources?resourceId=${resourceId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setAssociatedIds(prev => prev.filter(id => id !== collectionId));
          setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, resourcesCount: Math.max(0, c.resourcesCount - 1) } : c));
        }
      } else {
        // Agregar a colección
        const res = await fetch(`/api/v1/collections/${collectionId}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId }),
        });
        if (res.ok) {
          setAssociatedIds(prev => [...prev, collectionId]);
          setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, resourcesCount: c.resourcesCount + 1 } : c));
        }
      }
    } catch (err) {
      console.error('Error al guardar/eliminar del recurso:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch('/api/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDesc,
          isPublic,
        }),
      });
      const payload = await res.json();
      if (res.ok && payload.data) {
        // Agregar nueva colección a la lista
        const newCol = payload.data;
        setCollections(prev => [newCol, ...prev]);
        setNewCollectionName('');
        setNewCollectionDesc('');
        setShowCreateForm(false);
        
        // Auto-asociar el recurso a la colección recién creada
        await handleToggle(newCol.id, false);
      } else {
        alert(payload.error?.message || 'Error al crear la colección.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-purple-400" />
            <span>Guardar en Colecciones</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido / Lista */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              <span className="text-xs text-zinc-500">Cargando tus colecciones...</span>
            </div>
          ) : (
            <>
              {/* Lista de Colecciones */}
              <div className="space-y-2">
                {collections.length > 0 ? (
                  collections.map((col) => {
                    const isAssociated = associatedIds.includes(col.id);
                    const isToggling = togglingId === col.id;

                    return (
                      <button
                        key={col.id}
                        onClick={() => handleToggle(col.id, isAssociated)}
                        disabled={!!togglingId}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isAssociated
                            ? 'bg-purple-950/10 border-purple-500/30 text-white'
                            : 'bg-zinc-950/20 border-zinc-800/80 text-zinc-350 hover:bg-zinc-850/30 hover:border-zinc-750'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isAssociated ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            <Folder className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{col.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {col.resourcesCount} {col.resourcesCount === 1 ? 'prompt' : 'prompts'} • {col.isPublic ? 'Pública' : 'Privada'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                          ) : isAssociated ? (
                            <div className="h-5 w-5 bg-purple-500 text-white rounded-full flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 border border-zinc-700 rounded-full" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    Aún no tienes colecciones de prompts.
                  </div>
                )}
              </div>

              {/* Botón Crear nueva */}
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-3 bg-zinc-950/40 hover:bg-zinc-850/30 border border-zinc-800 hover:border-zinc-750 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Nueva Colección</span>
                </button>
              )}

              {/* Formulario Crear Nueva Colección */}
              {showCreateForm && (
                <form onSubmit={handleCreateCollection} className="p-4 bg-zinc-950/20 border border-zinc-800 rounded-xl space-y-3 animate-in slide-in-from-bottom-2 duration-150">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nueva Colección</h4>
                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Nombre de la colección (ej. Midjourney prompts)"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-zinc-150 focus:outline-none placeholder-zinc-550"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        placeholder="Descripción (opcional)"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-zinc-150 focus:outline-none placeholder-zinc-550 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="rounded border-zinc-800 text-purple-600 bg-zinc-900 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <label htmlFor="isPublic" className="text-xs text-zinc-400 font-medium cursor-pointer">
                        Hacer colección pública
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newCollectionName.trim() || creating}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white disabled:text-zinc-650 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {creating && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Crear y Guardar</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
