-- =========================================================
-- Confirmação recente da senha para operações críticas
--
-- A interface já autentica novamente com e-mail e senha antes
-- da exclusão. Esta migration transforma essa confirmação em
-- uma exigência do próprio banco, impedindo chamadas diretas da
-- RPC com uma sessão antiga, por magic link, recovery ou OAuth.
-- =========================================================

begin;

create or replace function public.has_recent_password_confirmation(
  p_max_age_seconds integer default 300
)
returns boolean
language sql
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from jsonb_array_elements(
      case
        when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr'
        else '[]'::jsonb
      end
    ) as authentication_method
    where authentication_method ->> 'method' = 'password'
      and coalesce(authentication_method ->> 'timestamp', '') ~ '^[0-9]+$'
      and (authentication_method ->> 'timestamp')::bigint
        >= extract(epoch from now())::bigint - greatest(coalesce(p_max_age_seconds, 0), 0)
  );
$$;

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not public.has_recent_password_confirmation(300) then
    raise exception 'password_confirmation_required' using errcode = '42501';
  end if;

  delete from auth.users
  where id = auth.uid();
end;
$$;

revoke all on function public.has_recent_password_confirmation(integer)
  from public, anon, authenticated;

revoke all on function public.delete_user_account()
  from public, anon;
grant execute on function public.delete_user_account()
  to authenticated, service_role;

comment on function public.has_recent_password_confirmation(integer) is
  'Confirma que o JWT contém autenticação por senha realizada dentro da janela permitida.';

comment on function public.delete_user_account() is
  'Exclui a própria conta somente após confirmação de senha realizada nos últimos cinco minutos.';

commit;
