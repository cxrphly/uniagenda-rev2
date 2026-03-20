// ============================================================
// UniAgenda — Auth Context
// Design: Fresh Academic (Contemporary Academic)
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { clearUserData, dbPut, dbGet } from '@/lib/db';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper: timeout wrapper
const withTimeout = <T,>(promise: Promise<T>, ms = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    ),
  ]);
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();
  const initRef = useRef(false);

  const loadProfile = useCallback(async (userId: string, userEmail: string) => {
    // Try local first
    const local = await dbGet<UserProfile>('profiles', userId);
    if (local) {
      setProfile(local);
    }

    if (!configured) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        const p: UserProfile = {
          id: data.id,
          email: data.email || userEmail,
          nome: data.nome || '',
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          notificacoes_ativas: data.notificacoes_ativas ?? true,
        };
        setProfile(p);
        await dbPut('profiles', p);
      } else {
        // Create profile if not exists
        const newProfile: UserProfile = {
          id: userId,
          email: userEmail,
          nome: '',
          created_at: new Date().toISOString(),
          notificacoes_ativas: true,
        };
        await supabase.from('profiles').upsert(newProfile);
        setProfile(newProfile);
        await dbPut('profiles', newProfile);
      }
    } catch (err) {
      console.warn('[Auth] Profile load error:', err);
      // Use local profile if available
    }
  }, [configured]);

  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current) {
      console.log('[Auth] Already initialized, skipping');
      return;
    }
    initRef.current = true;

    if (!configured) {
      console.log('[Auth] Supabase not configured, skipping auth init');
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        console.log('[Auth] Starting getSession with 5s timeout...');
        const { data: { session: sess } } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );
        console.log('[Auth] getSession resolved, session:', !!sess);
        
        setSession(sess);
        setUser(sess?.user ?? null);
        
        if (sess?.user) {
          console.log('[Auth] Loading profile for user:', sess.user.id);
          try {
            await withTimeout(
              loadProfile(sess.user.id, sess.user.email || ''),
              3000
            );
            console.log('[Auth] Profile loaded successfully');
          } catch (profileErr) {
            console.warn('[Auth] Profile load timeout/error:', profileErr);
            // Continue anyway
          }
        }
      } catch (error) {
        console.error('[Auth] Init error (will continue in offline mode):', error);
        // Continue anyway - allow offline/demo mode
      } finally {
        console.log('[Auth] Init complete, setting loading=false');
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        console.log('[Auth] State changed:', _event);
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          try {
            await withTimeout(
              loadProfile(sess.user.id, sess.user.email || ''),
              3000
            );
          } catch (err) {
            console.warn('[Auth] Profile load in state change failed:', err);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [configured, loadProfile]);

  const signIn = async (email: string, password: string) => {
    if (!configured) return { error: 'Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    if (!configured) return { error: 'Supabase não configurado.' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    if (user) {
      await clearUserData(user.id);
    }
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);
    await dbPut('profiles', updated);
    if (configured) {
      await supabase.from('profiles').update(data).eq('id', user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      isConfigured: configured,
      signIn, signUp, signOut, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { AuthProvider, useAuth };
export type { AuthContextType };
