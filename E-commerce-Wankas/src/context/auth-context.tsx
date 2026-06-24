'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { clientCache } from '@/lib/clientCache';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>; 
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = async (authUserId: string, authUserEmail?: string | null, authUserName?: string | null): Promise<Partial<User>> => {
    if (!supabase) {
      console.warn("Supabase client not available. Cannot fetch user profile.");
      return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null };
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, phone_number, role') 
        .eq('id', authUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { 
        console.error("Error fetching user profile from Supabase:", profileError.message);
        return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null, role: null };
      }
      
      if (profileData) {
        return {
          id: profileData.id, 
          email: profileData.email || authUserEmail,
          name: profileData.name || authUserName,
          phone_number: profileData.phone_number,
          role: profileData.role,
        };
      } else {
        return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null, role: null };
      }

    } catch (error) {
      console.error("Exception while fetching user profile:", error);
      return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null };
    }
  };

  const buildUser = async (authUser: { id: string; email?: string | null; user_metadata?: any }): Promise<User> => {
    const profileDetails = await fetchUserProfile(authUser.id, authUser.email, authUser.user_metadata?.name);
    return {
      id: authUser.id,
      email: authUser.email || null,
      name: profileDetails.name || authUser.user_metadata?.name || null,
      phone_number: profileDetails.phone_number || null,
      role: profileDetails.role || null,
    };
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Get local session
        const { data: { session } } = await supabase.auth.getSession();

        // 1. Fetch the shared SSO session (cookie wankas_sid / Redis)
        let ssoSession = null;
        try {
          const res = await fetch('/api/auth/session');
          const data = await res.json();
          ssoSession = data.session;
        } catch (ssoError) {
          console.warn('SSO session fetch failed:', ssoError);
        }

        if (session?.user) {
          // If we have a local session but no active SSO session, we must log out
          if (!ssoSession || !ssoSession.access_token) {
            setUser(null);
            localStorage.removeItem('wankas-user');
            await supabase.auth.signOut();
          } else if (ssoSession.user?.id !== session.user.id) {
            // If SSO user is different, switch session
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: ssoSession.access_token,
              refresh_token: ssoSession.refresh_token,
            });
            if (!setError && setData.user) {
              const completeUser = await buildUser(setData.user);
              setUser(completeUser);
              localStorage.setItem('wankas-user', JSON.stringify(completeUser));
              setIsLoading(false);
              return;
            }
          } else {
            // Local and SSO match, just load/verify profile
            const completeUser = await buildUser(session.user);
            setUser(completeUser);
            localStorage.setItem('wankas-user', JSON.stringify(completeUser));
            setIsLoading(false);
            return;
          }
        } else {
          // 2. No local session — try shared Redis/file SSO session from Admin
          if (ssoSession?.access_token) {
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: ssoSession.access_token,
              refresh_token: ssoSession.refresh_token,
            });
            if (!setError && setData.user) {
              const completeUser = await buildUser(setData.user);
              setUser(completeUser);
              localStorage.setItem('wankas-user', JSON.stringify(completeUser));
              setIsLoading(false);
              return;
            }
          }
        }

        // 3. No session found anywhere
        setUser(null);
        localStorage.removeItem('wankas-user');
      } catch (error) {
        console.error("Failed to initialize auth", error);
        localStorage.removeItem('wankas-user'); 
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
        if (session?.user) {
          const completeUser = await buildUser(session.user);
          setUser(completeUser);
          localStorage.setItem('wankas-user', JSON.stringify(completeUser));

          // Sincronizar cookie de sesión al iniciar sesión, registrarse o refrescar token
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session }),
          }).catch(console.error);
        } else {
          setUser(null);
          localStorage.removeItem('wankas-user');

          // Limpiar cookie de sesión si existe
          if (typeof document !== 'undefined' && document.cookie.includes('wankas_sid')) {
            await fetch('/api/auth/session', { method: 'DELETE' }).catch(console.error);
          }
        }
        // Invalidar caché del cliente para evitar fuga de estado entre invitados y autenticados
        clientCache.invalidateAll();
      }, 0);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync session across tabs and apps on focus and page transitions
  useEffect(() => {
    const checkSsoSession = async () => {
      // Only check if we are not initializing and have a local user state
      if (isLoading || !user) return;
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!data.session?.access_token) {
          console.log("SSO session checked: Active session cleared. Logging out client.");
          setUser(null);
          localStorage.removeItem('wankas-user');
          if (supabase) {
            await supabase.auth.signOut();
          }
          router.replace('/login');
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
  }, [pathname, user, isLoading, router]);

  const login = async (authData: User) => { 
    setUser(authData);
    localStorage.setItem('wankas-user', JSON.stringify(authData));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (e) {
      console.error('Error clearing SSO session during logout:', e);
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('wankas-user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login'; 
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
