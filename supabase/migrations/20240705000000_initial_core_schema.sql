-- =========================================================
-- Esquema-base do SaaS SolAmigo
--
-- Esta migration registra as tabelas que existiam no banco antes
-- da adoção do histórico versionado em supabase/migrations.
-- Ela permite reconstruir o projeto do zero em homologação/local.
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- Perfis e empresa
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  company_name text not null,
  phone text,
  logo_url text,
  role text default 'owner',
  mfa_enabled boolean default false,
  document text,
  company_email text,
  website text,
  cep text,
  address text,
  city text,
  state text,
  seller_name text,
  seller_phone text,
  seller_email text,
  default_margin_percentage numeric,
  default_validity_days integer,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Clientes
-- =========================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  document text,
  email text,
  phone text,
  cep text,
  city text,
  state text,
  address text,
  number text,
  neighborhood text,
  complement text,
  avg_consumption_kwh numeric,
  notes text,
  status text default 'active',
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Propostas: estrutura original antes das migrations evolutivas
-- =========================================================
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text,
  status text default 'draft',
  consumption_source text,
  monthly_consumption_kwh numeric,
  bill_amount numeric,
  energy_tariff numeric,
  kit_cost numeric,
  labor_cost numeric,
  fixed_costs numeric,
  freight_cost numeric,
  taxes numeric,
  commission numeric,
  other_costs numeric,
  margin_percentage numeric,
  discount_percentage numeric,
  total_cost numeric,
  gross_price numeric,
  discount_value numeric,
  final_price numeric,
  estimated_profit numeric,
  real_margin_percentage numeric,
  markup_percentage numeric,
  estimated_daily_consumption numeric,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Levantamento de cargas
-- =========================================================
create table if not exists public.proposal_loads (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  equipment_name text not null,
  power_watts numeric not null,
  quantity numeric not null,
  hours_per_day numeric not null,
  daily_consumption numeric not null,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Cálculo solar e financeiro
-- =========================================================
create table if not exists public.solar_system_calculations (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  cep text,
  hsp numeric,
  panel_power_w numeric,
  yield_factor numeric default 0.80,
  generation_target_percent numeric default 100,
  oversizing numeric default 1.20,
  monthly_consumption_kwh numeric,
  projected_consumption_kwh numeric,
  required_power_kwp numeric,
  panel_count integer,
  installed_power_kwp numeric,
  estimated_monthly_generation_kwh numeric,
  excess_kwh numeric,
  excess_percentage numeric,
  min_inverter_power_kw numeric,
  current_bill_value numeric,
  energy_tariff numeric,
  monthly_savings numeric,
  annual_savings numeric,
  payback_years numeric,
  payback_months integer,
  payback_formatted text,
  return_25_years numeric,
  net_savings_25_years numeric,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Histórico de eventos da proposta
-- =========================================================
create table if not exists public.proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Templates PDF legados usados pelo módulo Design PDF
-- =========================================================
create table if not exists public.pdf_cover_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  svg_file_url text not null,
  thumbnail_url text,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.pdf_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cover_template_id uuid references public.pdf_cover_templates(id),
  primary_color text default '#3b82f6',
  secondary_color text default '#1e3a8a',
  accent_color text default '#10b981',
  background_color text default '#09090b',
  logo_url text,
  cover_photo_url text,
  is_default boolean default false,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- =========================================================
-- Gatilhos compartilhados
-- =========================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, company_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists update_clients_updated_at on public.clients;
create trigger update_clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

drop trigger if exists update_proposals_updated_at on public.proposals;
create trigger update_proposals_updated_at
  before update on public.proposals
  for each row execute function public.handle_updated_at();

drop trigger if exists update_proposal_loads_updated_at on public.proposal_loads;
create trigger update_proposal_loads_updated_at
  before update on public.proposal_loads
  for each row execute function public.handle_updated_at();

drop trigger if exists update_solar_system_calculations_updated_at on public.solar_system_calculations;
create trigger update_solar_system_calculations_updated_at
  before update on public.solar_system_calculations
  for each row execute function public.handle_updated_at();

-- =========================================================
-- RLS do esquema-base
-- =========================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_loads enable row level security;
alter table public.solar_system_calculations enable row level security;
alter table public.proposal_events enable row level security;
alter table public.pdf_cover_templates enable row level security;
alter table public.pdf_templates enable row level security;

create policy "Usuário pode visualizar apenas o próprio profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário pode inserir apenas o próprio profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuário pode atualizar apenas o próprio profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuário pode ver apenas seus clientes"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Usuário pode criar clientes para si mesmo"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Usuário pode editar apenas seus clientes"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Usuário pode excluir apenas seus clientes"
  on public.clients for delete
  using (auth.uid() = user_id);

create policy "Usuário pode ver apenas suas propostas"
  on public.proposals for select
  using (auth.uid() = user_id);

create policy "Usuário pode criar propostas para seus clientes"
  on public.proposals for insert
  with check (auth.uid() = user_id);

create policy "Usuário pode editar apenas suas propostas"
  on public.proposals for update
  using (auth.uid() = user_id);

create policy "Usuário pode excluir apenas suas propostas"
  on public.proposals for delete
  using (auth.uid() = user_id);

create policy "Usuário pode ver apenas as cargas das próprias propostas"
  on public.proposal_loads for select
  using (exists (
    select 1 from public.proposals
    where proposals.id = proposal_loads.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário pode criar cargas para as próprias propostas"
  on public.proposal_loads for insert
  with check (exists (
    select 1 from public.proposals
    where proposals.id = proposal_loads.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário pode editar cargas das próprias propostas"
  on public.proposal_loads for update
  using (exists (
    select 1 from public.proposals
    where proposals.id = proposal_loads.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário pode excluir cargas das próprias propostas"
  on public.proposal_loads for delete
  using (exists (
    select 1 from public.proposals
    where proposals.id = proposal_loads.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário só pode ver cálculos das próprias propostas"
  on public.solar_system_calculations for select
  using (exists (
    select 1 from public.proposals
    where proposals.id = solar_system_calculations.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário só pode criar cálculos para as próprias propostas"
  on public.solar_system_calculations for insert
  with check (exists (
    select 1 from public.proposals
    where proposals.id = solar_system_calculations.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário só pode atualizar cálculos das próprias propostas"
  on public.solar_system_calculations for update
  using (exists (
    select 1 from public.proposals
    where proposals.id = solar_system_calculations.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuário só pode deletar cálculos das próprias propostas"
  on public.solar_system_calculations for delete
  using (exists (
    select 1 from public.proposals
    where proposals.id = solar_system_calculations.proposal_id
      and proposals.user_id = auth.uid()
  ));

create policy "Usuario pode ler eventos das proprias propostas"
  on public.proposal_events for select
  using (exists (
    select 1 from public.proposals p
    where p.id = proposal_events.proposal_id
      and p.user_id = auth.uid()
  ));

create policy "Usuario pode inserir eventos nas proprias propostas"
  on public.proposal_events for insert
  with check (exists (
    select 1 from public.proposals p
    where p.id = proposal_events.proposal_id
      and p.user_id = auth.uid()
  ));

create policy "Templates de capa sao visiveis para todos os usuarios autentica"
  on public.pdf_cover_templates for select
  to authenticated
  using (true);

create policy "Usuarios podem ver seus proprios templates de pdf"
  on public.pdf_templates for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios podem inserir seus proprios templates de pdf"
  on public.pdf_templates for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios podem atualizar seus proprios templates de pdf"
  on public.pdf_templates for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios podem deletar seus proprios templates de pdf"
  on public.pdf_templates for delete
  to authenticated
  using (auth.uid() = user_id);

-- Privilégios explícitos para o cliente autenticado; a RLS continua sendo a barreira.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.proposals to authenticated;
grant select, insert, update, delete on public.proposal_loads to authenticated;
grant select, insert, update, delete on public.solar_system_calculations to authenticated;
grant select, insert on public.proposal_events to authenticated;
grant select on public.pdf_cover_templates to authenticated;
grant select, insert, update, delete on public.pdf_templates to authenticated;
