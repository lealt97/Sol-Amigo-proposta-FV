from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    content = file_path.read_text(encoding='utf-8')
    if old not in content:
        raise SystemExit(f'Trecho não encontrado em {path}: {old[:100]!r}')
    file_path.write_text(content.replace(old, new, 1), encoding='utf-8')


Path('supabase/migrations/20260720003000_profile_avatar.sql').write_text("""begin;

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'URL pública da foto de perfil exibida no avatar da navegação.';

commit;
""", encoding='utf-8')

Path('supabase/tests/profile_avatar.sql').write_text(r"""\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not coalesce(condition, false) then
    raise exception 'Profile avatar test failed: %', message;
  end if;
end;
$$;

insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  'c1000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'avatar-owner@solamigo.test', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Avatar Owner"}'::jsonb, now(), now()
),
(
  'c1000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'avatar-other@solamigo.test', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Avatar Other"}'::jsonb, now(), now()
);

select pg_temp.assert_true(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_url'
      and data_type = 'text'
  ),
  'a coluna avatar_url não existe em profiles'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',
  true
);
set local role authenticated;

update public.profiles
set avatar_url = 'https://example.invalid/storage/v1/object/public/logos/c1000000-0000-4000-8000-000000000001/avatars/profile.webp'
where id = 'c1000000-0000-4000-8000-000000000001';

update public.profiles
set avatar_url = 'https://example.invalid/unauthorized.webp'
where id = 'c1000000-0000-4000-8000-000000000002';

select pg_temp.assert_true(
  (select avatar_url like '%/c1000000-0000-4000-8000-000000000001/avatars/%'
   from public.profiles
   where id = 'c1000000-0000-4000-8000-000000000001'),
  'o usuário não conseguiu salvar a própria foto'
);

reset role;

select pg_temp.assert_true(
  (select avatar_url is null
   from public.profiles
   where id = 'c1000000-0000-4000-8000-000000000002'),
  'um usuário alterou a foto de outra conta'
);

rollback;

select 'Profile avatar test passed' as result;
""", encoding='utf-8')

replace_once(
    '.github/workflows/migrations-homologation.yml',
    "      - name: Testar confirmação de senha em operações críticas\n        shell: bash",
    "      - name: Testar foto de perfil\n        shell: bash\n        run: |\n          set -euo pipefail\n          psql \"postgresql://postgres:postgres@127.0.0.1:54322/postgres\" \\\n            -v ON_ERROR_STOP=1 \\\n            -f supabase/tests/profile_avatar.sql \\\n            2>&1 | tee migration-report/profile-avatar.txt\n\n      - name: Testar confirmação de senha em operações críticas\n        shell: bash",
)

Path('tests/profile-avatar.test.ts').write_text("""import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const SETTINGS_PATH = 'src/pages/Configuracoes.tsx';
const LAYOUT_PATH = 'src/components/Layout.tsx';
const SERVICE_PATH = 'src/services/profileService.ts';
const PROFILE_PATH = 'src/types/profile.ts';
const MIGRATION_PATH = 'supabase/migrations/20260720003000_profile_avatar.sql';
const SQL_TEST_PATH = 'supabase/tests/profile_avatar.sql';
const WORKFLOW_PATH = '.github/workflows/migrations-homologation.yml';

test('perfil e migration possuem avatar_url', async () => {
  const [profile, migration] = await Promise.all([
    readFile(PROFILE_PATH, 'utf8'),
    readFile(MIGRATION_PATH, 'utf8'),
  ]);

  assert.match(profile, /avatar_url: string \\| null/);
  assert.match(migration, /add column if not exists avatar_url text/);
});

test('upload aceita somente imagens seguras e limita a dois megabytes', async () => {
  const service = await readFile(SERVICE_PATH, 'utf8');

  assert.match(service, /PROFILE_AVATAR_MAX_BYTES = 2 \\* 1024 \\* 1024/);
  assert.match(service, /'image\\/jpeg'/);
  assert.match(service, /'image\\/png'/);
  assert.match(service, /'image\\/webp'/);
  assert.doesNotMatch(service, /PROFILE_AVATAR_TYPES[\\s\\S]*image\\/svg\\+xml/);
  assert.match(service, /`\\$\\{userId\\}\\/avatars\\/profile-\\$\\{Date\\.now\\(\\)\\}/);
  assert.match(service, /path\\.startsWith\\(`\\$\\{userId\\}\\/avatars\\/`\\)/);
});

test('dados do usuário oferecem inclusão, troca e remoção da foto', async () => {
  const settings = await readFile(SETTINGS_PATH, 'utf8');

  assert.match(settings, /id="profile-avatar-upload"/);
  assert.match(settings, /accept="image\\/png,image\\/jpeg,image\\/webp"/);
  assert.match(settings, /handleAvatarUpload/);
  assert.match(settings, /handleRemoveAvatar/);
  assert.match(settings, /solamigo:profile-updated/);
  assert.match(settings, /A foto será exibida no avatar do menu lateral do SaaS/);
  assert.doesNotMatch(settings, />SolAmigo Pro<\\/h3>/);
});

test('navbar exibe a foto e mantém a inicial como fallback', async () => {
  const layout = await readFile(LAYOUT_PATH, 'utf8');

  assert.match(layout, /profileService\\.getProfile\\(user\\.id\\)/);
  assert.match(layout, /solamigo:profile-updated/);
  assert.match(layout, /avatarUrl && !avatarLoadFailed/);
  assert.match(layout, /object-cover/);
  assert.match(layout, /onError=\\{\\(\\) => setAvatarLoadFailed\\(true\\)\\}/);
  assert.match(layout, /displayName\\.charAt\\(0\\)/);
});

test('homologação valida coluna e isolamento da foto de perfil', async () => {
  const [sqlTest, workflow] = await Promise.all([
    readFile(SQL_TEST_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
  ]);

  assert.match(sqlTest, /um usuário alterou a foto de outra conta/);
  assert.match(sqlTest, /a coluna avatar_url não existe em profiles/);
  assert.match(workflow, /Testar foto de perfil/);
  assert.match(workflow, /profile_avatar\\.sql/);
});
""", encoding='utf-8')
