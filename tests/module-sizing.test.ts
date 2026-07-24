import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateModuleSizing } from '../src/lib/calculations/moduleSizing';

test('calcula 17 módulos de 275 Wp para potência necessária de 4,556 kWp', () => {
  const result = calculateModuleSizing({
    requiredPowerKwp: 4.556,
    modulePowerW: 275,
    moduleWidthM: 1,
    moduleHeightM: 1.65,
    roofAreaM2: 30,
  });

  assert.equal(result.moduleQuantity, 17);
  assert.equal(result.installedPowerKwp, 4.675);
  assert.equal(result.moduleAreaM2, 1.65);
  assert.equal(result.totalModuleAreaM2, 28.05);
  assert.equal(result.roofAreaM2, 30);
  assert.equal(result.availableAreaBalanceM2, 1.95);
  assert.equal(result.modulesFitRoof, true);
});

test('informa quando a área dos módulos não cabe no telhado', () => {
  const result = calculateModuleSizing({
    requiredPowerKwp: 4.556,
    modulePowerW: 275,
    moduleWidthM: 1,
    moduleHeightM: 1.65,
    roofAreaM2: 20,
  });

  assert.equal(result.moduleQuantity, 17);
  assert.equal(result.totalModuleAreaM2, 28.05);
  assert.equal(result.roofAreaM2, 20);
  assert.equal(result.availableAreaBalanceM2, -8.05);
  assert.equal(result.modulesFitRoof, false);
});

test('rejeita potência e dimensões inválidas', () => {
  assert.throws(
    () => calculateModuleSizing({
      requiredPowerKwp: 4.556,
      modulePowerW: 0,
      moduleWidthM: 1,
      moduleHeightM: 1.65,
      roofAreaM2: 30,
    }),
    /Potência do módulo/,
  );
});
