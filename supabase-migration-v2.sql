-- =====================================================
-- Lourenço Barbearia — MIGRAÇÃO v2
-- Execute ESTE arquivo no Supabase Dashboard > SQL Editor
-- (Compatível com quem já tem o schema v1)
-- =====================================================

-- 1. Adicionar campo role na tabela profiles (se não existir)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'client'
    CHECK (role IN ('client', 'barber'));
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Coluna role já existe em profiles, ignorando.';
END $$;

-- 2. Criar tabela barbers (barbeiros)
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adicionar barber_id na tabela bookings (se não existir)
DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN barber_id UUID REFERENCES profiles(id);
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Coluna barber_id já existe em bookings, ignorando.';
END $$;

-- 4. Criar tabela de slots bloqueados pelo barbeiro
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS nas novas tabelas
-- =====================================================

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Novas políticas em profiles (apenas as que não existem)
-- =====================================================

DO $$ BEGIN
  CREATE POLICY "Barbers can view client profiles"
    ON profiles FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'barber')
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy "Barbers can view client profiles" já existe, ignorando.';
END $$;

-- =====================================================
-- Políticas para tabela barbers
-- =====================================================

DO $$ BEGIN
  CREATE POLICY "Anyone can view active barbers"
    ON barbers FOR SELECT USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Barbers can update own data"
    ON barbers FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- Novas políticas em bookings
-- =====================================================

-- Barbeiro vê todos os agendamentos onde é o responsável
DO $$ BEGIN
  CREATE POLICY "Barbers can view their bookings"
    ON bookings FOR SELECT USING (auth.uid() = barber_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Barbeiro pode atualizar seus agendamentos (remarcar, concluir, cancelar)
DO $$ BEGIN
  CREATE POLICY "Barbers can update their bookings"
    ON bookings FOR UPDATE USING (auth.uid() = barber_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- Novas políticas em album_stickers
-- =====================================================

-- Barbeiro pode ver o álbum de clientes que atendeu
DO $$ BEGIN
  CREATE POLICY "Barbers can view client stickers"
    ON album_stickers FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = album_stickers.booking_id
          AND b.barber_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Barbeiro pode adicionar figurinha para o cliente (pós-corte)
DO $$ BEGIN
  CREATE POLICY "Barbers can insert client stickers"
    ON album_stickers FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'barber'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- Políticas para blocked_slots
-- =====================================================

DO $$ BEGIN
  CREATE POLICY "Barbers can manage own blocked slots"
    ON blocked_slots FOR ALL USING (auth.uid() = barber_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Clients can view blocked slots"
    ON blocked_slots FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- Índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_barber_id ON blocked_slots(barber_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_blocked_at ON blocked_slots(barber_id, blocked_at);
CREATE INDEX IF NOT EXISTS idx_album_stickers_user_id ON album_stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_album_stickers_number ON album_stickers(user_id, sticker_number);

-- =====================================================
-- PRONTO! Para criar um barbeiro após executar esta migração:
--
-- 1. Registre o usuário normalmente no app
-- 2. Copie o UUID do usuário em: Auth > Users
-- 3. Execute os 2 comandos abaixo substituindo UUID_DO_BARBEIRO:
--
-- UPDATE profiles SET role = 'barber' WHERE id = 'UUID_DO_BARBEIRO';
-- INSERT INTO barbers (id, display_name, specialty, bio)
--   VALUES ('UUID_DO_BARBEIRO', 'Nome do Barbeiro', 'Degradê & Barba', 'Bio aqui');
-- =====================================================
