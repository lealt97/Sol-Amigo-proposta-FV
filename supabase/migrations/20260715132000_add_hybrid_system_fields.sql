-- =========================================================
-- Sistemas fotovoltaicos hibridos/off-grid
-- =========================================================
-- Permite cadastrar kits com bateria e guardar dados comerciais
-- de backup/autonomia na proposta.

alter table public.solar_kits
  add column if not exists system_type text not null default 'on_grid' check (system_type in ('on_grid', 'hybrid', 'off_grid')),
  add column if not exists battery_brand text,
  add column if not exists battery_model text,
  add column if not exists battery_capacity_kwh numeric,
  add column if not exists usable_battery_capacity_kwh numeric,
  add column if not exists battery_quantity numeric,
  add column if not exists backup_power_kw numeric,
  add column if not exists autonomy_hours numeric,
  add column if not exists essential_loads_description text;

alter table public.proposals
  add column if not exists system_type text default 'on_grid' check (system_type in ('on_grid', 'hybrid', 'off_grid')),
  add column if not exists battery_capacity_kwh numeric,
  add column if not exists usable_battery_capacity_kwh numeric,
  add column if not exists backup_power_kw numeric,
  add column if not exists autonomy_hours numeric,
  add column if not exists essential_loads_description text;

create index if not exists solar_kits_user_system_type_idx
  on public.solar_kits(user_id, system_type, active);
