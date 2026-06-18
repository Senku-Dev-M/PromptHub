'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import { Bell, Check, Calendar, Heart, MessageSquare, UserPlus, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  notifierId: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  resourceId?: string | null;
  commentId?: string | null;
  isRead: boolean;
  createdAt: string;
  notifier?: {
    username: string;
    displayName: string | null;
  } | null;
  resource?: {
    title: string;
    slug: string;
  } | null;
}

export default function NotificationsPage() {
  const { session, profile } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      const payload = await res.json();
      if (res.ok && payload.data) {
        setNotifications(payload.data);
      }
    } catch (err) {
      console.error('Error al obtener notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-page-${profile.id}`)
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
  }, [profile]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications?id=${id}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-pink-500 fill-pink-500/10" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-zinc-450" />;
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center space-y-6">
          <div className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-450 rounded-full">
            <Bell className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Notificaciones</h1>
            <p className="text-sm text-zinc-400">
              Inicia sesión para ver tu bandeja de entrada de notificaciones y enterarte de la actividad en tus prompts.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md"
          >
            Iniciar Sesión
          </Link>
        </main>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Bell className="h-7 w-7 text-purple-500" />
              <span>Notificaciones</span>
            </h1>
            <p className="text-xs text-zinc-500">
              Tienes {unreadCount} {unreadCount === 1 ? 'notificación no leída' : 'notificaciones no leídas'}.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* Historial */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="h-20 bg-zinc-900/20 border border-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => {
              const notifierName = n.notifier?.displayName || `@${n.notifier?.username || 'usuario'}`;

              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`border rounded-2xl p-4.5 transition-all flex gap-4 items-start cursor-pointer hover:border-zinc-800 ${
                    !n.isRead
                      ? 'bg-purple-950/5 border-purple-500/20 shadow-sm shadow-purple-950/5'
                      : 'bg-zinc-900/10 border-zinc-900/80 text-zinc-400'
                  }`}
                >
                  <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl flex-shrink-0">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm text-zinc-200">
                      <Link href={`/u/${n.notifier?.username}`} className="font-bold text-white hover:underline">
                        {notifierName}
                      </Link>{' '}
                      {n.type === 'like' && (
                        <span>
                          le dio me gusta a tu prompt{' '}
                          {n.resource && (
                            <Link href={`/resource/${n.resource.slug}`} className="font-semibold text-purple-400 hover:underline">
                              "{n.resource.title}"
                            </Link>
                          )}
                        </span>
                      )}
                      {n.type === 'comment' && (
                        <span>
                          comentó en tu prompt{' '}
                          {n.resource && (
                            <Link href={`/resource/${n.resource.slug}`} className="font-semibold text-purple-400 hover:underline">
                              "{n.resource.title}"
                            </Link>
                          )}
                        </span>
                      )}
                      {n.type === 'follow' && (
                        <span>comenzó a seguirte</span>
                      )}
                      {n.type === 'system' && (
                        <span>notificación del sistema</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(n.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-pink-500 self-center" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-6 space-y-3">
            <Bell className="h-10 w-10 text-zinc-650" />
            <h3 className="text-base font-bold text-zinc-300">Sin notificaciones</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Aquí aparecerán las interacciones que otros usuarios realicen con tus prompts publicados.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
