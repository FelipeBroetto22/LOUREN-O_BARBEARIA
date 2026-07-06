/**
 * AuthContext — Provider global de autenticação
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import * as authService from '../services/authService';
import type { UserProfile, AuthState, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Carregar sessão e perfil ao iniciar
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const session = await authService.getSession();
        if (session?.user && mounted) {
          const profile = await authService.getProfile(session.user.id);
          setState({
            user: profile,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        } else if (mounted) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        if (mounted) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    loadSession();

    // Listener para mudanças na sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await authService.getProfile(session.user.id);
          setState({
            user: profile,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await authService.signIn(credentials);
      if (data.session && data.user) {
        const profile = await authService.getProfile(data.user.id);
        setState({
          user: profile,
          session: data.session,
          isLoading: false,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const authData = await authService.signUp(data);
      if (authData.session && authData.user) {
        const profile = await authService.getProfile(authData.user.id);
        setState({
          user: profile,
          session: authData.session,
          isLoading: false,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.session?.user) {
      const profile = await authService.getProfile(state.session.user.id);
      setState((prev) => ({ ...prev, user: profile }));
    }
  }, [state.session]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
