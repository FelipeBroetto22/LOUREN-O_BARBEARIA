-- =====================================================
-- Correção de Recursividade Infinita no Supabase
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. Criar uma função segura (bypassa RLS) para ler a própria role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Apagar as políticas antigas que causam o loop infinito
DROP POLICY IF EXISTS "Barbers can view client profiles" ON profiles;
DROP POLICY IF EXISTS "Barbers can insert client stickers" ON album_stickers;

-- 3. Recriar as políticas usando a função segura
CREATE POLICY "Barbers can view client profiles"
  ON profiles FOR SELECT USING (
    get_my_role() = 'barber'
  );

CREATE POLICY "Barbers can insert client stickers"
  ON album_stickers FOR INSERT WITH CHECK (
    get_my_role() = 'barber'
  );
