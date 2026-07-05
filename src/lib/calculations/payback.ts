import { PaybackCalculationInput, PaybackCalculationResult, TabelaRetornoAno } from '../../types/payback';

export function calcularPayback(input: PaybackCalculationInput): PaybackCalculationResult | null {
  const { investimentoTotal, economiaMensal, economiaAnual } = input;

  if (economiaAnual <= 0 || investimentoTotal <= 0) {
    return null;
  }

  const paybackDecimal = investimentoTotal / economiaAnual;
  const paybackAnos = Math.floor(paybackDecimal);
  const paybackMeses = Math.round((paybackDecimal - paybackAnos) * 12);
  
  let paybackFormatado = '';
  if (paybackAnos > 0) {
    paybackFormatado += `${paybackAnos} ano${paybackAnos > 1 ? 's' : ''}`;
  }
  if (paybackMeses > 0) {
    if (paybackFormatado) paybackFormatado += ' e ';
    paybackFormatado += `${paybackMeses} mês${paybackMeses > 1 ? 'es' : ''}`;
  }
  if (!paybackFormatado) {
    paybackFormatado = 'Imediato';
  }

  const retorno25Anos = economiaAnual * 25;
  const economiaLiquida25Anos = retorno25Anos - investimentoTotal;

  const tabelaRetorno: TabelaRetornoAno[] = [];
  for (let ano = 0; ano <= 25; ano++) {
    const retornoAno = economiaAnual * ano;
    tabelaRetorno.push({
      ano,
      retorno: retornoAno,
      investimento: investimentoTotal,
      diferenca: retornoAno - investimentoTotal
    });
  }

  return {
    paybackAnos,
    paybackMeses,
    paybackFormatado,
    retorno25Anos,
    economiaAcumulada: retorno25Anos,
    economiaLiquida25Anos,
    tabelaRetorno
  };
}
