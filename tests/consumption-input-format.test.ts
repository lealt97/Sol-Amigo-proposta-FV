import assert from 'node:assert/strict';
import test from 'node:test';
import { parseConsumptionKwhInput } from '../src/lib/formatters/parseConsumptionKwhInput';

test('interpreta consumo digitado nos formatos brasileiros e simples', () => {
  assert.equal(parseConsumptionKwhInput('1200'), 1200);
  assert.equal(parseConsumptionKwhInput('1.200'), 1200);
  assert.equal(parseConsumptionKwhInput('1.200,50'), 1200.5);
  assert.equal(parseConsumptionKwhInput('1200,50'), 1200.5);
  assert.equal(parseConsumptionKwhInput('1200.50'), 1200.5);
  assert.equal(parseConsumptionKwhInput(' 1 200,5 '), 1200.5);
});

test('rejeita entradas vazias e formatos ambíguos inválidos', () => {
  assert.equal(Number.isNaN(parseConsumptionKwhInput('')), true);
  assert.equal(Number.isNaN(parseConsumptionKwhInput('1.2.3')), true);
  assert.equal(Number.isNaN(parseConsumptionKwhInput('abc')), true);
});
