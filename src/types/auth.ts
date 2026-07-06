/**
 * Tipos de autenticação
 */
export type UserRole = 'client' | 'barber';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
