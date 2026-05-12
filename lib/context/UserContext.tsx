'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role: 'hotel_owner' | 'vendor' | 'admin';
  company?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    // Clear state and storage first for immediate UI update
    setUser(null);
    localStorage.removeItem('hv_token');
    localStorage.removeItem('hv_user');
    
    // Then sign out from Supabase
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    // We don't load from localStorage anymore to prevent stale role issues
    // The fetchSession below will handle getting the fresh user

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Safety timeout: Never stay in loading state for more than 2 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            role: session.user.user_metadata?.role || profile?.role || 'hotel_owner',
            name: profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            ...profile
          };

          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Quick update from metadata while profile loads
        setUser(prev => ({
          ...prev,
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata?.role || prev?.role || 'hotel_owner',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        } as User));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('hv_token');
        localStorage.removeItem('hv_user');
      }
      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
