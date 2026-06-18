'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Plus, User as UserIcon, Settings, LogOut, Menu, X, Bell, BarChart3 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, session, clearAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    setDropdownOpen(false);
    setNotifDropdownOpen(false);
    router.push('/login');
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      const payload = await res.json();
      if (res.ok && payload.data) {
        setNotifications(payload.data);
        const unread = payload.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error al obtener notificaciones:', err);
    }
  };

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!profile) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-changes-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, supabase]);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error al marcar notificaciones:', err);
    }
  };

  return (
    <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group mr-8">
              <div className="p-1.5 bg-purple-600/10 rounded-lg border border-purple-500/20 text-purple-400 group-hover:bg-purple-600/20 transition-all">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-white transition-all">
                PromptHub
              </span>
            </Link>

            {/* Links Escritorio */}
            <div className="hidden sm:flex sm:space-x-4 items-center">
              <Link
                href="/explore"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === '/explore'
                    ? 'text-white bg-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                Explorar Prompts
              </Link>
              {session && (
                <Link
                  href="/feed"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/feed'
                      ? 'text-white bg-zinc-900'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  Mi Feed
                </Link>
              )}
            </div>
          </div>

          {/* Menú derecho */}
          <div className="hidden sm:flex sm:items-center sm:gap-4">
            {session ? (
              <>
                <Link
                  href="/resource/new"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-xs shadow-md shadow-purple-950/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer mr-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Publicar Prompt</span>
                </Link>

                {/* Campana de Notificaciones */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setDropdownOpen(false);
                    }}
                    className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                      </span>
                    )}
                  </button>

                  {/* Dropdown de Notificaciones */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl py-1 text-sm text-zinc-300 ring-1 ring-black/5 divide-y divide-zinc-800/85 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                      <div className="px-4 py-2.5 flex justify-between items-center bg-zinc-950/20">
                        <span className="font-semibold text-white text-xs">Notificaciones</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-900">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 text-xs transition-colors flex flex-col gap-1 ${
                                !n.isRead ? 'bg-purple-950/10 text-zinc-200' : 'text-zinc-400 hover:bg-zinc-900/20'
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-white">
                                  {n.notifier?.displayName || `@${n.notifier?.username || 'usuario'}`}
                                </span>{' '}
                                {n.type === 'like' && (
                                  <>le dio me gusta a tu prompt <span className="text-zinc-300 font-medium">"{n.resource?.title || 'prompt'}"</span></>
                                )}
                                {n.type === 'comment' && (
                                  <>comentó en tu prompt <span className="text-zinc-300 font-medium">"{n.resource?.title || 'prompt'}"</span></>
                                )}
                                {n.type === 'follow' && <>comenzó a seguirte</>}
                                {n.type === 'system' && <>notificación de sistema</>}
                              </div>
                              <span className="text-[10px] text-zinc-550">
                                {new Date(n.createdAt).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-xs text-zinc-500">
                            No tienes notificaciones.
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-2 text-center bg-zinc-950/20">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="text-xs text-zinc-400 hover:text-white font-medium block"
                        >
                          Ver todas
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar / Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-1 focus:ring-purple-500 border border-zinc-800 transition-all cursor-pointer overflow-hidden h-9 w-9 bg-zinc-900"
                  >
                    <Avatar
                      src={profile?.avatarUrl}
                      alt={profile?.displayName || profile?.username || 'U'}
                      size="md"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl py-1 text-sm text-zinc-300 ring-1 ring-black/5 divide-y divide-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3">
                        <p className="text-xs text-zinc-500">Sesión iniciada como</p>
                        <p className="font-semibold text-white truncate text-xs mt-0.5">
                          {profile?.displayName || `@${profile?.username}`}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href={profile ? `/u/${profile.username}` : '#'}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        >
                          <UserIcon className="h-4 w-4 text-zinc-500" />
                          <span>Mi Perfil</span>
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        >
                          <BarChart3 className="h-4 w-4 text-zinc-500" />
                          <span>Estadísticas</span>
                        </Link>
                        <Link
                          href="/profile/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        >
                          <Settings className="h-4 w-4 text-zinc-500" />
                          <span>Configuración</span>
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white hover:text-zinc-200 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Menú Móvil Botón */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 border-b border-zinc-900 bg-zinc-950 py-4 px-4 space-y-3 shadow-2xl z-50">
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
          >
            Explorar Prompts
          </Link>
          {session ? (
            <div className="pt-2 border-t border-zinc-900 space-y-2">
              <Link
                href="/resource/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Publicar Prompt</span>
              </Link>
              <Link
                href={profile ? `/u/${profile.username}` : '#'}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
              >
                Mi Perfil
              </Link>
              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
              >
                Notificaciones
              </Link>
              <Link
                href="/profile/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
              >
                Configuración
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center w-full py-2 bg-zinc-900 text-white rounded-lg font-medium text-sm"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
