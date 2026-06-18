import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  socialLinks?: Record<string, any>;
  isVerified?: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setAuth: (session: Session | null, profile: UserProfile | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setAuth: (session, profile) =>
    set({
      session,
      user: session?.user ?? null,
      profile,
      loading: false,
    }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () =>
    set({
      session: null,
      user: null,
      profile: null,
      loading: false,
    }),
}));
