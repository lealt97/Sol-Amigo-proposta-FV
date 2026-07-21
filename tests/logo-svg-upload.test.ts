import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(path, 'utf8');

const FORMAT_SUPPORT = 'src/components/brand/LogoUploadFormatSupport.tsx';
const FIRST_USE_ROUTE = 'src/pages/FirstUseRoute.tsx';
const SETTINGS_ROUTE = 'src/pages/SettingsRoute.tsx';
const PROFILE_SERVICE = 'src/services/profileService.ts';
const STORAGE_MIGRATION = 'supabase/migrations/20260720223000_p1_private_assets_upload_limits.sql';

test('wizard e configurações liberam SVG no seletor de logos', async () => {
  const [support, firstUseRoute, settingsRoute] = await Promise.all([
    read(FORMAT_SUPPORT),
    read(FIRST_USE_ROUTE),
    read(SETTINGS_ROUTE),
  ]);

  assert.match(support, /image\/svg\+xml/);
  assert.match(support, /\.svg/);
  assert.match(support, /PNG, JPG, WebP ou SVG/);
  assert.match(support, /PNG, JPG, WebP e SVG de até 5 MB/);
  assert.match(support, /input\.accept = LOGO_ACCEPT/);
  assert.match(firstUseRoute, /LogoUploadFormatSupport context="first-use"/);
  assert.match(settingsRoute, /LogoUploadFormatSupport context="settings"/);
});

test('serviço valida e envia SVG estático com MIME correto', async () => {
  const service = await read(PROFILE_SERVICE);

  assert.match(service, /\['image\/svg\+xml', 'svg'\]/);
  assert.match(service, /lowerName\.endsWith\('\.svg'\)/);
  assert.match(service, /contentType = isSvg \? 'image\/svg\+xml' : file\.type/);
  assert.match(service, /const source = await file\.text\(\)/);
  assert.match(service, /O arquivo SVG informado não é válido/);
  assert.match(service, /O SVG contém conteúdo ativo não permitido/);
  assert.match(service, /contentType,/);
  assert.match(service, /A logo deve ter no máximo 5 MB/);
});

test('bucket de logos aceita image/svg+xml no servidor', async () => {
  const migration = await read(STORAGE_MIGRATION);

  assert.match(migration, /'logos'[\s\S]*array\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/svg\+xml'\]/);
});
