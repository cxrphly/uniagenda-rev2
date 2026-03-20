// ============================================================
// UniAgenda — Supabase Client
// Design: Fresh Academic (Contemporary Academic)
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('seu-projeto'));
}

// Create a mock client that does nothing when not configured
function createMockClient(): SupabaseClient {
  const mockQuery: any = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    upsert: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    in: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (v: any) => void) => resolve({ data: null, error: null }),
  };

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (_event: any, _cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (_table: string) => mockQuery,
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createMockClient();

// ============================================================
// SQL Schema para Supabase (execute no SQL Editor do Supabase)
// ============================================================
export const SUPABASE_SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nome TEXT,
  avatar_url TEXT,
  notificacoes_ativas BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nome')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DISCIPLINAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disciplinas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  professor TEXT NOT NULL DEFAULT '',
  local TEXT NOT NULL DEFAULT '',
  cor TEXT NOT NULL DEFAULT '#6366F1',
  faltas INTEGER NOT NULL DEFAULT 0,
  max_faltas INTEGER DEFAULT 15,
  codigo TEXT DEFAULT '',
  carga_horaria INTEGER DEFAULT 60,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own disciplinas" ON public.disciplinas USING (auth.uid() = user_id);

-- ============================================================
-- HORARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.horarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  local TEXT DEFAULT '',
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own horarios" ON public.horarios USING (auth.uid() = user_id);

-- ============================================================
-- ANOTACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anotacoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL DEFAULT '',
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  cor TEXT NOT NULL DEFAULT '#6366F1',
  tags TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own anotacoes" ON public.anotacoes USING (auth.uid() = user_id);

-- ============================================================
-- TAREFAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','urgente')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida')),
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  prazo TIMESTAMPTZ DEFAULT NULL,
  lembrete BOOLEAN DEFAULT false,
  lembrete_minutos INTEGER DEFAULT 30,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tarefas" ON public.tarefas USING (auth.uid() = user_id);

-- ============================================================
-- EVENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'outro' CHECK (tipo IN ('prova','trabalho','apresentacao','outro')),
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora TEXT DEFAULT NULL,
  descricao TEXT DEFAULT '',
  lembrete BOOLEAN DEFAULT false,
  lembrete_minutos INTEGER DEFAULT 60,
  concluido BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own eventos" ON public.eventos USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_horarios_updated_at BEFORE UPDATE ON public.horarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_anotacoes_updated_at BEFORE UPDATE ON public.anotacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
`;
