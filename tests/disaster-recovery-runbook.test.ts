import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const RUNBOOK_PATH = 'docs/DISASTER_RECOVERY_RUNBOOK.md';
const CHECKLIST_PATH = 'docs/PROJECT_COMPLETION_CHECKLIST.md';
const README_PATH = 'README.md';

test('runbook define objetivos, ativação e responsáveis', async () => {
  const runbook = await readFile(RUNBOOK_PATH, 'utf8');

  assert.match(runbook, /RPO inicial:\*\* até 24 horas/);
  assert.match(runbook, /RTO inicial:\*\* até 8 horas/);
  assert.match(runbook, /Situações que ativam este runbook/);
  assert.match(runbook, /Coordenador do incidente/);
  assert.match(runbook, /A primeira restauração deve ocorrer em ambiente isolado/);
});

test('runbook cobre banco, Auth, Storage, Edge Function e Railway', async () => {
  const runbook = await readFile(RUNBOOK_PATH, 'utf8');

  for (const requirement of [
    'supabase db dump',
    'roles.sql',
    'schema.sql',
    'data.sql',
    'supabase_migrations',
    'proposals',
    'pdf-assets',
    'logos',
    'storage-sha256.txt',
    'public-proposal-pdf',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'GET /health',
  ]) {
    assert.ok(runbook.includes(requirement), `runbook deve conter ${requirement}`);
  }

  assert.match(runbook, /Uma restauração do banco não recupera bytes removidos do Storage/);
  assert.match(runbook, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(runbook, /Nunca coloque a `service_role` no Railway/);
});

test('runbook contém salvaguardas contra ações destrutivas e vazamento de segredos', async () => {
  const runbook = await readFile(RUNBOOK_PATH, 'utf8');

  assert.match(runbook, /Não use `--delete`/);
  assert.match(runbook, /nunca imprima segredos nos logs/i);
  assert.match(runbook, /Não apague o ambiente afetado antes de preservar/);
  assert.match(runbook, /Não destrua o ambiente anterior no mesmo dia do cutover/);
  assert.doesNotMatch(runbook, /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(runbook, /postgresql:\/\/[^.\s]+:[^.<\s]+@(?:db|aws-0)/);
});

test('runbook exige validação técnica e exercício periódico', async () => {
  const runbook = await readFile(RUNBOOK_PATH, 'utf8');

  assert.match(runbook, /Validação obrigatória antes do retorno/);
  assert.match(runbook, /usuário A não acessa dados do usuário B/);
  assert.match(runbook, /PDF privado abre por URL assinada/);
  assert.match(runbook, /O retorno ao ar exige aprovação explícita/);
  assert.match(runbook, /Exercício mensal/);
  assert.match(runbook, /medir RPO e RTO reais/);
});

test('checklist e README registram o procedimento concluído', async () => {
  const [checklist, readme] = await Promise.all([
    readFile(CHECKLIST_PATH, 'utf8'),
    readFile(README_PATH, 'utf8'),
  ]);

  assert.match(checklist, /- \[x\] Criar procedimento documentado de recuperação de desastre/);
  assert.match(checklist, /Evidência do procedimento de recuperação de desastre:/);
  assert.match(readme, /docs\/DISASTER_RECOVERY_RUNBOOK\.md/);
});
