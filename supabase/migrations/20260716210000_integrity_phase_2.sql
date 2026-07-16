-- =========================================================
-- Fase 2 de integridade de dados
-- - código de proposta gerado atomicamente no banco
-- - revisão otimista para impedir sobrescritas silenciosas
-- - proposta, cálculo solar, cargas e evento salvos em uma transação
-- - um único cálculo solar por proposta
-- =========================================================

begin;

alter table public.proposals
  add column if not exists revision bigint not null default 0;

-- Corrige eventuais códigos repetidos antes de criar a restrição definitiva.
with ranked as (
  select
    id,
    code,
    row_number() over (
      partition by user_id, code
      order by created_at asc, id asc
    ) as rn
  from public.proposals
  where code is not null
)
update public.proposals p
set code = p.code || '-' || left(p.id::text, 8)
from ranked r
where p.id = r.id
  and r.rn > 1;

create unique index if not exists proposals_user_code_unique_idx
  on public.proposals(user_id, code)
  where code is not null;

create table if not exists public.proposal_sequences (
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_year integer not null,
  last_value integer not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, sequence_year)
);

alter table public.proposal_sequences enable row level security;
revoke all on table public.proposal_sequences from anon, authenticated;

-- Inicializa o contador com os códigos já existentes no formato FV-AAAA-0001.
insert into public.proposal_sequences (user_id, sequence_year, last_value)
select
  p.user_id,
  substring(p.code from '^FV-([0-9]{4})-[0-9]+$')::integer as sequence_year,
  max(substring(p.code from '^FV-[0-9]{4}-([0-9]+)$')::integer) as last_value
from public.proposals p
where p.code ~ '^FV-[0-9]{4}-[0-9]+$'
group by p.user_id, substring(p.code from '^FV-([0-9]{4})-[0-9]+$')::integer
on conflict (user_id, sequence_year)
do update set
  last_value = greatest(public.proposal_sequences.last_value, excluded.last_value),
  updated_at = now();

create or replace function public.next_proposal_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_year integer := extract(year from now())::integer;
  v_sequence integer;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  insert into public.proposal_sequences (
    user_id,
    sequence_year,
    last_value,
    updated_at
  ) values (
    v_user_id,
    v_year,
    1,
    now()
  )
  on conflict (user_id, sequence_year)
  do update set
    last_value = public.proposal_sequences.last_value + 1,
    updated_at = now()
  returning last_value into v_sequence;

  return format('FV-%s-%s', v_year, lpad(v_sequence::text, 4, '0'));
end;
$$;

revoke all on function public.next_proposal_code() from public, anon, authenticated;

-- Mantém apenas o cálculo solar mais recente caso existam duplicatas antigas.
with ranked as (
  select
    id,
    row_number() over (
      partition by proposal_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.solar_system_calculations
)
delete from public.solar_system_calculations s
using ranked r
where s.id = r.id
  and r.rn > 1;

create unique index if not exists solar_system_calculations_proposal_unique_idx
  on public.solar_system_calculations(proposal_id);

drop function if exists public.save_proposal_bundle(uuid, bigint, jsonb, jsonb, jsonb, text, text);

create function public.save_proposal_bundle(
  p_proposal_id uuid,
  p_expected_revision bigint,
  p_proposal jsonb,
  p_solar jsonb,
  p_loads jsonb,
  p_event_type text,
  p_event_description text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_client_id uuid;
  v_code text;
  v_proposal public.proposals%rowtype;
  v_current_revision bigint;
  v_load jsonb;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  if p_proposal is null or jsonb_typeof(p_proposal) <> 'object' then
    raise exception 'Dados da proposta inválidos.' using errcode = '22023';
  end if;

  v_client_id := nullif(p_proposal ->> 'client_id', '')::uuid;

  if v_client_id is null or not exists (
    select 1
    from public.clients c
    where c.id = v_client_id
      and c.user_id = v_user_id
  ) then
    raise exception 'Cliente inválido ou não pertence ao usuário.' using errcode = '42501';
  end if;

  if p_proposal_id is null then
    v_code := public.next_proposal_code();

    insert into public.proposals (
      user_id,
      client_id,
      code,
      title,
      status,
      consumption_source,
      history,
      estimated_daily_consumption,
      monthly_consumption_kwh,
      bill_amount,
      energy_tariff,
      system_type,
      battery_capacity_kwh,
      usable_battery_capacity_kwh,
      backup_power_kw,
      autonomy_hours,
      essential_loads_description,
      selected_solar_kit_id,
      solar_kit_snapshot,
      roof_type,
      roof_area_m2,
      roof_image_url,
      module_width_m,
      module_height_m,
      roof_layout_json,
      kit_cost,
      labor_cost,
      fixed_costs,
      freight_cost,
      taxes,
      commission,
      other_costs,
      margin_percentage,
      discount_percentage,
      total_cost,
      gross_price,
      discount_value,
      final_price,
      estimated_profit,
      real_margin_percentage,
      markup_percentage,
      public_token,
      revision
    ) values (
      v_user_id,
      v_client_id,
      v_code,
      coalesce(nullif(p_proposal ->> 'title', ''), 'Nova Proposta'),
      'pending',
      nullif(p_proposal ->> 'consumption_source', ''),
      nullif(p_proposal -> 'history', 'null'::jsonb),
      nullif(p_proposal ->> 'estimated_daily_consumption', '')::numeric,
      nullif(p_proposal ->> 'monthly_consumption_kwh', '')::numeric,
      nullif(p_proposal ->> 'bill_amount', '')::numeric,
      nullif(p_proposal ->> 'energy_tariff', '')::numeric,
      coalesce(nullif(p_proposal ->> 'system_type', ''), 'on_grid'),
      nullif(p_proposal ->> 'battery_capacity_kwh', '')::numeric,
      nullif(p_proposal ->> 'usable_battery_capacity_kwh', '')::numeric,
      nullif(p_proposal ->> 'backup_power_kw', '')::numeric,
      nullif(p_proposal ->> 'autonomy_hours', '')::numeric,
      nullif(p_proposal ->> 'essential_loads_description', ''),
      nullif(p_proposal ->> 'selected_solar_kit_id', '')::uuid,
      nullif(p_proposal -> 'solar_kit_snapshot', 'null'::jsonb),
      nullif(p_proposal ->> 'roof_type', ''),
      nullif(p_proposal ->> 'roof_area_m2', '')::numeric,
      nullif(p_proposal ->> 'roof_image_url', ''),
      nullif(p_proposal ->> 'module_width_m', '')::numeric,
      nullif(p_proposal ->> 'module_height_m', '')::numeric,
      nullif(p_proposal -> 'roof_layout_json', 'null'::jsonb),
      nullif(p_proposal ->> 'kit_cost', '')::numeric,
      nullif(p_proposal ->> 'labor_cost', '')::numeric,
      nullif(p_proposal ->> 'fixed_costs', '')::numeric,
      nullif(p_proposal ->> 'freight_cost', '')::numeric,
      nullif(p_proposal ->> 'taxes', '')::numeric,
      nullif(p_proposal ->> 'commission', '')::numeric,
      nullif(p_proposal ->> 'other_costs', '')::numeric,
      nullif(p_proposal ->> 'margin_percentage', '')::numeric,
      nullif(p_proposal ->> 'discount_percentage', '')::numeric,
      nullif(p_proposal ->> 'total_cost', '')::numeric,
      nullif(p_proposal ->> 'gross_price', '')::numeric,
      nullif(p_proposal ->> 'discount_value', '')::numeric,
      nullif(p_proposal ->> 'final_price', '')::numeric,
      nullif(p_proposal ->> 'estimated_profit', '')::numeric,
      nullif(p_proposal ->> 'real_margin_percentage', '')::numeric,
      nullif(p_proposal ->> 'markup_percentage', '')::numeric,
      replace(gen_random_uuid()::text, '-', ''),
      0
    )
    returning * into v_proposal;
  else
    select p.revision
      into v_current_revision
    from public.proposals p
    where p.id = p_proposal_id
      and p.user_id = v_user_id
    for update;

    if not found then
      raise exception 'Proposta não encontrada.' using errcode = 'P0002';
    end if;

    if p_expected_revision is not null and v_current_revision <> p_expected_revision then
      raise exception 'A proposta foi alterada em outra sessão. Recarregue os dados e tente novamente.'
        using errcode = '40001';
    end if;

    update public.proposals p
    set
      client_id = v_client_id,
      title = case when p_proposal ? 'title' then nullif(p_proposal ->> 'title', '') else p.title end,
      consumption_source = case when p_proposal ? 'consumption_source' then nullif(p_proposal ->> 'consumption_source', '') else p.consumption_source end,
      history = case when p_proposal ? 'history' then nullif(p_proposal -> 'history', 'null'::jsonb) else p.history end,
      estimated_daily_consumption = case when p_proposal ? 'estimated_daily_consumption' then nullif(p_proposal ->> 'estimated_daily_consumption', '')::numeric else p.estimated_daily_consumption end,
      monthly_consumption_kwh = case when p_proposal ? 'monthly_consumption_kwh' then nullif(p_proposal ->> 'monthly_consumption_kwh', '')::numeric else p.monthly_consumption_kwh end,
      bill_amount = case when p_proposal ? 'bill_amount' then nullif(p_proposal ->> 'bill_amount', '')::numeric else p.bill_amount end,
      energy_tariff = case when p_proposal ? 'energy_tariff' then nullif(p_proposal ->> 'energy_tariff', '')::numeric else p.energy_tariff end,
      system_type = case when p_proposal ? 'system_type' then coalesce(nullif(p_proposal ->> 'system_type', ''), 'on_grid') else p.system_type end,
      battery_capacity_kwh = case when p_proposal ? 'battery_capacity_kwh' then nullif(p_proposal ->> 'battery_capacity_kwh', '')::numeric else p.battery_capacity_kwh end,
      usable_battery_capacity_kwh = case when p_proposal ? 'usable_battery_capacity_kwh' then nullif(p_proposal ->> 'usable_battery_capacity_kwh', '')::numeric else p.usable_battery_capacity_kwh end,
      backup_power_kw = case when p_proposal ? 'backup_power_kw' then nullif(p_proposal ->> 'backup_power_kw', '')::numeric else p.backup_power_kw end,
      autonomy_hours = case when p_proposal ? 'autonomy_hours' then nullif(p_proposal ->> 'autonomy_hours', '')::numeric else p.autonomy_hours end,
      essential_loads_description = case when p_proposal ? 'essential_loads_description' then nullif(p_proposal ->> 'essential_loads_description', '') else p.essential_loads_description end,
      selected_solar_kit_id = case when p_proposal ? 'selected_solar_kit_id' then nullif(p_proposal ->> 'selected_solar_kit_id', '')::uuid else p.selected_solar_kit_id end,
      solar_kit_snapshot = case when p_proposal ? 'solar_kit_snapshot' then nullif(p_proposal -> 'solar_kit_snapshot', 'null'::jsonb) else p.solar_kit_snapshot end,
      roof_type = case when p_proposal ? 'roof_type' then nullif(p_proposal ->> 'roof_type', '') else p.roof_type end,
      roof_area_m2 = case when p_proposal ? 'roof_area_m2' then nullif(p_proposal ->> 'roof_area_m2', '')::numeric else p.roof_area_m2 end,
      roof_image_url = case when p_proposal ? 'roof_image_url' then nullif(p_proposal ->> 'roof_image_url', '') else p.roof_image_url end,
      module_width_m = case when p_proposal ? 'module_width_m' then nullif(p_proposal ->> 'module_width_m', '')::numeric else p.module_width_m end,
      module_height_m = case when p_proposal ? 'module_height_m' then nullif(p_proposal ->> 'module_height_m', '')::numeric else p.module_height_m end,
      roof_layout_json = case when p_proposal ? 'roof_layout_json' then nullif(p_proposal -> 'roof_layout_json', 'null'::jsonb) else p.roof_layout_json end,
      kit_cost = case when p_proposal ? 'kit_cost' then nullif(p_proposal ->> 'kit_cost', '')::numeric else p.kit_cost end,
      labor_cost = case when p_proposal ? 'labor_cost' then nullif(p_proposal ->> 'labor_cost', '')::numeric else p.labor_cost end,
      fixed_costs = case when p_proposal ? 'fixed_costs' then nullif(p_proposal ->> 'fixed_costs', '')::numeric else p.fixed_costs end,
      freight_cost = case when p_proposal ? 'freight_cost' then nullif(p_proposal ->> 'freight_cost', '')::numeric else p.freight_cost end,
      taxes = case when p_proposal ? 'taxes' then nullif(p_proposal ->> 'taxes', '')::numeric else p.taxes end,
      commission = case when p_proposal ? 'commission' then nullif(p_proposal ->> 'commission', '')::numeric else p.commission end,
      other_costs = case when p_proposal ? 'other_costs' then nullif(p_proposal ->> 'other_costs', '')::numeric else p.other_costs end,
      margin_percentage = case when p_proposal ? 'margin_percentage' then nullif(p_proposal ->> 'margin_percentage', '')::numeric else p.margin_percentage end,
      discount_percentage = case when p_proposal ? 'discount_percentage' then nullif(p_proposal ->> 'discount_percentage', '')::numeric else p.discount_percentage end,
      total_cost = case when p_proposal ? 'total_cost' then nullif(p_proposal ->> 'total_cost', '')::numeric else p.total_cost end,
      gross_price = case when p_proposal ? 'gross_price' then nullif(p_proposal ->> 'gross_price', '')::numeric else p.gross_price end,
      discount_value = case when p_proposal ? 'discount_value' then nullif(p_proposal ->> 'discount_value', '')::numeric else p.discount_value end,
      final_price = case when p_proposal ? 'final_price' then nullif(p_proposal ->> 'final_price', '')::numeric else p.final_price end,
      estimated_profit = case when p_proposal ? 'estimated_profit' then nullif(p_proposal ->> 'estimated_profit', '')::numeric else p.estimated_profit end,
      real_margin_percentage = case when p_proposal ? 'real_margin_percentage' then nullif(p_proposal ->> 'real_margin_percentage', '')::numeric else p.real_margin_percentage end,
      markup_percentage = case when p_proposal ? 'markup_percentage' then nullif(p_proposal ->> 'markup_percentage', '')::numeric else p.markup_percentage end,
      revision = p.revision + 1
    where p.id = p_proposal_id
      and p.user_id = v_user_id
    returning p.* into v_proposal;
  end if;

  if p_solar is not null and jsonb_typeof(p_solar) = 'object' then
    insert into public.solar_system_calculations (
      proposal_id,
      cep,
      hsp,
      panel_power_w,
      yield_factor,
      generation_target_percent,
      oversizing,
      history,
      monthly_consumption_kwh,
      projected_consumption_kwh,
      required_power_kwp,
      panel_count,
      installed_power_kwp,
      estimated_monthly_generation_kwh,
      excess_kwh,
      excess_percentage,
      min_inverter_power_kw,
      current_bill_value,
      energy_tariff,
      monthly_savings,
      annual_savings,
      payback_years,
      payback_months,
      payback_formatted,
      return_25_years,
      net_savings_25_years
    ) values (
      v_proposal.id,
      nullif(p_solar ->> 'cep', ''),
      nullif(p_solar ->> 'hsp', '')::numeric,
      nullif(p_solar ->> 'panel_power_w', '')::numeric,
      coalesce(nullif(p_solar ->> 'yield_factor', '')::numeric, 0.80),
      coalesce(nullif(p_solar ->> 'generation_target_percent', '')::numeric, 100),
      coalesce(nullif(p_solar ->> 'oversizing', '')::numeric, 1.20),
      nullif(p_solar -> 'history', 'null'::jsonb),
      nullif(p_solar ->> 'monthly_consumption_kwh', '')::numeric,
      nullif(p_solar ->> 'projected_consumption_kwh', '')::numeric,
      nullif(p_solar ->> 'required_power_kwp', '')::numeric,
      nullif(p_solar ->> 'panel_count', '')::integer,
      nullif(p_solar ->> 'installed_power_kwp', '')::numeric,
      nullif(p_solar ->> 'estimated_monthly_generation_kwh', '')::numeric,
      nullif(p_solar ->> 'excess_kwh', '')::numeric,
      nullif(p_solar ->> 'excess_percentage', '')::numeric,
      nullif(p_solar ->> 'min_inverter_power_kw', '')::numeric,
      nullif(p_solar ->> 'current_bill_value', '')::numeric,
      nullif(p_solar ->> 'energy_tariff', '')::numeric,
      nullif(p_solar ->> 'monthly_savings', '')::numeric,
      nullif(p_solar ->> 'annual_savings', '')::numeric,
      nullif(p_solar ->> 'payback_years', '')::numeric,
      nullif(p_solar ->> 'payback_months', '')::integer,
      nullif(p_solar ->> 'payback_formatted', ''),
      nullif(p_solar ->> 'return_25_years', '')::numeric,
      nullif(p_solar ->> 'net_savings_25_years', '')::numeric
    )
    on conflict (proposal_id)
    do update set
      cep = excluded.cep,
      hsp = excluded.hsp,
      panel_power_w = excluded.panel_power_w,
      yield_factor = excluded.yield_factor,
      generation_target_percent = excluded.generation_target_percent,
      oversizing = excluded.oversizing,
      history = excluded.history,
      monthly_consumption_kwh = excluded.monthly_consumption_kwh,
      projected_consumption_kwh = excluded.projected_consumption_kwh,
      required_power_kwp = excluded.required_power_kwp,
      panel_count = excluded.panel_count,
      installed_power_kwp = excluded.installed_power_kwp,
      estimated_monthly_generation_kwh = excluded.estimated_monthly_generation_kwh,
      excess_kwh = excluded.excess_kwh,
      excess_percentage = excluded.excess_percentage,
      min_inverter_power_kw = excluded.min_inverter_power_kw,
      current_bill_value = excluded.current_bill_value,
      energy_tariff = excluded.energy_tariff,
      monthly_savings = excluded.monthly_savings,
      annual_savings = excluded.annual_savings,
      payback_years = excluded.payback_years,
      payback_months = excluded.payback_months,
      payback_formatted = excluded.payback_formatted,
      return_25_years = excluded.return_25_years,
      net_savings_25_years = excluded.net_savings_25_years,
      updated_at = now();
  end if;

  if p_loads is not null then
    if jsonb_typeof(p_loads) <> 'array' then
      raise exception 'Lista de cargas inválida.' using errcode = '22023';
    end if;

    delete from public.proposal_loads
    where proposal_id = v_proposal.id;

    for v_load in
      select value
      from jsonb_array_elements(p_loads)
    loop
      if nullif(trim(v_load ->> 'equipment_name'), '') is not null then
        insert into public.proposal_loads (
          proposal_id,
          equipment_name,
          power_watts,
          quantity,
          hours_per_day,
          daily_consumption
        ) values (
          v_proposal.id,
          left(trim(v_load ->> 'equipment_name'), 300),
          coalesce(nullif(v_load ->> 'power_watts', '')::numeric, 0),
          coalesce(nullif(v_load ->> 'quantity', '')::numeric, 0),
          coalesce(nullif(v_load ->> 'hours_per_day', '')::numeric, 0),
          coalesce(nullif(v_load ->> 'daily_consumption', '')::numeric, 0)
        );
      end if;
    end loop;
  end if;

  if nullif(trim(coalesce(p_event_type, '')), '') is not null then
    insert into public.proposal_events (
      proposal_id,
      user_id,
      event_type,
      description,
      metadata
    ) values (
      v_proposal.id,
      v_user_id,
      left(trim(p_event_type), 100),
      nullif(left(trim(coalesce(p_event_description, '')), 500), ''),
      jsonb_build_object(
        'source', 'save_proposal_bundle',
        'revision', v_proposal.revision
      )
    );
  end if;

  return to_jsonb(v_proposal);
end;
$$;

revoke all on function public.save_proposal_bundle(uuid, bigint, jsonb, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.save_proposal_bundle(uuid, bigint, jsonb, jsonb, jsonb, text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
