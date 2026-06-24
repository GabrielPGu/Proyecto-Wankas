"use client";

import type { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logout: () => void;
  loading: boolean;
  updateUser: (updatedData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'wankas_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("initializeAuth: started loading");
      setLoading(true);
      try {
        console.log("initializeAuth: getting local session");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("initializeAuth: local session result:", session ? "User logged in local" : "No local user");

        // 1. Fetch the shared SSO session (cookie wankas_sid / Redis)
        let ssoSession = null;
        try {
          console.log("initializeAuth: fetching SSO session");
          const res = await fetch('/api/auth/session');
          const data = await res.json();
          ssoSession = data.session;
          console.log("initializeAuth: SSO session result:", ssoSession ? "Active session in SSO" : "No session in SSO");
        } catch (ssoError) {
          console.warn('SSO session fetch failed:', ssoError);
        }

        if (session?.user) {
          // If we have a local session but no active SSO session, we must log out
          if (!ssoSession || !ssoSession.access_token) {
            console.log("initializeAuth: local session exists but SSO session is empty. Logging out local.");
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            await supabase.auth.signOut();
          } else if (ssoSession.user?.id !== session.user.id) {
            // If SSO user is different, switch session
            console.log("initializeAuth: SSO user different from local user. Switching session.");
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: ssoSession.access_token,
              refresh_token: ssoSession.refresh_token,
            });
            if (!setError && setData.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', setData.user.id)
                .single();
              if (profile && (profile.role === 'admin' || profile.role === 'worker')) {
                setUser(profile as UserProfile);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
                setLoading(false);
                return;
              }
            }
          } else {
            // Local and SSO match, just load/verify local profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            console.log("initializeAuth: local profile:", profile);
            if (profile && (profile.role === 'admin' || profile.role === 'worker')) {
              setUser(profile as UserProfile);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
              setLoading(false);
              console.log("initializeAuth: local session validated and loaded successfully");
              return;
            } else {
              setUser(null);
              localStorage.removeItem(USER_STORAGE_KEY);
              await supabase.auth.signOut();
            }
          }
        } else {
          // 2. No local session - try to load SSO session if it exists
          if (ssoSession?.access_token) {
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: ssoSession.access_token,
              refresh_token: ssoSession.refresh_token,
            });
            console.log("initializeAuth: setSession result:", { setError, user: setData.user ? "User set" : "No user set" });
            if (!setError && setData.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', setData.user.id)
                .single();
              console.log("initializeAuth: SSO profile loaded:", profile);
              if (profile && (profile.role === 'admin' || profile.role === 'worker')) {
                setUser(profile as UserProfile);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
                setLoading(false);
                console.log("initializeAuth: SSO session restored successfully");
                return;
              }
            }
          }
        }

        console.log("initializeAuth: clearing user state (no valid session found)");
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch (error) {
        console.error("Failed to initialize session", error);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      }
      console.log("initializeAuth: setting loading to false");
      setLoading(false);
    };
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile && (profile.role === 'admin' || profile.role === 'worker')) {
            setUser(profile as UserProfile);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
            
            // Sincronizar cookie de sesión de forma proactiva
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session }),
            }).catch(console.error);
          } else {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            if (typeof document !== 'undefined' && document.cookie.includes('wankas_sid')) {
              await fetch('/api/auth/session', { method: 'DELETE' }).catch(console.error);
            }
          }
        } else {
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          if (typeof document !== 'undefined' && document.cookie.includes('wankas_sid')) {
            await fetch('/api/auth/session', { method: 'DELETE' }).catch(console.error);
          }
        }
      }, 0);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  // Sync session across tabs and apps on focus and page transitions
  const pathname = usePathname();
  useEffect(() => {
    const checkSsoSession = async () => {
      // Only check if we are not initializing and have a local user state
      if (loading || !user) return;
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!data.session?.access_token) {
          console.log("SSO session checked: Active session cleared. Logging out client.");
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          await supabase.auth.signOut();
          router.replace('/');
        } else if (data.session.user?.id !== user.id) {
          console.log("SSO session checked: User changed. Re-initializing.");
          window.location.reload();
        }
      } catch (error) {
        console.warn('SSO session background check failed:', error);
      }
    };

    checkSsoSession();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', checkSsoSession);
      return () => {
        window.removeEventListener('focus', checkSsoSession);
      };
    }
  }, [pathname, user, loading, router, supabase]);

  const updateUser = useCallback((updatedData: Partial<UserProfile>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newUser = { ...currentUser, ...updatedData };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return { error: { message: authError.message === 'Invalid login credentials' ? "Credenciales inválidas." : authError.message } };
    }

    if (data.user) {
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (dbError || !profile) {
        await supabase.auth.signOut();
        return { error: { message: "No se encontró el perfil de usuario." } };
      }

      if (profile.role !== 'admin' && profile.role !== 'worker') {
        await supabase.auth.signOut();
        return { error: { message: "Privilegios insuficientes para acceder al administrador." } };
      }

      const userProfile = profile as UserProfile;
      setUser(userProfile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));

      // Guardar sesión en Redis/file store para SSO y esperar que se configure la cookie antes de redirigir
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: activeSession }),
        }).catch(console.error);
      }

      if (userProfile.role === 'worker') {
        router.replace('/seleccionar-sede');
      } else {
        router.replace('/dashboard');
      }

      return { error: null };
    }

    return { error: { message: "Error de autenticación desconocido." } };
  }, [supabase, router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (e) {
      console.error('Error clearing SSO session during logout:', e);
    }
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    router.replace('/');
  }, [supabase, router]);
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
