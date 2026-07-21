import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const LEGAL_SERVICE = 'src/services/legalService.ts';
const FIRST_USE_SERVICE = 'src/services/firstUseService.ts';
const REGISTER_FORM = 'src/components/auth/RegisterForm.tsx';

test('wizard não fica bloqueado quando as RPCs legais ainda não foram publicadas', async () => {
  const [legalService, firstUseService, registerForm] = await Promise.all([
    readFile(LEGAL_SERVICE, 'utf8'),
    readFile(FIRST_USE_SERVICE, 'utf8'),
    readFile(REGISTER_FORM, 'utf8'),
  ]);

  assert.match(registerForm, /legal_acceptances: REQUIRED_LEGAL_ACCEPTANCES/);
  assert.match(legalService, /buildMetadataStatus/);
  assert.match(legalService, /RPC de status legal indisponível/);
  assert.match(legalService, /return metadataStatus/);
  assert.match(legalService, /persistAcceptanceMetadata/);
  assert.match(legalService, /legal_acceptances: REQUIRED_LEGAL_ACCEPTANCES/);
  assert.match(firstUseService, /legalService\.getMyStatus\(\)/);
});

test('aceite realizado no fallback é sincronizado quando a RPC volta a existir', async () => {
  const legalService = await readFile(LEGAL_SERVICE, 'utf8');

  assert.match(legalService, /await writeDatabaseAcceptances\(\)/);
  assert.match(legalService, /return await readDatabaseStatus\(\)/);
  assert.match(legalService, /Não foi possível sincronizar os aceites legais com o banco/);
});
