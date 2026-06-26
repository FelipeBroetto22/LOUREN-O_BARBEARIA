-- =====================================================
-- Lourenço Barbearia — Supabase Database Schema
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- Tabela de perfis de usuário (extensão do auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de serviços disponíveis
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela do álbum de memórias (figurinhas)
CREATE TABLE IF NOT EXISTS album_stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  sticker_number INTEGER NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) — cada usuário só vê seus dados
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_stickers ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário pode ver/editar apenas seu perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Bookings: usuário pode ver/criar/atualizar seus agendamentos
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Album Stickers: usuário pode ver/criar/deletar suas figurinhas
CREATE POLICY "Users can view own stickers"
  ON album_stickers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stickers"
  ON album_stickers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stickers"
  ON album_stickers FOR DELETE USING (auth.uid() = user_id);

-- Services: leitura pública (todos podem ver serviços)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- Dados iniciais de serviços
-- =====================================================

INSERT INTO services (name, description, price, duration_minutes) VALUES
  ('Corte Tradicional', 'Corte clássico com máquina e tesoura', 45.00, 30),
  ('Barba', 'Barba completa com toalha quente e navalha', 35.00, 20),
  ('Corte + Barba', 'Combo completo premium', 70.00, 50),
  ('Degradê', 'Degradê preciso com acabamento profissional', 55.00, 40),
  ('Pigmentação', 'Pigmentação capilar ou de barba', 60.00, 45),
  ('Sobrancelha', 'Design de sobrancelha masculina', 20.00, 15);

-- =====================================================
-- Índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_album_stickers_user_id ON album_stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_album_stickers_number ON album_stickers(user_id, sticker_number);
