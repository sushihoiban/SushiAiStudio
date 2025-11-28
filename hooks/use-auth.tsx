
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
  // Permission Helpers
  isSuperAdmin: boolean;
  isManager: boolean;
  isAdmin: boolean;
  canManageSettings: boolean;
  canManageTables: boolean;
  canManageCustomers: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isGuest: false,
  loginAsGuest: () => {},
  signOut: async () => {},
  isSuperAdmin: false,
  isManager: false,
  isAdmin: false,
  canManageSettings: false,
  canManageTables: false,
  canManageCustomers: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check local storage for guest session
    const storedGuest = localStorage.getItem('sushi_guest_session');
    if (storedGuest === 'true') {
      setIsGuest(true);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setIsGuest(false); // If authenticated, not a guest
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If there's a user session, we must set loading to true immediately
      if (session?.user) {
        setLoading(true);
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        setIsGuest(false);
      } else {
        setProfile(null);
        // Don't reset guest here automatically, strictly handled by explicit sign out
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.warn('Error fetching profile:', error.message || error);
      }
      setProfile(data);
    } catch (err: any) {
      console.error('Unexpected error fetching profile:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('sushi_guest_session', 'true');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem('sushi_guest_session');
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  // Role Helpers
  const role = profile?.role || '';
  const isSuperAdmin = role === 'super_admin';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin'; // Basic admin

  // Permissions
  const canManageSettings = isSuperAdmin || isManager;
  const canManageTables = isSuperAdmin || isManager;
  const canManageCustomers = isSuperAdmin || isManager; // Basic admin is read-only for customers

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, loading, isGuest, loginAsGuest, signOut,
      isSuperAdmin, isManager, isAdmin,
      canManageSettings, canManageTables, canManageCustomers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
