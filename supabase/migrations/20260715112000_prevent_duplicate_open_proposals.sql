-- =========================================================
-- Impedir propostas pendentes duplicadas por cliente
-- =========================================================
-- Regra comercial:
-- Um mesmo cliente/usuario so pode ter uma proposta aberta em preenchimento.
-- Depois que a proposta for enviada, visualizada, aprovada, recusada ou tiver PDF,
-- ela deixa de ser considerada aberta e uma nova proposta pode ser iniciada.

create temporary table tmp_duplicate_open_proposals on commit drop as
select id
from (
  select
    id,
    row_number() over (
      partition by user_id, client_id
      order by coalesce(updated_at, created_at) desc, created_at desc, id desc
    ) as row_number_for_client
  from public.proposals
  where status in ('draft', 'pending')
    and pdf_url is null
    and sent_whatsapp_at is null
    and public_viewed_at is null
    and accepted_at is null
    and rejected_at is null
) ranked
where row_number_for_client > 1;

delete from public.proposal_events
where proposal_id in (select id from tmp_duplicate_open_proposals);

delete from public.solar_system_calculations
where proposal_id in (select id from tmp_duplicate_open_proposals);

delete from public.proposal_loads
where proposal_id in (select id from tmp_duplicate_open_proposals);

delete from public.proposals
where id in (select id from tmp_duplicate_open_proposals);

create unique index if not exists proposals_single_open_per_client_idx
  on public.proposals(user_id, client_id)
  where status in ('draft', 'pending')
    and pdf_url is null
    and sent_whatsapp_at is null
    and public_viewed_at is null
    and accepted_at is null
    and rejected_at is null;
