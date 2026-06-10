"use client";

import type { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
    setLoading(true);
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const updateUser = useCallback((updatedData: Partial<UserProfile>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newUser = { ...currentUser, ...updatedData };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !profile) {
      return { error: { message: "Credenciales inválidas." } };
    }
    
    if (profile.password_hash !== password) {
       return { error: { message: "Credenciales inválidas." } };
    }
    
    const userProfile = profile as UserProfile;
    setUser(userProfile);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    
    if (userProfile.role === 'worker') {
      router.push('/seleccionar-sede');
    } else {
      router.push('/dashboard');
    }

    return { error: null };
  }, [supabase, router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    router.push('/');
  }, [router]);
  
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
