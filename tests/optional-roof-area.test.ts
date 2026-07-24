import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CALCULATOR = 'src/pages/propostas/ProfessionalSizingCalculatorView.tsx';

test('área do telhado é opcional e continua validada quando preenchida', async () => {
  const source = await readFile(CALCULATOR, 'utf8');

  assert.match(source, /Área do telhado \(opcional\)/);
  assert.match(source, /if \(roofAreaM2\.trim\(\)\)/);
  assert.match(source, /Quando informada, a área do telhado deve ser maior que zero/);
  assert.match(source, /if \(!roofAreaM2\.trim\(\)\) \{\s*return \{ result: null, error: null \};/);
  assert.doesNotMatch(source, /\{ value: parseNumber\(roofAreaM2\), message: 'Informe a área do telhado em metros quadrados\.' \}/);
});
