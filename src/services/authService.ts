/**
 * Auth Service — Funções de autenticação com Supabase
 */
import { supabase } from '../config/supabase';
import type { LoginCredentials, RegisterData, UserProfile } from '../types/auth';

/** Login com email e senha */
export async function signIn({ email, password }: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/** Registro de novo usuário */
export async function signUp({ email, password, full_name, phone }: RegisterData) {
  // 1. Criar conta no auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Falha ao criar conta');

  // 2. Criar perfil na tabela profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name,
      phone: phone || null,
    });

  if (profileError) throw profileError;

  return authData;
}

/** Logout */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Obter perfil do usuário atual */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/** Atualizar perfil */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle(); // Evita erro 406 (PGRST116) se retornar 0 linhas

  if (error) throw error;

  // Se não atualizou nada, o perfil não existe na tabela 'profiles'. Vamos criá-lo.
  if (!data) {
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: updates.full_name || 'Usuário Sem Nome',
        ...updates,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return insertData;
  }

  return data;
}

/** Obter sessão atual */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** Solicitar redefinição de senha por email */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
