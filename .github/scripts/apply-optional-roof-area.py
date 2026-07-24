from pathlib import Path

repo = Path('.')
calculator_path = repo / 'src/pages/propostas/ProfessionalSizingCalculatorView.tsx'
calculator = calculator_path.read_text(encoding='utf-8')

replacements = [
    (
        """      const moduleFields = [
        { value: parseNumber(modulePowerW), message: 'Informe a potência do módulo em Wp.' },
        { value: parseNumber(moduleWidthM), message: 'Informe a largura do módulo em metros.' },
        { value: parseNumber(moduleHeightM), message: 'Informe a altura do módulo em metros.' },
        { value: parseNumber(roofAreaM2), message: 'Informe a área do telhado em metros quadrados.' },
      ];
      const invalidModuleField = moduleFields.find((field) => !Number.isFinite(field.value) || field.value <= 0);
      if (invalidModuleField) {
        toast.error(invalidModuleField.message);
        return false;
      }
""",
        """      const moduleFields = [
        { value: parseNumber(modulePowerW), message: 'Informe a potência do módulo em Wp.' },
        { value: parseNumber(moduleWidthM), message: 'Informe a largura do módulo em metros.' },
        { value: parseNumber(moduleHeightM), message: 'Informe a altura do módulo em metros.' },
      ];
      const invalidModuleField = moduleFields.find((field) => !Number.isFinite(field.value) || field.value <= 0);
      if (invalidModuleField) {
        toast.error(invalidModuleField.message);
        return false;
      }

      if (roofAreaM2.trim()) {
        const parsedRoofArea = parseNumber(roofAreaM2);
        if (!Number.isFinite(parsedRoofArea) || parsedRoofArea <= 0) {
          toast.error('Quando informada, a área do telhado deve ser maior que zero.');
          return false;
        }
      }
""",
    ),
    (
        """    const values = {
      modulePowerW: parseNumber(modulePowerW),
      moduleWidthM: parseNumber(moduleWidthM),
      moduleHeightM: parseNumber(moduleHeightM),
      roofAreaM2: parseNumber(roofAreaM2),
    };

    if (Object.values(values).some((value) => !Number.isFinite(value) || value <= 0)) {
      return { result: null, error: null };
    }

    try {
      return {
        result: calculateModuleSizing({
          requiredPowerKwp: result.requiredPowerKwp,
          ...values,
        }),
""",
        """    const moduleValues = {
      modulePowerW: parseNumber(modulePowerW),
      moduleWidthM: parseNumber(moduleWidthM),
      moduleHeightM: parseNumber(moduleHeightM),
    };

    if (Object.values(moduleValues).some((value) => !Number.isFinite(value) || value <= 0)) {
      return { result: null, error: null };
    }

    if (!roofAreaM2.trim()) {
      return { result: null, error: null };
    }

    const parsedRoofArea = parseNumber(roofAreaM2);
    if (!Number.isFinite(parsedRoofArea) || parsedRoofArea <= 0) {
      return { result: null, error: 'Quando informada, a área do telhado deve ser maior que zero.' };
    }

    try {
      return {
        result: calculateModuleSizing({
          requiredPowerKwp: result.requiredPowerKwp,
          ...moduleValues,
          roofAreaM2: parsedRoofArea,
        }),
""",
    ),
    (
        """                    <Field label="Área do telhado" value={roofAreaM2} onChange={setRoofAreaM2} suffix="m²" min={0.01} step="0.01" />
""",
        """                    <Field
                      label="Área do telhado (opcional)"
                      value={roofAreaM2}
                      onChange={setRoofAreaM2}
                      suffix="m²"
                      min={0.01}
                      step="0.01"
                      helper="Preencha somente quando quiser validar se os módulos cabem na área útil disponível."
                    />
""",
    ),
]

for old, new in replacements:
    if old not in calculator:
        raise SystemExit(f'Trecho esperado não encontrado:\n{old}')
    calculator = calculator.replace(old, new, 1)

calculator_path.write_text(calculator, encoding='utf-8')

test_path = repo / 'tests/optional-roof-area.test.ts'
test_path.write_text("""import assert from 'node:assert/strict';
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
""", encoding='utf-8')
