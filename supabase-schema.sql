-- =====================================================
-- Lourenço Barbearia — Supabase Database Schema v2
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- Tabela de perfis de usuário (extensão do auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'barber')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de barbeiros (dados extras dos profissionais)
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
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
  barber_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de slots bloqueados pelo barbeiro (férias, ausências, etc.)
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
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
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- --- Profiles ---
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Barbers can view client profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'barber')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- --- Barbers (leitura pública para clientes escolherem barbeiro) ---
CREATE POLICY "Anyone can view active barbers"
  ON barbers FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Barbers can update own data"
  ON barbers FOR UPDATE USING (auth.uid() = id);

-- --- Bookings ---
-- Cliente vê seus próprios agendamentos
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (auth.uid() = user_id);

-- Barbeiro vê todos os agendamentos onde é o responsável
CREATE POLICY "Barbers can view their bookings"
  ON bookings FOR SELECT USING (auth.uid() = barber_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cliente pode cancelar seus agendamentos
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Barbeiro pode atualizar seus agendamentos (remarcar, concluir, cancelar)
CREATE POLICY "Barbers can update their bookings"
  ON bookings FOR UPDATE USING (auth.uid() = barber_id);

-- --- Album Stickers ---
CREATE POLICY "Users can view own stickers"
  ON album_stickers FOR SELECT USING (auth.uid() = user_id);

-- Barbeiro pode ver o álbum de clientes que atendeu
CREATE POLICY "Barbers can view client stickers"
  ON album_stickers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = album_stickers.booking_id
        AND b.barber_id = auth.uid()
    )
  );

-- Barbeiro pode adicionar figurinha para o cliente (pós-corte)
CREATE POLICY "Barbers can insert client stickers"
  ON album_stickers FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'barber'
    )
  );

CREATE POLICY "Users can create own stickers"
  ON album_stickers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stickers"
  ON album_stickers FOR DELETE USING (auth.uid() = user_id);

-- --- Blocked Slots ---
CREATE POLICY "Barbers can manage own blocked slots"
  ON blocked_slots FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Clients can view blocked slots"
  ON blocked_slots FOR SELECT USING (auth.uid() IS NOT NULL);

-- --- Services (leitura pública) ---
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
  ('Sobrancelha', 'Design de sobrancelha masculina', 20.00, 15)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Para criar um barbeiro (execute no SQL Editor):
-- 1. Registre o email normalmente no app (ele vai criar o profile como 'client')
-- 2. Execute os comandos abaixo com o UUID do usuário:
--
-- UPDATE profiles SET role = 'barber' WHERE id = 'UUID_DO_BARBEIRO';
-- INSERT INTO barbers (id, display_name, specialty, bio)
--   VALUES ('UUID_DO_BARBEIRO', 'Nome do Barbeiro', 'Degradê & Barba', 'Bio aqui');
-- =====================================================

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
