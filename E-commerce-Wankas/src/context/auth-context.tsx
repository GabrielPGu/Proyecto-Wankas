'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

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

  const fetchUserProfile = async (authUserId: string, authUserEmail?: string | null, authUserName?: string | null): Promise<Partial<User>> => {
    if (!supabase) {
      console.warn("Supabase client not available. Cannot fetch user profile.");
      return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null };
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, phone_number') 
        .eq('id', authUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { 
        console.error("Error fetching user profile from Supabase:", profileError.message);
        return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null };
      }
      
      if (profileData) {
        return {
          id: profileData.id, 
          email: profileData.email || authUserEmail,
          name: profileData.name || authUserName,
          phone_number: profileData.phone_number,
        };
      } else {
        return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null };
      }

    } catch (error) {
      console.error("Exception while fetching user profile:", error);
      return { id: authUserId, email: authUserEmail, name: authUserName, phone_number: null };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const storedUserStr = localStorage.getItem('wankas-user');
        if (storedUserStr) {
          const authInfoFromStorage: User = JSON.parse(storedUserStr);
          const profileDetails = await fetchUserProfile(authInfoFromStorage.id, authInfoFromStorage.email, authInfoFromStorage.name);
          setUser({
            ...authInfoFromStorage,
            ...profileDetails,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to load user from localStorage or fetch profile", error);
        localStorage.removeItem('wankas-user'); 
        setUser(null);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (authData: User) => { 
    setIsLoading(true);
    const profileDetails = await fetchUserProfile(authData.id, authData.email, authData.name);
    const completeUser: User = {
      ...authData, 
      name: profileDetails.name || authData.name, 
      email: profileDetails.email || authData.email, 
      phone_number: profileDetails.phone_number,
    };
    localStorage.setItem('wankas-user', JSON.stringify(completeUser));
    setUser(completeUser); 
    setIsLoading(false);
  };

  const logout = () => {
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
