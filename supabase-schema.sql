-- Executar no SQL Editor do Supabase

-- Cria a tabela de profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  role TEXT DEFAULT 'owner',
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode visualizar apenas o próprio profile
CREATE POLICY "Usuário pode visualizar apenas o próprio profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuário pode atualizar apenas o próprio profile
CREATE POLICY "Usuário pode atualizar apenas o próprio profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Usuário pode inserir apenas o próprio profile
CREATE POLICY "Usuário pode inserir apenas o próprio profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger para criar o profile automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Cria a tabela de proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  code TEXT,
  title TEXT,
  status TEXT DEFAULT 'draft',
  consumption_source TEXT,
  monthly_consumption_kwh NUMERIC,
  bill_amount NUMERIC,
  energy_tariff NUMERIC,
  kit_cost NUMERIC,
  labor_cost NUMERIC,
  fixed_costs NUMERIC,
  freight_cost NUMERIC,
  taxes NUMERIC,
  commission NUMERIC,
  other_costs NUMERIC,
  margin_percentage NUMERIC,
  discount_percentage NUMERIC,
  total_cost NUMERIC,
  gross_price NUMERIC,
  discount_value NUMERIC,
  final_price NUMERIC,
  estimated_profit NUMERIC,
  real_margin_percentage NUMERIC,
  markup_percentage NUMERIC,
  estimated_daily_consumption NUMERIC,
  pdf_url TEXT,
  public_token TEXT UNIQUE,
  sent_whatsapp_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver apenas suas propostas
CREATE POLICY "Usuário pode ver apenas suas propostas"
  ON public.proposals FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuário pode criar propostas para seus clientes
CREATE POLICY "Usuário pode criar propostas para seus clientes"
  ON public.proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode editar apenas suas propostas
CREATE POLICY "Usuário pode editar apenas suas propostas"
  ON public.proposals FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuário pode excluir apenas suas propostas
CREATE POLICY "Usuário pode excluir apenas suas propostas"
  ON public.proposals FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Cria a tabela de solar_system_calculations
CREATE TABLE public.solar_system_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  cep TEXT,
  hsp NUMERIC,
  panel_power_w NUMERIC,
  yield_factor NUMERIC DEFAULT 0.80,
  generation_target_percent NUMERIC DEFAULT 100,
  oversizing NUMERIC DEFAULT 1.20,
  monthly_consumption_kwh NUMERIC,
  projected_consumption_kwh NUMERIC,
  required_power_kwp NUMERIC,
  panel_count INTEGER,
  installed_power_kwp NUMERIC,
  estimated_monthly_generation_kwh NUMERIC,
  excess_kwh NUMERIC,
  excess_percentage NUMERIC,
  min_inverter_power_kw NUMERIC,
  current_bill_value NUMERIC,
  energy_tariff NUMERIC,
  monthly_savings NUMERIC,
  annual_savings NUMERIC,
  payback_years NUMERIC,
  payback_months INTEGER,
  payback_formatted TEXT,
  return_25_years NUMERIC,
  net_savings_25_years NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.solar_system_calculations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário só pode ver cálculos das próprias propostas
CREATE POLICY "Usuário só pode ver cálculos das próprias propostas"
  ON public.solar_system_calculations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

-- Policy: Usuário só pode criar cálculos para as próprias propostas
CREATE POLICY "Usuário só pode criar cálculos para as próprias propostas"
  ON public.solar_system_calculations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

-- Policy: Usuário só pode atualizar cálculos das próprias propostas
CREATE POLICY "Usuário só pode atualizar cálculos das próprias propostas"
  ON public.solar_system_calculations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

-- Policy: Usuário só pode deletar cálculos das próprias propostas
CREATE POLICY "Usuário só pode deletar cálculos das próprias propostas"
  ON public.solar_system_calculations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

CREATE TRIGGER update_solar_system_calculations_updated_at
  BEFORE UPDATE ON public.solar_system_calculations
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  cep TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  number TEXT,
  neighborhood TEXT,
  complement TEXT,
  avg_consumption_kwh NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver apenas seus clientes
CREATE POLICY "Usuário pode ver apenas seus clientes"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuário pode criar clientes para si mesmo
CREATE POLICY "Usuário pode criar clientes para si mesmo"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode editar apenas seus clientes
CREATE POLICY "Usuário pode editar apenas seus clientes"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuário pode excluir apenas seus clientes
CREATE POLICY "Usuário pode excluir apenas seus clientes"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Cria a tabela de proposal_loads
CREATE TABLE public.proposal_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  power_watts NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  hours_per_day NUMERIC NOT NULL,
  daily_consumption NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.proposal_loads ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver apenas as cargas das próprias propostas
CREATE POLICY "Usuário pode ver apenas as cargas das próprias propostas"
  ON public.proposal_loads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

-- Policy: Usuário pode criar cargas para as próprias propostas
CREATE POLICY "Usuário pode criar cargas para as próprias propostas"
  ON public.proposal_loads FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

-- Policy: Usuário pode editar cargas das próprias propostas
CREATE POLICY "Usuário pode editar cargas das próprias propostas"
  ON public.proposal_loads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

-- Policy: Usuário pode excluir cargas das próprias propostas
CREATE POLICY "Usuário pode excluir cargas das próprias propostas"
  ON public.proposal_loads FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND user_id = auth.uid()));

CREATE TRIGGER update_proposal_loads_updated_at
  BEFORE UPDATE ON public.proposal_loads
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();


-- Cria a tabela de pdf_cover_templates
CREATE TABLE public.pdf_cover_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  svg_file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Cria a tabela de pdf_templates
CREATE TABLE public.pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_template_id UUID REFERENCES public.pdf_cover_templates(id),
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e3a8a',
  accent_color TEXT DEFAULT '#10b981',
  background_color TEXT DEFAULT '#09090b',
  logo_url TEXT,
  cover_photo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilita RLS
ALTER TABLE public.pdf_cover_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para pdf_cover_templates
CREATE POLICY "Templates de capa sao visiveis para todos os usuarios autenticados"
ON public.pdf_cover_templates FOR SELECT TO authenticated USING (true);

-- Políticas para pdf_templates
CREATE POLICY "Usuarios podem ver seus proprios templates de pdf"
ON public.pdf_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem inserir seus proprios templates de pdf"
ON public.pdf_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem atualizar seus proprios templates de pdf"
ON public.pdf_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem deletar seus proprios templates de pdf"
ON public.pdf_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Cria o bucket 'pdf-assets'
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-assets', 'pdf-assets', true) ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket 'pdf-assets'
CREATE POLICY "Leitura pública para pdf-assets" ON storage.objects FOR SELECT USING (bucket_id = 'pdf-assets');
CREATE POLICY "Upload para pdf-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdf-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Atualização para pdf-assets" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'pdf-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Exclusão para pdf-assets" ON storage.objects FOR DELETE USING (bucket_id = 'pdf-assets' AND auth.role() = 'authenticated');

-- Adicionar novos campos em proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS public_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_ip TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_user_agent TEXT;

-- Cria function e rpc para buscar proposta publica
CREATE OR REPLACE FUNCTION public.get_public_proposal(p_token TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proposal json;
BEGIN
  -- Marca como visualizada se ainda nao foi
  UPDATE public.proposals
  SET public_viewed_at = now()
  WHERE public_token = p_token AND public_viewed_at IS NULL;

  SELECT json_build_object(
    'id', p.id,
    'code', p.code,
    'title', p.title,
    'status', p.status,
    'final_price', p.final_price,
    'pdf_url', p.pdf_url,
    'public_token', p.public_token,
    'accepted_at', p.accepted_at,
    'rejected_at', p.rejected_at,
    'rejection_reason', p.rejection_reason,
    'solar', (
       SELECT row_to_json(s)
       FROM public.solar_system_calculations s
       WHERE s.proposal_id = p.id
    ),
    'client', (
       SELECT json_build_object(
         'name', c.name,
         'city', c.city,
         'state', c.state
       )
       FROM public.clients c
       WHERE c.id = p.client_id
    ),
    'company', (
       SELECT json_build_object(
         'name', prof.company_name,
         'logo_url', prof.logo_url
       )
       FROM public.profiles prof
       WHERE prof.id = p.user_id
    )
  ) INTO v_proposal
  FROM public.proposals p
  WHERE p.public_token = p_token;

  RETURN v_proposal;
END;
$$;

-- Cria function e rpc para atualizar status via token publico
CREATE OR REPLACE FUNCTION public.update_public_proposal_status(
  p_token TEXT,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_status = 'accepted' THEN
    UPDATE public.proposals
    SET 
      status = 'accepted',
      accepted_at = now(),
      client_ip = p_ip,
      client_user_agent = p_user_agent
    WHERE public_token = p_token AND status NOT IN ('accepted', 'rejected');
    RETURN FOUND;
  ELSIF p_status = 'rejected' THEN
    UPDATE public.proposals
    SET 
      status = 'rejected',
      rejected_at = now(),
      rejection_reason = p_reason,
      client_ip = p_ip,
      client_user_agent = p_user_agent
    WHERE public_token = p_token AND status NOT IN ('accepted', 'rejected');
    RETURN FOUND;
  END IF;
  
  RETURN false;
END;
$$;

-- Policy para leitura publica por token
CREATE POLICY "Leitura anonima de proposta por token"
ON public.proposals FOR SELECT
USING (public_token IS NOT NULL);

-- Policy para atualizar proposta por token
CREATE POLICY "Atualizacao anonima de proposta por token"
ON public.proposals FOR UPDATE
USING (public_token IS NOT NULL);

-- Cria a tabela de proposal_events
CREATE TABLE public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa RLS
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;

-- Policy: Usuario pode ler eventos das proprias propostas
CREATE POLICY "Usuario pode ler eventos das proprias propostas"
  ON public.proposal_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.user_id = auth.uid()));

-- Policy: Usuario pode inserir eventos nas proprias propostas
CREATE POLICY "Usuario pode inserir eventos nas proprias propostas"
  ON public.proposal_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.user_id = auth.uid()));
  
-- Policy: Anonimo pode inserir eventos (para link publico)
CREATE POLICY "Anonimo pode inserir eventos via link publico"
  ON public.proposal_events FOR INSERT
  WITH CHECK (true); -- Controle feito via backend/RPC ou permitindo geral para insercao apenas


-- Atualiza a tabela profiles com os novos campos
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS document TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS seller_phone TEXT,
ADD COLUMN IF NOT EXISTS seller_email TEXT,
ADD COLUMN IF NOT EXISTS default_margin_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS default_validity_days INTEGER;

-- Criação do bucket 'logos' caso não exista (Nota: em produção deve ser criado via dashboard ou config. Mas colocamos aqui para doc)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

-- Policy para ler logos publicamente
CREATE POLICY "Public Access for logos" ON storage.objects FOR SELECT USING ( bucket_id = 'logos' );
-- Policy para usuários logados inserirem/atualizarem suas logos
CREATE POLICY "Users can upload logos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
CREATE POLICY "Users can update their logos" ON storage.objects FOR UPDATE USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
CREATE POLICY "Users can delete their logos" ON storage.objects FOR DELETE USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
