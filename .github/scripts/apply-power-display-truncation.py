from pathlib import Path

repo = Path('.')
formatter_path = repo / 'src/lib/formatters/technicalNumber.ts'
calculator_path = repo / 'src/pages/propostas/ProfessionalSizingCalculatorView.tsx'
test_path = repo / 'tests/power-display-truncation.test.ts'

formatter = formatter_path.read_text(encoding='utf-8')

if 'formatTruncated(value: number' not in formatter:
    formatter = formatter.replace(
        "const largeNumber = new Intl.NumberFormat('pt-BR', {\n  maximumFractionDigits: 0,\n});\n",
        "const largeNumber = new Intl.NumberFormat('pt-BR', {\n  maximumFractionDigits: 0,\n});\n\nconst truncatedFormatters = new Map<number, Intl.NumberFormat>();\n\nconst getTruncatedFormatter = (maximumFractionDigits: number) => {\n  const cached = truncatedFormatters.get(maximumFractionDigits);\n  if (cached) return cached;\n\n  const formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits });\n  truncatedFormatters.set(maximumFractionDigits, formatter);\n  return formatter;\n};\n",
    )
    formatter = formatter.replace(
        "  format(value: number) {\n    if (!Number.isFinite(value)) return '—';\n    return (Math.abs(value) >= 1000 ? largeNumber : detailedNumber).format(value);\n  },\n",
        "  format(value: number) {\n    if (!Number.isFinite(value)) return '—';\n    return (Math.abs(value) >= 1000 ? largeNumber : detailedNumber).format(value);\n  },\n  formatTruncated(value: number, maximumFractionDigits = 2) {\n    if (!Number.isFinite(value)) return '—';\n\n    const digits = Math.min(6, Math.max(0, Math.trunc(maximumFractionDigits)));\n    const factor = 10 ** digits;\n    const epsilon = Math.sign(value || 1) * Number.EPSILON * Math.max(1, Math.abs(value));\n    const truncated = Math.trunc((value + epsilon) * factor) / factor;\n\n    return getTruncatedFormatter(digits).format(truncated);\n  },\n",
    )
    formatter_path.write_text(formatter, encoding='utf-8')

calculator = calculator_path.read_text(encoding='utf-8')
replacements = {
    'number.format(result.requiredPowerKwp)': 'number.formatTruncated(result.requiredPowerKwp, 2)',
    'number.format((moduleQuantity * parseNumber(modulePowerW)) / 1000)': 'number.formatTruncated((moduleQuantity * parseNumber(modulePowerW)) / 1000, 2)',
    'number.format(kit.kit_power_kwp)': 'number.formatTruncated(kit.kit_power_kwp, 2)',
    'number.format(selectedKit.kit_power_kwp)': 'number.formatTruncated(selectedKit.kit_power_kwp, 2)',
    'number.format(selectedKit.inverter_power_kw)': 'number.formatTruncated(selectedKit.inverter_power_kw, 2)',
    'number.format(selectedKitOversizing.dcPowerKwp)': 'number.formatTruncated(selectedKitOversizing.dcPowerKwp, 2)',
    'number.format(selectedKitOversizing.acPowerKw)': 'number.formatTruncated(selectedKitOversizing.acPowerKw, 2)',
}

for old, new in replacements.items():
    calculator = calculator.replace(old, new)

calculator_path.write_text(calculator, encoding='utf-8')

test_path.write_text("""import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { technicalNumber } from '../src/lib/formatters/technicalNumber';

const CALCULATOR = 'src/pages/propostas/ProfessionalSizingCalculatorView.tsx';

test('trunca potência em duas casas sem alterar o valor calculado', () => {
  assert.equal(technicalNumber.formatTruncated(4.556, 2), '4,55');
  assert.equal(technicalNumber.formatTruncated(4.559, 2), '4,55');
  assert.equal(technicalNumber.formatTruncated(4.5, 2), '4,5');
  assert.equal(technicalNumber.formatTruncated(-4.556, 2), '-4,55');
  assert.equal(technicalNumber.format(4.556), '4,556');
});

test('potências da calculadora usam truncamento visual de duas casas', async () => {
  const source = await readFile(CALCULATOR, 'utf8');

  assert.match(source, /formatTruncated\(result\.requiredPowerKwp, 2\)/);
  assert.match(source, /formatTruncated\(\(moduleQuantity \* parseNumber\(modulePowerW\)\) \/ 1000, 2\)/);
  assert.match(source, /formatTruncated\(selectedKit\.kit_power_kwp, 2\)/);
  assert.match(source, /formatTruncated\(selectedKitOversizing\.dcPowerKwp, 2\)/);
});
""", encoding='utf-8')
