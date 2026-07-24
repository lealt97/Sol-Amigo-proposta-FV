import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CALCULATOR = 'src/pages/propostas/ProfessionalSizingCalculatorView.tsx';
const OVERSIZING_CALCULATION = 'src/lib/calculations/oversizing.ts';

test('calculadora apresenta oversizing após a seleção do kit', async () => {
  const [calculatorSource, calculationSource] = await Promise.all([
    readFile(CALCULATOR, 'utf8'),
    readFile(OVERSIZING_CALCULATION, 'utf8'),
  ]);

  assert.match(calculatorSource, /calculateDcAcOversizing/);
  assert.match(calculatorSource, /selectedKitOversizing/);
  assert.match(calculatorSource, /Relação DC\/AC/);
  assert.match(calculatorSource, /Oversizing/);
  assert.match(calculatorSource, /Potência AC do inversor/);
  assert.match(calculationSource, /datasheet do inversor/);
  assert.match(calculationSource, /faixa MPPT/);
});
