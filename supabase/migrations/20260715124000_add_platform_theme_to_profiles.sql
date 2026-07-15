-- =========================================================
-- Customizacao visual da plataforma por conta
-- =========================================================
-- Armazena a paleta gerada pelo motor de cores em JSONB.
-- O frontend aplica essas cores como variaveis CSS da plataforma.

alter table public.profiles
  add column if not exists platform_theme jsonb;
