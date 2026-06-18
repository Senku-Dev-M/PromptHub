'use client';

import React, { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setAuth, clearAuth, setLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        try {
          const res = await fetch('/api/v1/profiles/me');
          if (res.ok) {
            const payload = await res.json();
            if (payload.data) {
              setAuth(session, payload.data);
            } else {
              setAuth(session, null);
            }
          } else {
            setAuth(session, null);
          }
        } catch (err) {
          console.error('Error al inicializar perfil:', err);
          setAuth(session, null);
        }
      } else {
        clearAuth();
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentStore = useAuthStore.getState();
      const currentUserId = currentStore.user?.id;
      const newUserId = session?.user?.id;

      // Si no hay nueva sesión y no había anterior, no hacemos nada
      if (!newUserId && !currentUserId) {
        return;
      }

      // Si la sesión es la misma, solo actualizamos el token (session) si cambió, pero no re-refrescamos la página ni el perfil
      if (newUserId && currentUserId && newUserId === currentUserId) {
        if (session !== currentStore.session) {
          useAuthStore.setState({ session, user: session.user });
        }
        return;
      }

      if (session) {
        try {
          const res = await fetch('/api/v1/profiles/me');
          if (res.ok) {
            const payload = await res.json();
            if (payload.data) {
              setAuth(session, payload.data);
            } else {
              setAuth(session, null);
            }
          } else {
            setAuth(session, null);
          }
        } catch (err) {
          console.error('Error en cambio de sesión:', err);
          setAuth(session, null);
        }
      } else {
        clearAuth();
      }
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, clearAuth, setLoading, router, supabase.auth]);

  return <>{children}</>;
}
