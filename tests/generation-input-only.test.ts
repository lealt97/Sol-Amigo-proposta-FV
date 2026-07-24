import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CALCULATOR_VIEW = 'src/pages/propostas/ProfessionalSizingCalculatorView.tsx';

test('a etapa de geração adicional exibe somente o input digitável', async () => {
  const calculator = await readFile(CALCULATOR_VIEW, 'utf8');

  assert.match(calculator, /label="Geração adicional desejada"/);
  assert.match(
    calculator,
    /O percentual é aplicado sobre o consumo compensável\. Use 0% quando o cliente não solicitar geração adicional\./,
  );
  assert.doesNotMatch(calculator, /\[0, 10, 20, 30\]/);
  assert.doesNotMatch(calculator, /setGenerationIncreasePercent\(String\(percentage\)\)/);
});

test('o resumo exibe a energia diária entre HSP e potência necessária', async () => {
  const calculator = await readFile(CALCULATOR_VIEW, 'utf8');

  assert.match(calculator, /label="Energia de geração"/);
  assert.match(calculator, /result\.targetDailyGenerationKwh\.toLocaleString/);
  assert.match(
    calculator,
    /label="HSP"[\s\S]*label="Energia de geração"[\s\S]*label="Potência necessária"/,
  );
});

test('o resumo identifica dinamicamente o tipo de ligação na disponibilidade', async () => {
  const calculator = await readFile(CALCULATOR_VIEW, 'utf8');

  assert.match(calculator, /const CONNECTION_TYPE_LABELS: Record<ConnectionType, string>/);
  assert.match(calculator, /monophase: 'Monofásica'/);
  assert.match(calculator, /biphase: 'Bifásica'/);
  assert.match(calculator, /triphase: 'Trifásica'/);
  assert.match(calculator, /connectionTypeLabel: CONNECTION_TYPE_LABELS\[connectionType\]/);
  assert.match(
    calculator,
    /value={`\$\{consumptionPreview\.connectionTypeLabel\} — \$\{consumptionPreview\.availabilityConsumptionKwh\} kWh`}/,
  );
});
