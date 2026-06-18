'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import { User, Globe, MessageSquare, Save, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function ProfileSettingsForm() {
  const { profile, session, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del formulario
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    twitter: '',
    github: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (profile && !isInitialized) {
      setUsername(profile.username || '');
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setWebsiteUrl(profile.websiteUrl || '');
      setAvatarUrl(profile.avatarUrl || '');
      
      const links = profile.socialLinks || {};
      setSocialLinks({
        twitter: links.twitter || '',
        github: links.github || '',
      });
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de tipo imagen.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('El tamaño de la imagen supera el límite de 5MB.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al subir la imagen.');
      }

      if (payload.data && payload.data.fileUrl) {
        setAvatarUrl(payload.data.fileUrl);
        setSuccessMsg('Imagen de perfil cargada temporalmente. Guarda los cambios para aplicar.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al subir la imagen de perfil.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/profiles/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          displayName: displayName || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          websiteUrl: websiteUrl || null,
          socialLinks,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al actualizar perfil.');
      }

      if (payload.data) {
        setProfile(payload.data);
        setSuccessMsg('Perfil actualizado con éxito.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-md rounded-2xl p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-800/60">
        <Avatar
          src={avatarUrl}
          alt={displayName || username || 'U'}
          size="lg"
          className="h-20 w-20 ring-4 ring-purple-600/20"
        />
        <div className="space-y-2 text-center sm:text-left">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Foto de perfil</label>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              disabled={uploading}
              onClick={() => document.getElementById('avatar-input')?.click()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
          <p className="text-[10px] text-zinc-500">Formatos recomendados: PNG, JPG, WEBP. Máx 5MB (será optimizada).</p>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white">Configuración del Perfil</h2>
        <p className="text-sm text-zinc-400">Personaliza tu información pública dentro de la plataforma.</p>
      </div>

      {successMsg && (
        <div className="p-4 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Username */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Nombre de Usuario</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="usuario"
              className="w-full pl-8 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Nombre Público</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tu nombre completo o nickname"
            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm transition-all"
          />
        </div>

        {/* Bio */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Biografía (Máx. 500 caracteres)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder="Cuéntanos un poco sobre ti, tus intereses en Inteligencia Artificial y qué tipos de prompts creas..."
            rows={4}
            className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm transition-all resize-none"
          />
          <div className="text-right text-xs text-zinc-600">{bio.length}/500</div>
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Sitio Web</label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 h-4 w-4" />
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://tuweb.com"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Twitter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Twitter / X (Username)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-semibold">X</span>
            <input
              type="text"
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              placeholder="tusuario_x"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Github */}
        <div className="space-y-2 col-span-1 md:col-span-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">GitHub (Username)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-semibold">GH</span>
            <input
              type="text"
              value={socialLinks.github}
              onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
              placeholder="tusuario_github"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-colors cursor-pointer shadow-lg disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar cambios</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
